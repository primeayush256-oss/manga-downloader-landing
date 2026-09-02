import { describe, expect, it } from "vitest";
import {
  safeEqualHex,
  verifySubscriptionSignature,
  verifyWebhookSignature,
} from "../crypto";

/** Independent reference HMAC-SHA256 hex, to produce genuine valid signatures. */
async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

describe("safeEqualHex", () => {
  it("is true for identical, case-insensitive hex", () => {
    expect(safeEqualHex("abcd12", "ABCD12")).toBe(true);
  });
  it("is false for different or empty values", () => {
    expect(safeEqualHex("abcd12", "abcd13")).toBe(false);
    expect(safeEqualHex("", "")).toBe(false);
    expect(safeEqualHex("ab", "abcd")).toBe(false);
  });
});

describe("verifySubscriptionSignature", () => {
  const keySecret = "test_key_secret";
  const paymentId = "pay_TEST123";
  const subscriptionId = "sub_TEST456";

  it("accepts a genuine signature (payment_id|subscription_id order)", async () => {
    const signature = await hmacHex(keySecret, `${paymentId}|${subscriptionId}`);
    await expect(
      verifySubscriptionSignature({ paymentId, subscriptionId, signature, keySecret })
    ).resolves.toBe(true);
  });

  it("rejects a tampered signature", async () => {
    await expect(
      verifySubscriptionSignature({
        paymentId,
        subscriptionId,
        signature: "deadbeef",
        keySecret,
      })
    ).resolves.toBe(false);
  });

  it("rejects when signed with the wrong secret", async () => {
    const signature = await hmacHex("wrong_secret", `${paymentId}|${subscriptionId}`);
    await expect(
      verifySubscriptionSignature({ paymentId, subscriptionId, signature, keySecret })
    ).resolves.toBe(false);
  });

  it("rejects when the field order is reversed (order matters)", async () => {
    const signature = await hmacHex(keySecret, `${subscriptionId}|${paymentId}`);
    await expect(
      verifySubscriptionSignature({ paymentId, subscriptionId, signature, keySecret })
    ).resolves.toBe(false);
  });

  it("rejects missing inputs", async () => {
    await expect(
      verifySubscriptionSignature({ paymentId: "", subscriptionId, signature: "x", keySecret })
    ).resolves.toBe(false);
  });
});

describe("verifyWebhookSignature", () => {
  const webhookSecret = "whsec_test";
  const rawBody = '{"event":"subscription.activated","payload":{}}';

  it("accepts a signature over the exact raw body", async () => {
    const signature = await hmacHex(webhookSecret, rawBody);
    await expect(
      verifyWebhookSignature({ rawBody, signature, webhookSecret })
    ).resolves.toBe(true);
  });

  it("rejects if the body is altered by a single byte", async () => {
    const signature = await hmacHex(webhookSecret, rawBody);
    await expect(
      verifyWebhookSignature({ rawBody: rawBody + " ", signature, webhookSecret })
    ).resolves.toBe(false);
  });

  it("rejects a missing or wrong signature", async () => {
    await expect(
      verifyWebhookSignature({ rawBody, signature: "", webhookSecret })
    ).resolves.toBe(false);
    await expect(
      verifyWebhookSignature({ rawBody, signature: "abc123", webhookSecret })
    ).resolves.toBe(false);
  });
});
