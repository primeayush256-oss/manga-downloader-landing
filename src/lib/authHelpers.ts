import type { AuthError } from "@supabase/supabase-js";

/**
 * Client-side validation + error translation for the auth forms.
 *
 * Validation here exists only for fast feedback; Supabase re-validates
 * everything server-side and remains the authority. The wording mirrors the
 * Chrome extension's `supabase-client.js` so the two products speak the same
 * language to shared users.
 */

/** Matches the extension's MIN_PASSWORD_LENGTH and the project's Auth setting. */
export const MIN_PASSWORD_LENGTH = 6;

/**
 * Number of digit boxes shown for the emailed password-reset code.
 *
 * This MUST match the hosted Supabase project's email OTP length
 * (Dashboard → Authentication → Providers → Email → "Email OTP Length", which
 * maps to `auth.email.otp_length`). Supabase uses ONE length for every email
 * OTP, so whatever value the project sends for the recovery `{{ .Token }}` is
 * the value that must appear here. The extension's own client documents the
 * live project as issuing an 8-digit recovery code, so 8 is the expected value.
 *
 * If the project is ever changed to 6-digit OTPs, change this to 6 — the
 * verification call itself is length-agnostic (it forwards the code as a
 * string), so nothing is faked; this only controls how many boxes render and
 * the client-side length check.
 */
export const RECOVERY_CODE_LENGTH = 8;

/**
 * Validates the emailed recovery code for fast feedback. Numeric only, exact
 * length. Kept string-based so a leading zero is never lost.
 */
export function validateRecoveryCode(
  code: string,
  expectedLength = RECOVERY_CODE_LENGTH
): string | null {
  const trimmed = code.trim();
  if (!trimmed) return `Enter the ${expectedLength}-digit code from your email.`;
  if (!/^\d+$/.test(trimmed)) {
    return `The code is ${expectedLength} digits — numbers only.`;
  }
  if (trimmed.length !== expectedLength) {
    return `The code is ${expectedLength} digits long.`;
  }
  return null;
}

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return "Enter your email address.";
  // Deliberately loose: the server is the real authority on deliverability.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "That does not look like a valid email address.";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Enter your password.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

/** Password validation for sign-up / reset, including the confirm field. */
export function validateNewPassword(
  password: string,
  confirmPassword: string
): { field: "password" | "confirm"; message: string } | null {
  const passwordProblem = validatePassword(password);
  if (passwordProblem) return { field: "password", message: passwordProblem };
  if (password !== confirmPassword) {
    return { field: "confirm", message: "The two passwords do not match." };
  }
  return null;
}

/**
 * Turns a Supabase AuthError into user-facing wording. Recognised codes get a
 * friendly message; anything else falls through to a safe generic message
 * rather than leaking internal/server detail.
 */
export function describeAuthError(error: AuthError | Error | null): string {
  if (!error) return "Something went wrong. Please try again.";

  const code =
    "code" in error && typeof error.code === "string" ? error.code : "";
  const message = String(error.message || "");

  switch (code) {
    case "invalid_credentials":
      return "That email and password do not match an account.";
    case "email_not_confirmed":
      return "Please confirm your email first. Check your inbox for the confirmation link.";
    case "user_already_exists":
    case "email_exists":
      return "An account already exists for that email. Try signing in instead.";
    case "weak_password":
      return `Password is too weak. Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    case "otp_expired":
      return "That code is incorrect or has expired. Request a new one and try again.";
    case "otp_disabled":
      return "Email code verification is not enabled for this project.";
    case "validation_failed":
      return "Please check the details you entered.";
    case "over_email_send_rate_limit":
      return "Too many emails requested. Wait a minute and try again.";
    case "over_request_rate_limit":
      return "Too many attempts. Wait a moment and try again.";
    case "signup_disabled":
      return "New sign-ups are currently disabled. Please try again later.";
    case "email_address_invalid":
      return "That email address was rejected as invalid.";
    case "same_password":
      return "That is already your current password.";
    default:
      break;
  }

  // Older gotrue builds may not send a code.
  if (/invalid login credentials/i.test(message)) {
    return "That email and password do not match an account.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Please confirm your email first. Check your inbox for the confirmation link.";
  }
  if (/already registered|already exists/i.test(message)) {
    return "An account already exists for that email. Try signing in instead.";
  }
  if (/failed to fetch|network|load failed/i.test(message)) {
    return "Could not reach the server. Check your internet connection.";
  }

  return message || "Something went wrong. Please try again.";
}
