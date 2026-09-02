# Payment Setup — Razorpay Subscriptions (Test Mode)

This landing page sells two **subscription** plans for the Manga Manhwa
Downloader extension and updates the **same** Supabase project the extension
already uses (`kmvbqjlsiwhivxhmgdqt`). Payment is handled by **Razorpay
Subscriptions**; entitlement is written **server-side only**.

> This file contains **no secrets** — only variable names, placeholders, and
> steps. Never commit real keys.

Fixed pricing (do not change): **Monthly ₹99/month**, **Yearly ₹999/year**.
Free tier stays at exactly **20 page downloads per account** (no time trial).

---

## Architecture at a glance

```
Pricing card (browser)  ──sends only {plan:"monthly"|"yearly"}──▶  /api/payments/create-subscription
                                                                       │  (server maps plan→plan id, price)
                                                                       ▼
                                                            Razorpay: create Subscription
                                                                       │
        Razorpay Checkout (public Key ID + subscription_id)  ◀─────────┘
                    │ returns payment_id, subscription_id, signature
                    ▼
            /api/payments/verify  ──HMAC(payment_id|subscription_id, KEY_SECRET)──▶ verified? then read live sub
                    │                                                                      │
                    ▼                                                                      ▼
        Razorpay ──webhook──▶ /api/webhooks/razorpay ──verify raw-body HMAC──▶ apply_subscription_event()
                                                                                          │ (service role)
                                                                                          ▼
                                                                         Supabase user_entitlements
                                                                                          │
                                                              extension get_entitlement() reads premium
```

The webhook is the **authoritative** source of entitlement. `verify` gives the
user instant feedback but never grants premium on the browser's word — it only
proceeds after the server confirms the signature.

---

## 1. Razorpay Test Mode

1. Log in to the Razorpay Dashboard and switch to **Test Mode** (toggle, top).
2. **Settings → API Keys → Generate Test Key.** Copy the **Key ID**
   (`rzp_test_…`) and **Key Secret**. The secret is shown once — store it in
   your password manager, not in this repo.

## 2. Create the Monthly plan (₹99/month)

**Subscriptions → Plans → Create Plan** (in Test Mode):

- Billing frequency: **Monthly**, interval **1**
- Amount: **₹99** (Razorpay stores this as **9900 paise**)
- Currency: **INR**
- Description: `Manga Manhwa Downloader — Monthly`

Copy the resulting **Plan ID** (`plan_…`).

## 3. Create the Yearly plan (₹999/year)

Create a second plan:

- Billing frequency: **Yearly**, interval **1**
- Amount: **₹999** (**99900 paise**)
- Currency: **INR**
- Description: `Manga Manhwa Downloader — Yearly`

Copy this **Plan ID** too.

> There is no admin script that creates plans, on purpose: creating plans
> requires the Key Secret, which must never sit in a runnable script in this
> repo. Create them once in the dashboard and paste the two IDs into config.

## 4. Where the Plan IDs and secrets go

All payment secrets are **server-side** environment variables for the
Cloudflare Pages Functions — never `VITE_*`, never in `.env`, never in the
browser bundle.

**Local development** — copy `.dev.vars.example` to `.dev.vars` (gitignored)
and fill in Test Mode values:

| Variable | Value |
| --- | --- |
| `RAZORPAY_KEY_ID` | `rzp_test_…` |
| `RAZORPAY_KEY_SECRET` | test key secret |
| `RAZORPAY_MONTHLY_PLAN_ID` | `plan_…` (monthly) |
| `RAZORPAY_YEARLY_PLAN_ID` | `plan_…` (yearly) |
| `RAZORPAY_WEBHOOK_SECRET` | see step 6 |
| `SUPABASE_URL` | `https://kmvbqjlsiwhivxhmgdqt.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role (secret) |

**Production** — set each with
`wrangler pages secret put <NAME>` or Cloudflare Dashboard → Pages → project →
Settings → Environment variables (mark as **Secret**).

The browser only ever receives the **public Key ID** (needed by Checkout) — it
is returned by `create-subscription`. The Key Secret, webhook secret, and
Supabase service-role key stay on the server.

## 5. Apply the database migration

The subscription write-path migration reuses the extension's existing
`user_entitlements` table and adds a server-only webhook ledger + writer
functions:

```
supabase/migrations/20260902090000_razorpay_subscriptions.sql
```

Apply it to the shared project with the Supabase CLI (from this folder, once
you are ready — this was **not** run automatically):

```bash
supabase db push
```

It creates `razorpay_webhook_events` (idempotency) and the
`link_pending_subscription` / `apply_subscription_event` functions. Both are
`SECURITY DEFINER` and are **not** granted to `anon`/`authenticated`; only the
service-role key can call them.

## 6. Webhook setup

1. **Settings → Webhooks → Add New Webhook** (Test Mode).
2. **URL:** `https://<your-pages-domain>/api/webhooks/razorpay`
   (locally, expose `wrangler pages dev` via a tunnel — see step 7).
