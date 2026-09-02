import { describe, expect, it } from "vitest";
import {
  PLAN_CATALOG,
  getPlanSpec,
  isValidPlan,
  resolveRazorpayPlanId,
  totalCyclesFor,
} from "../plans";

describe("plan validation", () => {
  it("accepts only the two known plans", () => {
    expect(isValidPlan("monthly")).toBe(true);
    expect(isValidPlan("yearly")).toBe(true);
  });

  it("rejects unknown / injected plan values", () => {
    expect(isValidPlan("weekly")).toBe(false);
    expect(isValidPlan("free")).toBe(false);
    expect(isValidPlan("")).toBe(false);
    expect(isValidPlan(null)).toBe(false);
    expect(isValidPlan(undefined)).toBe(false);
    expect(isValidPlan({ plan: "monthly" })).toBe(false);
    expect(isValidPlan("monthly ")).toBe(false); // no trimming/coercion
  });

  it("getPlanSpec returns null for anything invalid", () => {
    expect(getPlanSpec("nope")).toBeNull();
    expect(getPlanSpec(123)).toBeNull();
  });
});

describe("price authority (server-fixed, in paise)", () => {
  it("monthly is exactly ₹99 = 9900 paise", () => {
    expect(PLAN_CATALOG.monthly.amountPaise).toBe(9900);
    expect(PLAN_CATALOG.monthly.currency).toBe("INR");
  });

  it("yearly is exactly ₹999 = 99900 paise", () => {
    expect(PLAN_CATALOG.yearly.amountPaise).toBe(99900);
    expect(PLAN_CATALOG.yearly.currency).toBe("INR");
  });

  it("has no plans other than monthly and yearly", () => {
    expect(Object.keys(PLAN_CATALOG).sort()).toEqual(["monthly", "yearly"]);
  });
});

describe("plan name -> Razorpay plan id mapping", () => {
  const env = {
    RAZORPAY_MONTHLY_PLAN_ID: "plan_monthly_test",
    RAZORPAY_YEARLY_PLAN_ID: "plan_yearly_test",
  };

  it("maps monthly and yearly to their configured ids", () => {
    expect(resolveRazorpayPlanId("monthly", env)).toBe("plan_monthly_test");
    expect(resolveRazorpayPlanId("yearly", env)).toBe("plan_yearly_test");
  });

  it("returns null when the id is not configured", () => {
    expect(
      resolveRazorpayPlanId("monthly", {
        RAZORPAY_MONTHLY_PLAN_ID: "",
        RAZORPAY_YEARLY_PLAN_ID: "plan_yearly_test",
      })
    ).toBeNull();
  });

  it("uses finite cycle counts", () => {
    expect(totalCyclesFor("monthly")).toBe(120);
    expect(totalCyclesFor("yearly")).toBe(10);
  });
});
