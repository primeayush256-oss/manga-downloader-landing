import { describe, expect, it } from "vitest";
import {
  isDuplicateActive,
  shouldReusePending,
} from "../paymentDecisions";
import { missingEnvKeys, isPaymentsConfigured } from "../env";

const NOW = Date.UTC(2026, 8, 2, 12, 0, 0);
const future = new Date(NOW + 30 * 864e5).toISOString();
const past = new Date(NOW - 864e5).toISOString();

describe("duplicate subscription prevention", () => {
  it("blocks a user who is already premium (active within period)", () => {
    expect(
      isDuplicateActive(
        {
          subscription_status: "active",
          current_period_end: future,
          razorpay_subscription_id: "sub_x",
        },
        NOW
      )
    ).toBe(true);
  });

  it("does not block a lapsed/expired subscriber", () => {
    expect(
      isDuplicateActive(
        {
          subscription_status: "expired",
          current_period_end: past,
          razorpay_subscription_id: "sub_x",
        },
        NOW
      )
    ).toBe(false);
  });

  it("does not block a brand-new user with no subscription", () => {
    expect(isDuplicateActive(null, NOW)).toBe(false);
    expect(
      isDuplicateActive(
        {
          subscription_status: "none",
          current_period_end: null,
          razorpay_subscription_id: null,
        },
        NOW
      )
    ).toBe(false);
  });

  it("reuses a pending subscription (id attached, status none) to stop double-create", () => {
    expect(
      shouldReusePending({
        subscription_status: "none",
        current_period_end: null,
        razorpay_subscription_id: "sub_pending",
      })
    ).toBe(true);
  });

  it("does not treat an active subscription as pending-reusable", () => {
    expect(
      shouldReusePending({
        subscription_status: "active",
        current_period_end: future,
        razorpay_subscription_id: "sub_x",
      })
    ).toBe(false);
  });
});

describe("server env / config gate", () => {
  it("reports every missing key when nothing is set", () => {
    const missing = missingEnvKeys({});
    expect(missing).toContain("RAZORPAY_KEY_SECRET");
    expect(missing).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(isPaymentsConfigured({})).toBe(false);
  });

  it("is configured only when all keys are present and non-empty", () => {
    const full = {
      RAZORPAY_KEY_ID: "rzp_test_x",
      RAZORPAY_KEY_SECRET: "secret",
      RAZORPAY_MONTHLY_PLAN_ID: "plan_m",
      RAZORPAY_YEARLY_PLAN_ID: "plan_y",
      RAZORPAY_WEBHOOK_SECRET: "whsec",
      SUPABASE_URL: "https://x.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "svc",
    };
    expect(isPaymentsConfigured(full)).toBe(true);
    expect(missingEnvKeys({ ...full, RAZORPAY_KEY_SECRET: "  " })).toEqual([
      "RAZORPAY_KEY_SECRET",
    ]);
  });
});
