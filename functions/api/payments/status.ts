import type { PaymentsEnv } from "../../_lib/env";
import { handleStatus } from "../../_lib/handlers";

/**
 * GET /api/payments/status
 *
 * Thin Cloudflare Pages Functions wrapper around the shared handler. Premium
 * is derived server-side; the browser cannot fake it.
 */
export const onRequestGet: PagesFunction<PaymentsEnv> = (context) =>
  handleStatus(context.request, context.env);
