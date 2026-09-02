import { supabase } from "./supabase";
import type { PlanId } from "../config/pricing";
import type { RazorpayCheckoutSuccess } from "./razorpayCheckout";

/**
 * Typed client for the payment API (Cloudflare Pages Functions under /api).
 *
 * Every call attaches the current Supabase access token as a Bearer header so
 * the server resolves the user from the verified JWT — the browser never sends
 * a user id, a price, or a Razorpay plan id. It sends only the plan NAME.
 */

async function authHeader(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { authorization: `Bearer ${token}` } : {};
}

export interface CreateSubscriptionResult {
  subscription_id: string;
  key_id: string;
  plan: PlanId;
}

export type ApiError = { error: string; message: string };

export interface PaymentStatus {
  is_premium: boolean;
  subscription_status: string;
  subscription_plan: PlanId | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

/** POST /api/payments/create-subscription — the browser sends only the plan. */
export async function createSubscription(
  plan: PlanId
): Promise<{ ok: true; data: CreateSubscriptionResult } | { ok: false; error: ApiError }> {
  const res = await fetch("/api/payments/create-subscription", {
    method: "POST",
    headers: { "content-type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ plan }),
  });
  const body = (await res.json().catch(() => null)) as
    | (CreateSubscriptionResult & { ok: true })
    | (ApiError & { ok: false })
    | null;

  if (!res.ok || !body || body.ok === false) {
    return {
      ok: false,
      error: {
        error: (body as ApiError)?.error ?? "request_failed",
        message:
          (body as ApiError)?.message ?? "Could not start checkout. Please try again.",
      },
    };
  }
  return {
    ok: true,
    data: {
      subscription_id: body.subscription_id,
      key_id: body.key_id,
      plan: body.plan,
    },
  };
}

/** POST /api/payments/verify — server verifies the signature. */
export async function verifyPayment(
  payload: RazorpayCheckoutSuccess
): Promise<{ ok: true; is_premium: boolean } | { ok: false; error: ApiError }> {
  const res = await fetch("/api/payments/verify", {
    method: "POST",
    headers: { "content-type": "application/json", ...(await authHeader()) },
    body: JSON.stringify(payload),
  });
  const body = (await res.json().catch(() => null)) as
    | { ok: true; is_premium?: boolean }
    | (ApiError & { ok: false })
    | null;

  if (!res.ok || !body || body.ok === false) {
    return {
      ok: false,
      error: {
        error: (body as ApiError)?.error ?? "verify_failed",
        message: (body as ApiError)?.message ?? "Payment could not be verified.",
      },
    };
  }
  return { ok: true, is_premium: !!body.is_premium };
}

/** GET /api/payments/status — resolved server-side; premium is derived. */
export async function fetchPaymentStatus(): Promise<PaymentStatus | null> {
  const res = await fetch("/api/payments/status", {
    headers: { ...(await authHeader()) },
  });
  if (!res.ok) return null;
  const body = (await res.json().catch(() => null)) as
    | (PaymentStatus & { ok: true })
    | null;
  if (!body || (body as { ok?: boolean }).ok === false) return null;
  return {
    is_premium: !!body.is_premium,
    subscription_status: body.subscription_status ?? "none",
    subscription_plan: body.subscription_plan ?? null,
    current_period_end: body.current_period_end ?? null,
    cancel_at_period_end: !!body.cancel_at_period_end,
  };
}
