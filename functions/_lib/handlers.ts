import type { PaymentsEnv } from "./env";
import { isPaymentsConfigured } from "./env";
import { errorResponse, json, ok, readJson } from "./http";
import {
  verifySubscriptionSignature,
  verifyWebhookSignature,
} from "./crypto";
import {
  createSubscription,
  epochSecondsToIso,
  fetchSubscription,
} from "./razorpay";
import { getPlanSpec, resolveRazorpayPlanId, totalCyclesFor } from "./plans";
import {
  adminClient,
  getEntitlementRow,
  getUserFromRequest,
} from "./supabaseAdmin";
import { isDuplicateActive, shouldReusePending } from "./paymentDecisions";
import {
  buildEntitlementUpdateFromWebhook,
  isHandledEvent,
  isPremium,
  type RazorpaySubscriptionEntity,
} from "./subscriptionState";

/**
 * Runtime-agnostic request handlers for the payment API.
 *
 * Each function is a plain `(request, env) => Promise<Response>`, so the exact
 * same logic can be served BOTH by:
 *   - a Cloudflare Worker `fetch` entry (functions are dispatched by the
 *     router in worker/index.ts), and
 *   - Cloudflare Pages Functions (the thin wrappers in functions/api/**).
 *
 * The business logic (auth, Razorpay, Supabase, signature verification) is
 * unchanged — it was simply lifted out of the Pages `context` wrappers so it
 * is not tied to one deployment model.
 */

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/* ---------------------------------------------------------------------------
 * POST /api/payments/create-subscription
 * ------------------------------------------------------------------------- */
interface CreateBody {
  plan?: unknown;
}

export async function handleCreateSubscription(
  request: Request,
  env: PaymentsEnv
): Promise<Response> {
  if (!isPaymentsConfigured(env)) {
    return errorResponse(500, "not_configured", "Payments are not configured on the server.");
  }

  const user = await getUserFromRequest(request, env);
  if (!user) {
    return errorResponse(401, "auth_required", "You must be signed in to subscribe.");
  }

  const body = await readJson<CreateBody>(request);
  const spec = getPlanSpec(body?.plan);
  if (!spec) {
    return errorResponse(400, "invalid_plan", "Choose the monthly or yearly plan.");
  }

  const planId = resolveRazorpayPlanId(spec.name, env);
  if (!planId) {
    return errorResponse(500, "not_configured", "That plan is not configured on the server.");
  }

  // -- Duplicate prevention -------------------------------------------------
  const existing = await getEntitlementRow(env, user.id);
  if (existing) {
    if (isDuplicateActive(existing)) {
      return errorResponse(409, "already_active", "Your plan is already active.");
    }
    // Pending checkout mid-flight: reuse instead of creating a duplicate.
    if (shouldReusePending(existing)) {
      return ok({
        subscription_id: existing.razorpay_subscription_id,
        key_id: env.RAZORPAY_KEY_ID,
        plan: existing.subscription_plan ?? spec.name,
        reused: true,
      });
    }
  }

  // -- Create the subscription in Razorpay ---------------------------------
  const created = await createSubscription(env, {
    planId,
    totalCount: totalCyclesFor(spec.name),
    userId: user.id,
    userEmail: user.email,
  });

  if (!created.ok) {
    return errorResponse(502, "razorpay_error", "Could not start checkout. Please try again.");
  }

  const subscription = created.subscription;

  // -- Record the pending subscription (no premium granted here) -----------
  const admin = adminClient(env);
  const { error: linkError } = await admin.rpc("link_pending_subscription", {
    p_user_id: user.id,
    p_subscription_id: subscription.id,
    p_plan: spec.name,
    p_customer_id: subscription.customer_id ?? null,
  });

  if (linkError) {
    return errorResponse(500, "link_failed", "Could not start checkout. Please try again.");
  }

  return ok({
    subscription_id: subscription.id,
    key_id: env.RAZORPAY_KEY_ID,
    plan: spec.name,
  });
}

/* ---------------------------------------------------------------------------
 * POST /api/payments/verify
 * ------------------------------------------------------------------------- */
interface VerifyBody {
  razorpay_payment_id?: unknown;
  razorpay_subscription_id?: unknown;
  razorpay_signature?: unknown;
}

export async function handleVerify(
  request: Request,
  env: PaymentsEnv
): Promise<Response> {
  if (!isPaymentsConfigured(env)) {
    return errorResponse(500, "not_configured", "Payments are not configured on the server.");
  }

  const user = await getUserFromRequest(request, env);
  if (!user) {
    return errorResponse(401, "auth_required", "You must be signed in.");
  }

  const body = await readJson<VerifyBody>(request);
  const paymentId = asString(body?.razorpay_payment_id);
  const subscriptionId = asString(body?.razorpay_subscription_id);
  const signature = asString(body?.razorpay_signature);

  if (!paymentId || !subscriptionId || !signature) {
    return errorResponse(400, "invalid_request", "Missing verification fields.");
  }

  // -- 1. Signature check ---------------------------------------------------
  const valid = await verifySubscriptionSignature({
    paymentId,
    subscriptionId,
    signature,
    keySecret: env.RAZORPAY_KEY_SECRET,
  });
  if (!valid) {
    return errorResponse(400, "invalid_signature", "Payment could not be verified.");
  }

  // -- 2. The subscription must be the one we created for this user ---------
  const existing = await getEntitlementRow(env, user.id);
  if (!existing || existing.razorpay_subscription_id !== subscriptionId) {
    return errorResponse(
      409,
      "subscription_mismatch",
      "This subscription is not associated with your account."
    );
  }

  // -- 3. Read authoritative state from Razorpay and apply it ---------------
  const subscription = await fetchSubscription(env, subscriptionId);
  if (!subscription) {
    return ok({ verified: true, processing: true });
  }

  const admin = adminClient(env);
  await admin.rpc("apply_subscription_event", {
    p_subscription_id: subscription.id,
    p_user_id: user.id,
    p_rzp_status: subscription.status,
    p_plan: existing.subscription_plan,
    p_current_period_start: epochSecondsToIso(subscription.current_start),
    p_current_period_end: epochSecondsToIso(subscription.current_end),
    p_cancel_at_period_end: null,
    p_customer_id: subscription.customer_id ?? null,
    p_event_time: new Date().toISOString(),
  });

  const updated = await getEntitlementRow(env, user.id);
  const premiumNow = updated
    ? isPremium({
        status: updated.subscription_status as never,
        currentPeriodEnd: updated.current_period_end
          ? Date.parse(updated.current_period_end)
          : null,
        cancelAtPeriodEnd: updated.cancel_at_period_end,
      })
    : false;

  return ok({
    verified: true,
    is_premium: premiumNow,
    subscription_status: updated?.subscription_status ?? "none",
    subscription_plan: updated?.subscription_plan ?? null,
  });
}