3. **Secret:** set any strong random string. Put the **same** value in
   `RAZORPAY_WEBHOOK_SECRET`. The endpoint verifies `X-Razorpay-Signature`
   over the **raw** request body with this secret.
4. **Active events** (subscribe to all of these):
   - `subscription.authenticated`
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.pending`
   - `subscription.halted`
   - `subscription.cancelled`
   - `subscription.completed`
   - `subscription.paused`
   - `subscription.resumed`

## 7. Local development

```bash
npm install
npm run build          # produces dist/ (Pages serves it)
npx wrangler pages dev # serves dist/ + functions/ with .dev.vars loaded
```

`wrangler pages dev` runs the API under `/api/*` alongside the static site.
For Razorpay to reach your local webhook, expose it with a tunnel (e.g.
`cloudflared tunnel --url http://localhost:8788`) and use that HTTPS URL in the
webhook config. `npm run dev` (plain Vite) serves the UI but **not** the API.

## 8. Test payment procedure

1. Sign in on the site (Supabase auth from the previous phase).
2. Open **Pricing**, click **Get monthly** or **Get yearly**.
3. Razorpay Checkout opens. Use a **Test Mode** card, e.g. Razorpay's test
   card `4111 1111 1111 1111`, any future expiry, any CVV, and complete any
   test OTP prompt.
4. On success the page calls `/api/payments/verify`; after the server verifies
   the signature you see **"Unlimited access is active."**
5. The `subscription.activated` / `subscription.charged` webhook confirms and
   persists the entitlement authoritatively.
6. Cancel/expiry can be simulated from the Razorpay Dashboard (or via test
   webhooks) to confirm premium drops correctly (see below).

Do **not** use real cards or Live Mode in this phase.

## 9. How entitlement is updated

- `user_entitlements` holds `subscription_status`, `subscription_plan`,
  `current_period_start/end`, `cancel_at_period_end`, and the Razorpay ids.
- Premium is **derived** by the existing `cz_is_premium(...)` — it is never a
  stored boolean the client can flip. Premium = period not ended **and**
  (`active`, or `cancelled` with `cancel_at_period_end`).
- On **cancel at period end**, premium is retained until `current_period_end`,
  then drops automatically.
- The extension reads the same row via `get_entitlement()`, so after payment
  the user just refreshes the extension to see unlimited access.

## 10. Security notes

- No secret is in the client bundle (verified: `dist` contains no
  `service_role`, `KEY_SECRET`, `WEBHOOK_SECRET`, or `plan_…` id).
- The browser sends only the plan **name**; the server fixes price and plan id.
- Identity always comes from the verified Supabase JWT, never a body `user_id`.
- Webhook signatures are checked over the **raw** body; processing is
  idempotent (unique `event_id`) and monotonic (stale events cannot downgrade
  newer state).

## 11. Production go-live checklist

- [ ] Recreate both plans in **Live Mode**; copy the live Plan IDs.
- [ ] Set live `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` (and live plan IDs) as
      Cloudflare Pages **secrets** — never in the repo.
- [ ] Create a **Live Mode** webhook to the production
      `/api/webhooks/razorpay` URL with a fresh `RAZORPAY_WEBHOOK_SECRET`.
- [ ] Set the production `SUPABASE_SERVICE_ROLE_KEY` as a Pages secret.
- [ ] Run `supabase db push` against the production project (migration applied).
- [ ] Confirm the extension reads premium after a real charge.
- [ ] Rotate any secret that was ever pasted outside a secret store.
```
