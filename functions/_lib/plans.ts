import type { PaymentsEnv } from "./env";

/**
 * Server-authoritative plan catalog.
 *
 * The browser only ever sends {"plan":"monthly"} or {"plan":"yearly"}. The
 * server alone decides the price and the Razorpay plan id — the client can
 * never submit an arbitrary amount or an arbitrary Razorpay plan id.
 *
 * Prices are the finalized product prices and must not change:
 *   monthly = ₹99   → 9900 paise
 *   yearly  = ₹999  → 99900 paise
 */
export type PlanName = "monthly" | "yearly";

export interface PlanSpec {
  name: PlanName;
  /** Authoritative amount in paise (Razorpay's smallest currency unit). */
  amountPaise: number;
  currency: "INR";
  period: "monthly" | "yearly";
}

export const PLAN_CATALOG: Record<PlanName, PlanSpec> = {
  monthly: { name: "monthly", amountPaise: 9900, currency: "INR", period: "monthly" },
  yearly: { name: "yearly", amountPaise: 99900, currency: "INR", period: "yearly" },
};

/** Type guard: only the two known plan names are ever accepted. */
export function isValidPlan(value: unknown): value is PlanName {
  return value === "monthly" || value === "yearly";
}

/** Returns the plan spec for a validated name, or null for anything else. */
export function getPlanSpec(value: unknown): PlanSpec | null {
  return isValidPlan(value) ? PLAN_CATALOG[value] : null;
}

/**
 * Maps a plan name to its configured Razorpay plan id from server env.
 * Returns null for an unknown plan or a missing env value, so a
 * misconfiguration can never silently fall back to the wrong plan.
 */
export function resolveRazorpayPlanId(
  plan: PlanName,
  env: Pick<PaymentsEnv, "RAZORPAY_MONTHLY_PLAN_ID" | "RAZORPAY_YEARLY_PLAN_ID">
): string | null {
  const id =
    plan === "monthly"
      ? env.RAZORPAY_MONTHLY_PLAN_ID
      : plan === "yearly"
        ? env.RAZORPAY_YEARLY_PLAN_ID
        : "";
  return typeof id === "string" && id.trim().length > 0 ? id.trim() : null;
}

/**
 * Total billing cycles for a Razorpay subscription. Razorpay requires a finite
 * count; we use the platform maximum so the subscription effectively renews
 * indefinitely until cancelled.
 *   monthly: 120 cycles  (10 years of monthly charges)
 *   yearly:  10 cycles   (10 years of yearly charges)
 */
export function totalCyclesFor(plan: PlanName): number {
  return plan === "monthly" ? 120 : 10;
}
