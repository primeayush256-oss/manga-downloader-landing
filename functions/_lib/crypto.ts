/**
 * Razorpay signature verification via Web Crypto (HMAC-SHA256).
 *
 * Web Crypto (`crypto.subtle`) is available both on Cloudflare Workers and in
 * Node 18+ (and therefore in Vitest), so these functions are unit-testable
 * without any Razorpay call and identical in production.
 *
 * All comparisons are constant-time to avoid leaking signature bytes through
 * timing. The Razorpay Key Secret / Webhook Secret is only ever used here,
 * server-side, and never returned to any caller.
 */

const encoder = new TextEncoder();

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  const bytes = new Uint8Array(sig);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}

/** Length-safe, constant-time-ish comparison of two hex strings. */
export function safeEqualHex(a: string, b: string): boolean {
  const x = (a ?? "").toLowerCase();
  const y = (b ?? "").toLowerCase();
  if (x.length !== y.length || x.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i += 1) {
    diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Verifies a Razorpay SUBSCRIPTION checkout signature.
 *
 * Per Razorpay's subscription docs the expected signature is:
 *   HMAC_SHA256(razorpay_payment_id + "|" + razorpay_subscription_id, key_secret)
 *
 * (Note the order is payment_id|subscription_id for subscriptions, which is
 * different from the order|payment_id used for one-time orders.)
 */
export async function verifySubscriptionSignature(params: {
  paymentId: string;
  subscriptionId: string;
  signature: string;
  keySecret: string;
}): Promise<boolean> {
  const { paymentId, subscriptionId, signature, keySecret } = params;
  if (!paymentId || !subscriptionId || !signature || !keySecret) return false;
  const expected = await hmacSha256Hex(
    keySecret,
    `${paymentId}|${subscriptionId}`
  );
  return safeEqualHex(expected, signature);
}

/**
 * Verifies a Razorpay WEBHOOK signature.
 *
 * The signature is HMAC_SHA256 of the RAW request body (exact bytes as
 * received — never re-serialized JSON) keyed with the webhook secret, compared
 * to the `X-Razorpay-Signature` header.
 */
export async function verifyWebhookSignature(params: {
  rawBody: string;
  signature: string;
  webhookSecret: string;
}): Promise<boolean> {
  const { rawBody, signature, webhookSecret } = params;
  if (!signature || !webhookSecret) return false;
  const expected = await hmacSha256Hex(webhookSecret, rawBody);
  return safeEqualHex(expected, signature);
}
