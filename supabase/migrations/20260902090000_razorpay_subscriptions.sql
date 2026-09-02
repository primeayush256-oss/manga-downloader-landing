-- ===========================================================================
-- Manga Manhwa Downloader — Razorpay subscription write path
-- ===========================================================================
-- Builds ON TOP of 20260901120000_monetization_foundation.sql (which the
-- Chrome extension already ships). It REUSES public.user_entitlements — the
-- columns razorpay_customer_id, razorpay_subscription_id, subscription_status,
-- subscription_plan, current_period_start/end and cancel_at_period_end already
-- exist there. Nothing about the free-page / reserve_pages logic is touched.
--
-- What this migration adds:
--   * webhook_events           — idempotency ledger for Razorpay webhooks
--   * link_pending_subscription() — records a just-created subscription
--   * apply_subscription_event()  — the ONLY path that flips premium on/off
--
-- Security model is identical to the foundation migration:
--   * Clients get NO insert/update/delete. Both functions are SECURITY
--     DEFINER with a locked search_path and are NOT granted to anon /
--     authenticated. They are callable only with the service-role key from
--     the server (Cloudflare Pages Functions), never from the browser.
--   * Premium is still DERIVED by public.cz_is_premium(...). This migration
--     only writes the raw subscription columns that predicate reads, so the
--     "keep premium until period end when cancelled at period end" rule keeps
--     working with no duplication.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. webhook_events — idempotency + audit for Razorpay webhooks
-- ---------------------------------------------------------------------------
-- Razorpay can deliver the same event more than once. We insert one row per
-- event id BEFORE acting on it; a duplicate insert violates the unique
-- constraint and tells the handler to skip. Also stores enough to debug and
-- to enforce status ordering.
create table if not exists public.razorpay_webhook_events (
  id            uuid        primary key default gen_random_uuid(),

  -- Razorpay's event identity. `event_id` is the x-razorpay-event-id header;
  -- when absent we fall back to a hash of the payload (computed server-side).
  event_id      text        not null,
  event_type    text        null,

  subscription_id text      null,
  -- Razorpay's `created_at` (epoch seconds) for the event, so an older event
  -- arriving late cannot overwrite a newer subscription state.
  event_time    timestamptz null,

  payload       jsonb       null,
  processed_at  timestamptz not null default now(),

  constraint razorpay_webhook_events_event_id_key unique (event_id)
);

comment on table public.razorpay_webhook_events is
  'Idempotency ledger for Razorpay webhook deliveries. A duplicate event_id insert fails the unique constraint, so each event is processed at most once.';

create index if not exists razorpay_webhook_events_subscription_idx
  on public.razorpay_webhook_events (subscription_id, event_time);

-- ---------------------------------------------------------------------------
-- 2. Map a Razorpay subscription status to our entitlement status
-- ---------------------------------------------------------------------------
-- Razorpay subscription statuses:
--   created, authenticated, active, pending, halted, cancelled,
--   completed, expired, paused, resumed (event)
-- Our user_entitlements.subscription_status CHECK allows:
--   'none','active','past_due','cancelled','expired'
create or replace function public.cz_map_rzp_status(p_rzp_status text)
returns text
language sql
immutable
security invoker
set search_path = ''
as $$
  select case lower(coalesce(p_rzp_status, ''))
    when 'active'        then 'active'
    when 'authenticated' then 'active'   -- authenticated + first charge imminent
    when 'resumed'       then 'active'
    when 'pending'       then 'past_due' -- a charge failed; retry window
    when 'halted'        then 'past_due' -- retries exhausted, not yet expired
    when 'paused'        then 'past_due'
    when 'cancelled'     then 'cancelled'
    when 'completed'     then 'expired'  -- tenure finished
    when 'expired'       then 'expired'
    else 'none'
  end;
$$;

comment on function public.cz_map_rzp_status(text) is
  'Maps a Razorpay subscription status to the user_entitlements.subscription_status vocabulary. Pure/immutable so it is trivially testable and cannot drift.';

