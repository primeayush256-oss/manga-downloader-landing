/**
 * Server-side environment contract for the payment API.
 *
 * These bindings come from Cloudflare Pages Functions `env` (`.dev.vars`
 * locally, `wrangler pages secret` / dashboard in production). They are
 * SERVER-ONLY — none of them is prefixed `VITE_`, so none can leak into the
 * browser bundle.
 */
export interface PaymentsEnv {
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  RAZORPAY_MONTHLY_PLAN_ID: string;
  RAZORPAY_YEARLY_PLAN_ID: string;
  RAZORPAY_WEBHOOK_SECRET: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

/** Keys that must be present for the payment endpoints to operate. */
const REQUIRED_KEYS: (keyof PaymentsEnv)[] = [
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_MONTHLY_PLAN_ID",
  "RAZORPAY_YEARLY_PLAN_ID",
  "RAZORPAY_WEBHOOK_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

/**
 * Validates that every required secret is present and non-empty.
 *
 * Returns the list of missing names (empty when fully configured). Endpoints
 * call this first and return a 500 "not configured" without leaking which
 * concrete value is wrong — only the variable name, which is not a secret.
 */
export function missingEnvKeys(env: Partial<PaymentsEnv>): string[] {
  return REQUIRED_KEYS.filter((key) => {
    const value = env[key];
    return typeof value !== "string" || value.trim().length === 0;
  });
}

export function isPaymentsConfigured(env: Partial<PaymentsEnv>): boolean {
  return missingEnvKeys(env).length === 0;
}
