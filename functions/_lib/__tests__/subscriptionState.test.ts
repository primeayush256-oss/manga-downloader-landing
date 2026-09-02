import { describe, expect, it } from "vitest";
import {
  buildEntitlementUpdateFromWebhook,
  isHandledEvent,
  isPremium,
  mapRazorpayStatus,
  statusForEvent,
} from "../subscriptionState";

const NOW = Date.UTC(2026, 8, 2, 12, 0, 0); // fixed clock for determinism
const FUTURE = NOW + 30 * 24 * 3600 * 1000; // +30 days
const PAST = NOW - 24 * 3600 * 1000; // -1 day
const futureSec = Math.floor(FUTURE / 1000);
const pastSec = Math.floor(PAST / 1000);

describe("mapRazorpayStatus (Razorpay -> entitlement vocabulary)", () => {
  it("maps active-like statuses to active", () => {
    expect(mapRazorpayStatus("active")).toBe("active");
    expect(mapRazorpayStatus("authenticated")).toBe("active");
    expect(mapRazorpayStatus("resumed")).toBe("active");
  });
  it("maps retry/paused states to past_due", () => {
    expect(mapRazorpayStatus("pending")).toBe("past_due");
    expect(mapRazorpayStatus("halted")).toBe("past_due");
    expect(mapRazorpayStatus("paused")).toBe("past_due");
  });
  it("maps cancelled and terminal states", () => {
    expect(mapRazorpayStatus("cancelled")).toBe("cancelled");
    expect(mapRazorpayStatus("completed")).toBe("expired");
    expect(mapRazorpayStatus("expired")).toBe("expired");
  });
  it("maps anything unknown to none", () => {
    expect(mapRazorpayStatus("created")).toBe("none");
    expect(mapRazorpayStatus("")).toBe("none");
    expect(mapRazorpayStatus(null)).toBe("none");
  });
});

describe("isPremium (mirrors cz_is_premium)", () => {
  it("active within the period is premium", () => {
    expect(
      isPremium({ status: "active", currentPeriodEnd: FUTURE, cancelAtPeriodEnd: false, now: NOW })
    ).toBe(true);
  });

  it("cancelled but inside the paid period (grace) stays premium", () => {
    expect(
      isPremium({ status: "cancelled", currentPeriodEnd: FUTURE, cancelAtPeriodEnd: true, now: NOW })
    ).toBe(true);
  });

  it("cancelled after the period ended is NOT premium", () => {
    expect(
      isPremium({ status: "cancelled", currentPeriodEnd: PAST, cancelAtPeriodEnd: true, now: NOW })
    ).toBe(false);
  });

  it("active but period already ended is NOT premium (expired allowance)", () => {
    expect(
      isPremium({ status: "active", currentPeriodEnd: PAST, cancelAtPeriodEnd: false, now: NOW })
    ).toBe(false);
  });

  it("past_due is NOT premium", () => {
    expect(
      isPremium({ status: "past_due", currentPeriodEnd: FUTURE, cancelAtPeriodEnd: false, now: NOW })
    ).toBe(false);
  });

  it("expired is NOT premium", () => {
    expect(
      isPremium({ status: "expired", currentPeriodEnd: FUTURE, cancelAtPeriodEnd: false, now: NOW })
    ).toBe(false);
  });

  it("none is NOT premium", () => {
    expect(
      isPremium({ status: "none", currentPeriodEnd: null, cancelAtPeriodEnd: false, now: NOW })
    ).toBe(false);
  });
});

describe("handled webhook events", () => {
  it("recognises the subscription lifecycle events", () => {
    for (const e of [
      "subscription.authenticated",
      "subscription.activated",
      "subscription.charged",
      "subscription.pending",
      "subscription.halted",
      "subscription.cancelled",
      "subscription.completed",
      "subscription.paused",
      "subscription.resumed",
      "subscription.expired",
    ]) {
      expect(isHandledEvent(e)).toBe(true);
    }
  });

  it("ignores unrelated events", () => {
    expect(isHandledEvent("payment.captured")).toBe(false);
    expect(isHandledEvent("order.paid")).toBe(false);
  });

  it("prefers the subscription's own status over the event-implied one", () => {
    expect(statusForEvent("subscription.charged", "active")).toBe("active");
    expect(statusForEvent("subscription.charged", null)).toBe("active");
    expect(statusForEvent("payment.captured", "active")).toBeNull();
  });
});

describe("buildEntitlementUpdateFromWebhook", () => {
  it("activates on charge", () => {
    const u = buildEntitlementUpdateFromWebhook(
      "subscription.charged",
      { id: "sub_1", status: "active", current_start: pastSec, current_end: futureSec },
      NOW
    );
    expect(u).not.toBeNull();
    expect(mapRazorpayStatus(u!.rzpStatus)).toBe("active");
    expect(u!.cancelAtPeriodEnd).toBe(false);
    expect(u!.currentPeriodEndIso).toBe(new Date(futureSec * 1000).toISOString());
  });

  it("cancellation with time left keeps grace (cancel_at_period_end = true)", () => {
    const u = buildEntitlementUpdateFromWebhook(
      "subscription.cancelled",
      { id: "sub_1", status: "cancelled", current_end: futureSec },
      NOW
    );
    expect(u!.cancelAtPeriodEnd).toBe(true);
  });

  it("cancellation after the period has ended drops premium immediately", () => {
    const u = buildEntitlementUpdateFromWebhook(
      "subscription.cancelled",
      { id: "sub_1", status: "cancelled", current_end: pastSec },
      NOW
    );
    expect(u!.cancelAtPeriodEnd).toBe(false);
  });

  it("payment failure maps to past_due (not premium)", () => {
    const u = buildEntitlementUpdateFromWebhook(
      "subscription.halted",
      { id: "sub_1", status: "halted", current_end: futureSec },
      NOW
    );
    expect(mapRazorpayStatus(u!.rzpStatus)).toBe("past_due");
    expect(
      isPremium({
        status: "past_due",
        currentPeriodEnd: FUTURE,
        cancelAtPeriodEnd: false,
        now: NOW,
      })
    ).toBe(false);
  });

  it("expiry maps to expired", () => {
    const u = buildEntitlementUpdateFromWebhook(
      "subscription.expired",
      { id: "sub_1", status: "expired", current_end: pastSec },
      NOW
    );
    expect(mapRazorpayStatus(u!.rzpStatus)).toBe("expired");
  });

  it("returns null for an unhandled event", () => {
    expect(
      buildEntitlementUpdateFromWebhook("payment.captured", { id: "sub_1", status: "active" }, NOW)
    ).toBeNull();
  });
});