/* ---------------------------------------------------------------------------
 * GET /api/payments/status
 * ------------------------------------------------------------------------- */
export async function handleStatus(
  request: Request,
  env: PaymentsEnv
): Promise<Response> {
  if (!isPaymentsConfigured(env)) {
    return errorResponse(500, "not_configured", "Payments are not configured on the server.");
  }

  const user = await getUserFromRequest(request, env);
  if (!user) {
    return errorResponse(401, "auth_required", "You must be signed in.");
  }

  const row = await getEntitlementRow(env, user.id);
  const premiumNow = row
    ? isPremium({
        status: row.subscription_status as never,
        currentPeriodEnd: row.current_period_end
          ? Date.parse(row.current_period_end)
          : null,
        cancelAtPeriodEnd: row.cancel_at_period_end,
      })
    : false;

  return json({
    ok: true,
    is_premium: premiumNow,
    subscription_status: row?.subscription_status ?? "none",
    subscription_plan: row?.subscription_plan ?? null,
    current_period_end: row?.current_period_end ?? null,
    cancel_at_period_end: row?.cancel_at_period_end ?? false,
  });
}

/* ---------------------------------------------------------------------------
 * POST /api/webhooks/razorpay
 * ------------------------------------------------------------------------- */
interface RazorpayWebhookPayload {
  event?: string;
  created_at?: number; // epoch seconds
  payload?: {
    subscription?: { entity?: RazorpaySubscriptionEntity };
    [key: string]: unknown;
  };
}

/** Stable event id: prefer Razorpay's header, else a SHA-256 of the raw body. */
async function deriveEventId(request: Request, rawBody: string): Promise<string> {
  const header = request.headers.get("x-razorpay-event-id");
  if (header && header.trim()) return header.trim();
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(rawBody)
  );
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return `sha256:${hex}`;
}

export async function handleWebhook(
  request: Request,
  env: PaymentsEnv
): Promise<Response> {
  if (!isPaymentsConfigured(env)) {
    return errorResponse(500, "not_configured", "Payments are not configured on the server.");
  }

  // 1. RAW body first — must not be parsed/re-stringified before hashing.
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";

  // 2. Signature verification.
  const valid = await verifyWebhookSignature({
    rawBody,
    signature,
    webhookSecret: env.RAZORPAY_WEBHOOK_SECRET,
  });
  if (!valid) {
    return errorResponse(400, "invalid_signature", "Invalid webhook signature.");
  }

  let event: RazorpayWebhookPayload;
  try {
    event = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return ok({ ignored: true, reason: "unparseable" });
  }

  const eventType = event.event ?? "";
  const subscription = event.payload?.subscription?.entity ?? null;
  const eventId = await deriveEventId(request, rawBody);
  const eventTimeIso =
    typeof event.created_at === "number" && event.created_at > 0
      ? new Date(event.created_at * 1000).toISOString()
      : new Date().toISOString();

  const admin = adminClient(env);

  // 3. Idempotency: record the event first (unique event_id -> code 23505).
  const { error: insertError } = await admin
    .from("razorpay_webhook_events")
    .insert({
      event_id: eventId,
      event_type: eventType,
      subscription_id: subscription?.id ?? null,
      event_time: eventTimeIso,
      payload: event as unknown as Record<string, unknown>,
    });

  if (insertError) {
    if (insertError.code === "23505") {
      return ok({ duplicate: true });
    }
    return errorResponse(500, "ledger_error", "Could not record the event.");
  }

  // 4. Apply handled subscription events to entitlement.
  if (!subscription || !isHandledEvent(eventType)) {
    return ok({ handled: false, event: eventType });
  }

  const update = buildEntitlementUpdateFromWebhook(eventType, subscription);
  if (!update) {
    return ok({ handled: false, event: eventType });
  }

  const { error: applyError } = await admin.rpc("apply_subscription_event", {
    p_subscription_id: subscription.id ?? null,
    p_user_id: null,
    p_rzp_status: update.rzpStatus,
    p_plan: null,
    p_current_period_start: update.currentPeriodStartIso,
    p_current_period_end: update.currentPeriodEndIso,
    p_cancel_at_period_end: update.cancelAtPeriodEnd,
    p_customer_id: update.customerId,
    p_event_time: eventTimeIso,
  });

  if (applyError) {
    await admin.from("razorpay_webhook_events").delete().eq("event_id", eventId);
    return errorResponse(500, "apply_error", "Could not apply the event.");
  }

  return ok({ handled: true, event: eventType });
}
