import { useState, type FormEvent } from "react";
import AuthLayout from "../components/auth/AuthLayout";
import ConfigError from "../components/auth/ConfigError";
import {
  AuthBanner,
  Field,
  PasswordField,
  SubmitButton,
} from "../components/auth/AuthFormBits";
import OtpInput from "../components/auth/OtpInput";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import {
  RECOVERY_CODE_LENGTH,
  describeAuthError,
  validateEmail,
  validateNewPassword,
  validateRecoveryCode,
} from "../lib/authHelpers";
import { getSelectedPlanFromUrl } from "../utils/planQuery";
import { withPlan } from "../utils/planRedirect";

/**
 * Password reset via an emailed numeric CODE (not a link).
 *
 * Genuine Supabase recovery OTP, mirroring the Chrome extension's flow so both
 * products behave identically against the shared project:
 *
 *   1. resetPasswordForEmail(email)            — NO redirectTo, so the email
 *                                                carries {{ .Token }} (a code),
 *                                                not a clickable link.
 *   2. verifyOtp({ email, token, type: 'recovery' })
 *                                              — exchanges the code for a real
 *                                                recovery session.
 *   3. updateUser({ password })                — sets the new password using
 *                                                that session.
 *
 * The whole flow lives on one page. The email is held in React state only —
 * never localStorage — and the code and password are likewise never persisted.
 */
type Step = "request" | "verify" | "done";

export default function ForgotPasswordPage() {
  const search = typeof window !== "undefined" ? window.location.search : "";
  const plan = getSelectedPlanFromUrl(search);

  const [step, setStep] = useState<Step>("request");

  // Request step
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  // Verify step
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  /* -------------------------------------------------- step 1: request code */
  async function handleRequest(event: FormEvent) {
    event.preventDefault();
    if (loading) return;

    setFormError(null);
    setNotice(null);
    const emailProblem = validateEmail(email);
    setEmailError(emailProblem);
    if (emailProblem) return;

    if (!supabase) {
      setFormError("Authentication is not configured.");
      return;
    }

    setLoading(true);
    // No redirectTo: this makes Supabase send the {{ .Token }} code rather
    // than a magic link.
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);

    if (error) {
      setFormError(describeAuthError(error));
      return;
    }

    setStep("verify");
  }

  /* --------------------------------------------- step 2: verify + set new */
  async function handleVerify(event: FormEvent) {
    event.preventDefault();
    if (loading) return;

    setFormError(null);
    setNotice(null);
    setCodeError(null);
    setPasswordError(null);
    setConfirmError(null);

    const codeProblem = validateRecoveryCode(code);
    if (codeProblem) {
      setCodeError(codeProblem);
      return;
    }
    const passwordProblem = validateNewPassword(password, confirm);
    if (passwordProblem) {
      if (passwordProblem.field === "password") setPasswordError(passwordProblem.message);
      else setConfirmError(passwordProblem.message);
      return;
    }

    if (!supabase) {
      setFormError("Authentication is not configured.");
      return;
    }

    setLoading(true);

    // Exchange the emailed code for a real recovery session. String token, so
    // a leading zero is preserved.
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "recovery",
    });

    if (verifyError || !data.session) {
      setLoading(false);
      setCodeError(
        verifyError
          ? describeAuthError(verifyError)
          : "That code could not be verified. Request a new one and try again."
      );
      return;
    }

    // Session established by Supabase — now set the new password.
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setFormError(describeAuthError(updateError));
      return;
    }

    setStep("done");
  }

  /* ------------------------------------------------------- resend the code */
  async function handleResend() {
    if (resending || loading || !supabase) return;
    setFormError(null);
    setNotice(null);
    setCodeError(null);

    setResending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setResending(false);

    if (error) {
      setFormError(describeAuthError(error));
      return;
    }
    setNotice("A new code is on its way. Check your email.");
  }

  const subtitle =
    step === "verify" ? (
      <>
        Enter the {RECOVERY_CODE_LENGTH}-digit code sent to{" "}
        <span className="font-semibold text-accent-soft">{email.trim()}</span>.
      </>
    ) : step === "done" ? (
      "Your password has been updated."
    ) : (
      "We'll email you a code to reset your password."
    );

  return (
    <AuthLayout title="Reset password" subtitle={subtitle}>
      {!isSupabaseConfigured ? (
        <ConfigError />
      ) : step === "done" ? (
        <div>
          <AuthBanner tone="success">
            Your password has been updated. You can sign in with it now.
          </AuthBanner>
          <a href={withPlan("/login", plan)} className="btn-accent mt-2 w-full py-2.5">
            Continue to sign in
          </a>
        </div>
      ) : step === "verify" ? (
        <form onSubmit={handleVerify} noValidate>
          {formError && <AuthBanner tone="error">{formError}</AuthBanner>}
          {notice && <AuthBanner tone="success">{notice}</AuthBanner>}

          <div className="mb-4">
            <span
              id="otp-label"
              className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.5px] text-content-faint"
            >
              Reset code
            </span>
            <OtpInput
              length={RECOVERY_CODE_LENGTH}
              value={code}
              onChange={(next) => {
                setCode(next);
                if (codeError) setCodeError(null);
              }}
              disabled={loading}
              invalid={!!codeError}
              labelId="otp-label"
            />
            {codeError && (
              <p className="mt-1.5 text-[11.5px] text-bad">{codeError}</p>
            )}
          </div>

          <PasswordField
            id="new-password"
            label="New password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={password}
            error={passwordError}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError(null);
            }}
            required
          />

          <PasswordField
            id="new-password-confirm"
            label="Confirm new password"
            autoComplete="new-password"
            placeholder="Repeat your new password"
            value={confirm}
            error={confirmError}
            onChange={(e) => {
              setConfirm(e.target.value);
              if (confirmError) setConfirmError(null);
            }}
            required
          />

          <SubmitButton loading={loading} loadingLabel="Resetting password…">
            Reset password
          </SubmitButton>

          <p className="mt-4 text-center text-[12.5px] text-content-faint">
            Didn&rsquo;t receive the code?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || loading}
              className="font-semibold text-accent-soft transition-colors duration-200 ease-ease hover:text-white disabled:opacity-60"
            >
              {resending ? "Resending…" : "Resend code"}
            </button>
          </p>

          <p className="mt-2 text-center text-[12.5px]">
            <a
              href={withPlan("/login", plan)}
              className="font-medium text-content-dim transition-colors duration-200 ease-ease hover:text-content"
            >
              Back to sign in
            </a>
          </p>
        </form>
      ) : (
        <form onSubmit={handleRequest} noValidate>
          {formError && <AuthBanner tone="error">{formError}</AuthBanner>}

          <Field
            id="reset-email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            spellCheck={false}
            value={email}
            error={emailError}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
            required
          />

          <SubmitButton loading={loading} loadingLabel="Sending code…">
            Send reset code
          </SubmitButton>

          <p className="mt-4 text-center text-[12.5px] text-content-faint">
            Remembered it?{" "}
            <a
              href={withPlan("/login", plan)}
              className="font-semibold text-accent-soft transition-colors duration-200 ease-ease hover:text-white"
            >
              Sign in
            </a>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
