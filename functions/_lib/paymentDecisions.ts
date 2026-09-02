import { isPremium, type EntitlementStatus } from "./subscriptionState";

/**
 * Pure decision helpers used by create-subscription, extracted so the
 * duplicate-prevention rules are unit-testable without the Workers runtime.
 * The endpoint imports these directly, so the tests exercise the real logic.
 */

export interface EntitlementSnapshot {
  subscription_status: string;
  current_period_end: string | null;
  razorpay_subscription_id: string | null;
}

/**
 * True when the user is already premium and must not be sold a second
 * subscription (-> 409 "already active").
 */
export function isDuplicateActive(
  row: EntitlementSnapshot | null,
  now = Date.now()
): boolean {
  if (!row) return false;
  return isPremium({
    status: row.subscription_status as EntitlementStatus,
    currentPeriodEnd: row.current_period_end
      ? Date.parse(row.current_period_end)
      : null,
    cancelAtPeriodEnd: false, // dup-check ignores grace; only true premium blocks
    now,
  });
}

/**
 * True when a subscription was already created for this user but has not yet
 * activated (status still 'none' with an id attached). A double-click should
 * REUSE that subscription rather than create a second one in Razorpay.
 */
export function shouldReusePending(row: EntitlementSnapshot | null): boolean {
  if (!row) return false;
  return (
    !!row.razorpay_subscription_id && row.subscription_status === "none"
  );
}
