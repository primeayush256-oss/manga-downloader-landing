import type { PaymentsEnv } from "../../_lib/env";
import { handleVerify } from "../../_lib/handlers";

/**
 * POST /api/payments/verify
 *
 * Thin Cloudflare Pages Functions wrapper around the shared handler (the same
 * code the Worker entry uses). The server verifies the Razorpay signature
 * before granting anything — the browser is never trusted.
 */
export const onRequestPost: PagesFunction<PaymentsEnv> = (context) =>
  handleVerify(context.request, context.env);
