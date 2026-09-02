/**
 * Pure subscription-state logic, mirrored from the SQL so it can be unit
 * tested in JS and reasoned about independently of the database.
 *
 * The database (cz_map_rzp_status + cz_is_premium) remains the single source
 * of truth at write time; this module exists so the webhook handler can decide
 * WHICH events to act on and so the mapping is covered by fast unit tests.
 */

/** Our entitlement vocabulary (matches user_entitlements.subscription_status). */
export type EntitlementStatus =
  | "none"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired";

/**
 * Maps a Razorpay subscription status to our entitlement status.
 * Kept byte-identical in meaning to public.cz_map_rzp_status in SQL.
 */
export function mapRazorpayStatus(rzpStatus: string | null | undefined): EntitlementStatus {
  switch ((rzpStatus ?? "").toLowerCase()) {
    case "active":
    case "authenticated":
    case "resumed":
      return "active";
    case "pending":
    case "halted":
    case "paused":
      return "past_due";
    case "cancelled":
      return "cancelled";
    case "completed":
    case "expired":
      return "expired";
    default:
      return "none";
  }
}

/**
 * Premium predicate, mirrored from public.cz_is_premium.
 *
 * Premium when the paid period has not ended AND the subscription is either
 * active, or cancelled-but-still-inside the paid period (grace). 'past_due'
 * and 'expired' are deliberately NOT premium.
 */
export function isPremium(params: {
  status: EntitlementStatus;
  currentPeriodEnd: number | null; // epoch ms, or null
  cancelAtPeriodEnd: boolean;
  now?: number;
}): boolean {
  const { status, currentPeriodEnd, cancelAtPeriodEnd } = params;
  const now = params.now ?? Date.now();
  const periodOk = currentPeriodEnd === null || currentPeriodEnd > now;
  const statusOk =
    status === "active" || (status === "cancelled" && cancelAtPeriodEnd === true);
  return periodOk && statusOk;
}

/**
 * The Razorpay webhook events we act on, and how each maps onto a subscription
 * status for apply_subscription_event. Events not in this set are acknowledged
 * (200) but cause no entitlement change.
 */
const HANDLED_EVENTS: Record<string, string> = {
  "subscription.authenticated": "authenticated",
  "subscription.activated": "active",
  "subscription.charged": "active",
  "subscription.resumed": "active",
  "subscription.pending": "pending",
  "subscription.halted": "halted",
  "subscription.paused": "paused",
  "subscription.cancelled": "cancelled",
  "subscription.completed": "completed",
  "subscription.expired": "expired",
};

export function isHandledEvent(eventType: string): boolean {
  return Object.prototype.hasOwnProperty.call(HANDLED_EVENTS, eventType);
}

/**
 * Given a webhook event type and the subscription object Razorpay sent, decide
 * the Razorpay status to apply. We prefer the subscription object's own
 * `status` field (authoritative) and fall back to the event-implied status.
 */
export function statusForEvent(
  eventType: string,
  subscriptionStatus: string | null | undefined
): string | null {
  if (!isHandledEvent(eventType)) return null;
  return (subscriptionStatus && subscriptionStatus.length > 0
    ? subscriptionStatus
    : HANDLED_EVENTS[eventType]) as string;
}

/** Shape of the Razorpay subscription entity fields the webhook consumes. */
export interface RazorpaySubscriptionEntity {
  id?: string;
  status?: string;
  current_start?: number | null; // epoch seconds
  current_end?: number | null; // epoch seconds
  end_at?: number | null; // epoch seconds — scheduled end (cancel at period end)
  customer_id?: string | null;
  [key: string]: unknown;
}

/** The arguments passed to apply_subscription_event, derived purely. */
export interface EntitlementUpdate {
  rzpStatus: string;
  currentPeriodStartIso: string | null;
  currentPeriodEndIso: string | null;
  cancelAtPeriodEnd: boolean;
  customerId: string | null;
}

function epochToIso(sec: number | null | undefined): string | null {
  if (typeof sec !== "number" || !Number.isFinite(sec) || sec <= 0) return null;
  return new Date(sec * 1000).toISOString();
}

/**
 * Pure translation of a webhook event + subscription entity into the values
 * apply_subscription_event needs. This is where the "cancel at period end"
 * grace decision is made, so it can be unit tested directly:
 *
 *   - On subscription.cancelled, if the subscription still has time left on
 *     the current period (current_end / end_at in the future), we set
 *     cancelAtPeriodEnd = true so cz_is_premium keeps the user premium until
 *     the period ends. If it has already ended, cancelAtPeriodEnd = false and
 *     premium drops immediately.
 *   - For every other handled event, cancelAtPeriodEnd is false.
 *
 * Returns null for events we do not handle.
 */
export function buildEntitlementUpdateFromWebhook(
  eventType: string,
  sub: RazorpaySubscriptionEntity,
  now: number = Date.now()
): EntitlementUpdate | null {
  const rzpStatus = statusForEvent(eventType, sub.status);
  if (rzpStatus === null) return null;

  const periodEndSec =
    typeof sub.current_end === "number" && sub.current_end > 0
      ? sub.current_end
      : typeof sub.end_at === "number" && sub.end_at > 0
        ? sub.end_at
        : null;

  let cancelAtPeriodEnd = false;
  if (mapRazorpayStatus(rzpStatus) === "cancelled") {
    cancelAtPeriodEnd = periodEndSec !== null && periodEndSec * 1000 > now;
  }

  return {
    rzpStatus,
    currentPeriodStartIso: epochToIso(sub.current_start),
    currentPeriodEndIso: epochToIso(periodEndSec),
    cancelAtPeriodEnd,
    customerId: sub.customer_id ?? null,
  };
}
