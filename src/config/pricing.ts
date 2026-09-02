/**
 * Single source of truth for pricing. Every price, saving, and plan id shown
 * in the UI is derived from these values — nothing is hard-coded elsewhere.
 */

export type PlanId = "monthly" | "yearly";

export const CURRENCY_SYMBOL = "₹";

export const FREE_PAGES = 20;

export const PRICING = {
  monthlyPrice: 99,
  yearlyPrice: 999,
} as const;

export interface PlanConfig {
  id: PlanId;
  name: string;
  price: number;
  /** Human label for the billing period, e.g. "/month" */
  period: string;
  ctaLabel: string;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  monthly: {
    id: "monthly",
    name: "Monthly",
    price: PRICING.monthlyPrice,
    period: "/month",
    ctaLabel: "Get monthly",
  },
  yearly: {
    id: "yearly",
    name: "Yearly",
    price: PRICING.yearlyPrice,
    period: "/year",
    ctaLabel: "Get yearly",
  },
};

/** What paying monthly for a full year would cost, derived — never hard-coded. */
export function annualCostIfPaidMonthly(): number {
  return PRICING.monthlyPrice * 12;
}

/** Rupees saved per year by choosing the yearly plan over 12 monthly payments. */
export function annualSaving(): number {
  return annualCostIfPaidMonthly() - PRICING.yearlyPrice;
}

/** Percentage saved by choosing yearly, rounded to the nearest whole percent. */
export function annualSavingPercent(): number {
  return Math.round((annualSaving() / annualCostIfPaidMonthly()) * 100);
}

/** Yearly price expressed as an approximate effective monthly cost. */
export function yearlyEquivalentMonthly(): number {
  return Math.round(PRICING.yearlyPrice / 12);
}

export function formatPrice(amount: number): string {
  return `${CURRENCY_SYMBOL}${amount.toLocaleString("en-IN")}`;
}
