import type { PaymentsEnv } from "../../_lib/env";
import { handleWebhook } from "../../_lib/handlers";

/**
 * POST /api/webhooks/razorpay
 *
 * Thin Cloudflare Pages Functions wrapper around the shared handler. Verifies
 * X-Razorpay-Signature over the RAW body, is idempotent, and applies
 * subscription lifecycle events to entitlement (service-role, server-only).
 */
export const onRequestPost: PagesFunction<PaymentsEnv> = (context) =>
  handleWebhook(context.request, context.env);
