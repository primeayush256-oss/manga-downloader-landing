import type { PaymentsEnv } from "../functions/_lib/env";
import { errorResponse, methodNotAllowed } from "../functions/_lib/http";
import {
  handleCreateSubscription,
  handleStatus,
  handleVerify,
  handleWebhook,
} from "../functions/_lib/handlers";

/**
 * Cloudflare Worker entry (Static Assets model).
 *
 * This is what `wrangler deploy` needs as its entry point. It does two things:
 *
 *   1. Serves the API. `/api/*` requests are dispatched by exact path + method
 *      to the SAME shared handlers the Pages Functions use, so the Razorpay /
 *      Supabase logic is identical and fully intact.
 *
 *   2. Serves the built Vite frontend. Anything that is not an API route is
 *      handed to the static assets binding (`env.ASSETS`), which serves the
 *      files in ./dist. SPA fallback (unknown client routes -> index.html) is
 *      configured on the assets binding in wrangler.toml, so client-side
 *      routes like /login and /reset-password resolve correctly.
 *
 * The Worker holds no secrets of its own — Razorpay key secret, webhook
 * secret, and the Supabase service-role key come from the runtime `env`
 * bindings (Pages/Workers secrets), exactly as before.
 */

interface WorkerEnv extends PaymentsEnv {
  /** Static Assets binding, declared in wrangler.toml. */
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

/** Route table: path -> allowed method -> handler. */
type Handler = (request: Request, env: PaymentsEnv) => Promise<Response>;

const ROUTES: Record<string, { method: string; handler: Handler }> = {
  "/api/payments/create-subscription": {
    method: "POST",
    handler: handleCreateSubscription,
  },
  "/api/payments/verify": { method: "POST", handler: handleVerify },
  "/api/payments/status": { method: "GET", handler: handleStatus },
  "/api/webhooks/razorpay": { method: "POST", handler: handleWebhook },
};

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith("/api/")) {
      const route = ROUTES[path];
      if (!route) {
        return errorResponse(404, "not_found", "Unknown API route.");
      }
      if (request.method !== route.method) {
        return methodNotAllowed(route.method);
      }
      return route.handler(request, env);
    }

    // Everything else is a static asset (or SPA fallback via wrangler.toml).
    return env.ASSETS.fetch(request);
  },
};
