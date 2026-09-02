import { describe, expect, it } from "vitest";
import {
  FREE_PAGES,
  PLANS,
  PRICING,
  annualCostIfPaidMonthly,
  annualSaving,
  annualSavingPercent,
  formatPrice,
  yearlyEquivalentMonthly,
} from "./pricing";

describe("pricing config", () => {
  it("matches the source-of-truth values from the product brief", () => {
    expect(PRICING.monthlyPrice).toBe(99);
    expect(PRICING.yearlyPrice).toBe(999);
    expect(FREE_PAGES).toBe(20);
  });

  it("derives the cost of paying monthly for a full year", () => {
    expect(annualCostIfPaidMonthly()).toBe(1188);
  });

  it("derives the rupee saving from choosing yearly", () => {
    expect(annualSaving()).toBe(189);
  });

  it("derives an ~16% saving without exaggeration", () => {
    expect(annualSavingPercent()).toBe(16);
  });

  it("derives the effective monthly cost of the yearly plan", () => {
    expect(yearlyEquivalentMonthly()).toBe(83);
  });

  it("exposes both plans with correctly wired ids", () => {
    expect(PLANS.monthly.id).toBe("monthly");
    expect(PLANS.yearly.id).toBe("yearly");
    expect(PLANS.monthly.price).toBe(PRICING.monthlyPrice);
    expect(PLANS.yearly.price).toBe(PRICING.yearlyPrice);
  });

  it("formats prices with the rupee symbol", () => {
    expect(formatPrice(99)).toBe("₹99");
    expect(formatPrice(1188)).toBe("₹1,188");
  });
});