-- ---------------------------------------------------------------------------
-- 3. link_pending_subscription — called by create-subscription
-- ---------------------------------------------------------------------------
-- Records the subscription id + customer id on the user's row at creation
-- time, BEFORE any payment. Status is left untouched (still 'none' until a
-- webhook/verify activates it) so this call never grants premium by itself.
create or replace function public.link_pending_subscription(
  p_user_id         uuid,
  p_subscription_id text,
  p_plan            text,
  p_customer_id     text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.user_entitlements;
begin
  if p_user_id is null then
    return jsonb_build_object('status', 'INVALID_REQUEST', 'reason', 'user_id required');
  end if;
  if p_subscription_id is null or length(btrim(p_subscription_id)) = 0 then
    return jsonb_build_object('status', 'INVALID_REQUEST', 'reason', 'subscription_id required');
  end if;
  if p_plan is null or p_plan not in ('monthly', 'yearly') then
    return jsonb_build_object('status', 'INVALID_REQUEST', 'reason', 'plan must be monthly or yearly');
  end if;

  -- Ensure the row exists (self-heal, same pattern as the foundation).
  insert into public.user_entitlements (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  update public.user_entitlements
     set razorpay_subscription_id = p_subscription_id,
         razorpay_customer_id     = coalesce(p_customer_id, razorpay_customer_id),
         subscription_plan        = p_plan
   where user_id = p_user_id
   returning * into v_row;

  return jsonb_build_object(
    'status',                   'OK',
    'user_id',                  v_row.user_id,
    'razorpay_subscription_id', v_row.razorpay_subscription_id,
    'subscription_plan',        v_row.subscription_plan,
    'subscription_status',      v_row.subscription_status
  );
end;
$$;

comment on function public.link_pending_subscription(uuid, text, text, text) is
  'Attaches a freshly-created Razorpay subscription id/customer id to the user row. Does NOT change subscription_status, so it never grants premium — activation only ever comes from apply_subscription_event via a verified webhook.';

-- ---------------------------------------------------------------------------
-- 4. apply_subscription_event — the ONLY function that flips premium
-- ---------------------------------------------------------------------------
-- Called by the verified webhook handler (service-role) with data already
-- pulled from Razorpay. Idempotent + monotonic:
--   * Finds the target row by razorpay_subscription_id (preferred) or user_id.
--   * Ignores an event whose event_time is OLDER than the last applied event
--     for that subscription, so a late/stale delivery cannot downgrade a newer
--     state (e.g. an old 'charged' arriving after a 'cancelled').
--   * Writes only the raw columns; premium stays derived by cz_is_premium.
create or replace function public.apply_subscription_event(
  p_subscription_id     text,
  p_user_id             uuid,
  p_rzp_status          text,
  p_plan                text,
  p_current_period_start timestamptz,
  p_current_period_end   timestamptz,
  p_cancel_at_period_end boolean,
  p_customer_id         text,
  p_event_time          timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row      public.user_entitlements;
  v_status   text := public.cz_map_rzp_status(p_rzp_status);
  v_last_evt timestamptz;
begin
  -- Locate the row: subscription id first (webhooks always carry it), then
  -- fall back to the explicit user id (used by the post-checkout verify call).
  if p_subscription_id is not null and length(btrim(p_subscription_id)) > 0 then
    select * into v_row
      from public.user_entitlements
     where razorpay_subscription_id = p_subscription_id
     for update;
  end if;

  if not found and p_user_id is not null then
    select * into v_row
      from public.user_entitlements
     where user_id = p_user_id
     for update;
  end if;

  if not found then
    return jsonb_build_object('status', 'NOT_FOUND');
  end if;

  -- Monotonicity guard: never let an older event overwrite newer state. We
  -- read the most recent applied event_time for this subscription from the
  -- webhook ledger; if the incoming event predates it, skip the write.
  if p_event_time is not null and v_row.razorpay_subscription_id is not null then
    select max(event_time) into v_last_evt
      from public.razorpay_webhook_events
     where subscription_id = v_row.razorpay_subscription_id
       and event_time is not null;

    if v_last_evt is not null and p_event_time < v_last_evt then
      return jsonb_build_object(
        'status',  'STALE_EVENT',
        'user_id', v_row.user_id,
        'ignored', true
      );
    end if;
  end if;

  update public.user_entitlements
     set subscription_status     = v_status,
         subscription_plan       = coalesce(p_plan, subscription_plan),
         current_period_start    = coalesce(p_current_period_start, current_period_start),
         current_period_end      = coalesce(p_current_period_end, current_period_end),
         cancel_at_period_end    = coalesce(p_cancel_at_period_end, cancel_at_period_end),
         razorpay_customer_id    = coalesce(p_customer_id, razorpay_customer_id),
         razorpay_subscription_id = coalesce(p_subscription_id, razorpay_subscription_id)
   where user_id = v_row.user_id
   returning * into v_row;

  return jsonb_build_object(
    'status',               'OK',
    'user_id',              v_row.user_id,
    'subscription_status',  v_row.subscription_status,
    'subscription_plan',    v_row.subscription_plan,
    'current_period_end',   v_row.current_period_end,
    'cancel_at_period_end', v_row.cancel_at_period_end,
    'is_premium',           public.cz_is_premium(
                              v_row.subscription_status,
                              v_row.current_period_end,
                              v_row.cancel_at_period_end
                            )
  );
end;
$$;

comment on function public.apply_subscription_event(text, uuid, text, text, timestamptz, timestamptz, boolean, text, timestamptz) is
  'Server-only entitlement writer for Razorpay lifecycle events. Idempotent and monotonic (ignores events older than the last applied one). Premium remains derived via cz_is_premium.';

-- ---------------------------------------------------------------------------
-- 5. Privileges — server-only, no client access
-- ---------------------------------------------------------------------------
alter table public.razorpay_webhook_events enable row level security;
-- No policies at all: RLS denies every client read/write. Only the
-- service-role key (which bypasses RLS) may touch this table.

revoke all on public.razorpay_webhook_events from anon, authenticated;

revoke all on function public.link_pending_subscription(uuid, text, text, text)
  from public, anon, authenticated;
revoke all on function public.apply_subscription_event(text, uuid, text, text, timestamptz, timestamptz, boolean, text, timestamptz)
  from public, anon, authenticated;
revoke all on function public.cz_map_rzp_status(text)
  from public, anon;

-- cz_map_rzp_status is a harmless pure mapper; allow authenticated to call it
-- if ever useful, but the two writer functions stay service-role only.
grant execute on function public.cz_map_rzp_status(text) to authenticated;
