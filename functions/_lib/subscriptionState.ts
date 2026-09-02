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
