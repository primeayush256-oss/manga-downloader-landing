import type { PaymentsEnv } from "../../_lib/env";
import { handleCreateSubscription } from "../../_lib/handlers";

/**
 * POST /api/payments/create-subscription
 *
 * Thin Cloudflare Pages Functions wrapper. All logic lives in the shared,
 * runtime-agnostic handler so the exact same code also runs under the Worker
 * entry (worker/index.ts). Only POST is defined, so Pages returns 405 for
 * other methods automatically.
 */
export const onRequestPost: PagesFunction<PaymentsEnv> = (context) =>
  handleCreateSubscription(context.request, context.env);
