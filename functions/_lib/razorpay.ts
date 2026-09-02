import type { PaymentsEnv } from "./env";

/**
 * Minimal Razorpay REST helper (server-side only).
 *
 * Uses HTTP Basic auth with `RAZORPAY_KEY_ID:RAZORPAY_KEY_SECRET`. The secret
 * is used only to build the Authorization header here and is never returned to
 * a caller. We deliberately implement only the two calls this phase needs
 * (create subscription, fetch subscription) rather than pulling in the Node
 * SDK, which is not Workers-friendly.
 */

const RAZORPAY_API = "https://api.razorpay.com/v1";

function authHeader(env: PaymentsEnv): string {
  const token = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
  return `Basic ${token}`;
}

export interface RazorpaySubscription {
  id: string;
  entity: "subscription";
  plan_id: string;
  status: string;
  customer_id?: string | null;
  current_start?: number | null; // epoch seconds
  current_end?: number | null; // epoch seconds
  charge_at?: number | null;
  notes?: Record<string, string> | null;
  [key: string]: unknown;
}

/**
 * Creates a Razorpay subscription for a plan.
 *
 * `notes` carries our Supabase user id so the webhook can associate events
 * even before verify runs. Amount/price are NOT sent here — they are fixed by
 * the Razorpay plan referenced by planId, which the server chose.
 */
export async function createSubscription(
  env: PaymentsEnv,
  params: {
    planId: string;
    totalCount: number;
    userId: string;
    userEmail: string | null;
  }
): Promise<{ ok: true; subscription: RazorpaySubscription } | { ok: false; status: number }> {
  const body = {
    plan_id: params.planId,
    total_count: params.totalCount,
    quantity: 1,
    customer_notify: 1,
    notes: {
      supabase_user_id: params.userId,
      ...(params.userEmail ? { email: params.userEmail } : {}),
    },
  };

  const res = await fetch(`${RAZORPAY_API}/subscriptions`, {
    method: "POST",
    headers: {
      authorization: authHeader(env),
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return { ok: false, status: res.status };
  }
  const subscription = (await res.json()) as RazorpaySubscription;
  return { ok: true, subscription };
}

/** Fetches the current state of a subscription (used by the webhook handler). */
export async function fetchSubscription(
  env: PaymentsEnv,
  subscriptionId: string
): Promise<RazorpaySubscription | null> {
  const res = await fetch(
    `${RAZORPAY_API}/subscriptions/${encodeURIComponent(subscriptionId)}`,
    { headers: { authorization: authHeader(env) } }
  );
  if (!res.ok) return null;
  return (await res.json()) as RazorpaySubscription;
}

/** epoch seconds -> ISO string, or null. Razorpay uses epoch seconds. */
export function epochSecondsToIso(sec: number | null | undefined): string | null {
  if (typeof sec !== "number" || !Number.isFinite(sec) || sec <= 0) return null;
  return new Date(sec * 1000).toISOString();
}
