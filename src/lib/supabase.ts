import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client for the landing page.
 *
 * This connects to the SAME Supabase project as the Manga Manhwa Downloader
 * Chrome extension (project ref: kmvbqjlsiwhivxhmgdqt). Supabase Auth is the
 * single source of truth for accounts, so a user who signs up here can sign
 * in to the extension with the same credentials, and vice-versa.
 *
 * Configuration comes exclusively from environment variables — nothing is
 * hardcoded. Only the PUBLIC anon / publishable key is used; it is designed
 * to ship in client code and every request it makes is still governed by Row
 * Level Security and the project's Auth rules. The service-role key, JWT
 * secret, and database password must never appear in the frontend.
 */

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * True only when both required env vars are present and look plausible.
 * The UI uses this to show a clear configuration error instead of firing
 * doomed requests or, worse, silently falling back to mock auth.
 */
export const isSupabaseConfigured: boolean =
  typeof url === "string" &&
  url.length > 0 &&
  /^https:\/\/.+\.supabase\.co\/?$/.test(url) &&
  typeof anonKey === "string" &&
  anonKey.length > 20;

/** Human-readable reason the client is not configured, or null when it is. */
export function supabaseConfigError(): string | null {
  if (isSupabaseConfigured) return null;
  const missing: string[] = [];
  if (!url) missing.push("VITE_SUPABASE_URL");
  if (!anonKey) missing.push("VITE_SUPABASE_ANON_KEY");
  if (missing.length > 0) {
    return `Missing environment ${
      missing.length === 1 ? "variable" : "variables"
    }: ${missing.join(", ")}.`;
  }
  return "Supabase environment variables are set but do not look valid.";
}

/**
 * The client is created only when configuration is valid. Consumers should
 * guard on `isSupabaseConfigured` (the auth context does this) so they never
 * dereference a null client.
 *
 * Auth options mirror what a browser app needs and stay compatible with the
 * extension's project settings (PKCE flow). Unlike the extension — which
 * cannot receive redirects and therefore verifies emailed OTP codes — the
 * website uses standard web email links, so `detectSessionInUrl` is on to
 * pick up the recovery/confirmation session from the callback URL.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
        storageKey: "mmd.landing.auth",
      },
    })
  : null;
