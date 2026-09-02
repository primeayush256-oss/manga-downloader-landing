import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { PaymentsEnv } from "./env";

/**
 * Server-side Supabase clients.
 *
 * Two distinct roles, never mixed:
 *
 *  - adminClient(): uses the SERVICE ROLE key. It bypasses RLS and is the only
 *    thing allowed to call the server-only entitlement writer functions
 *    (link_pending_subscription, apply_subscription_event). This key is
 *    server-only and must never reach the browser.
 *
 *  - userClientFromToken(): uses the PUBLIC anon key but attaches the caller's
 *    access token, so RPCs run as that authenticated user. Used to resolve the
 *    authenticated user's id from their JWT (auth.getUser) without trusting any
 *    id sent by the browser.
 */

export function adminClient(env: PaymentsEnv): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Resolves the authenticated user from a Bearer token using the service-role
 * client's admin API. Returns null if the token is missing/invalid.
 *
 * We never accept a user_id from the request body — identity always comes from
 * the verified token here.
 */
export async function getUserFromRequest(
  request: Request,
  env: PaymentsEnv
): Promise<{ id: string; email: string | null } | null> {
  const authHeader = request.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  if (!match) return null;
  const token = match[1];

  const admin = adminClient(env);
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}
