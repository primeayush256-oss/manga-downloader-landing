import { useState, type FormEvent } from "react";
import AuthLayout from "../components/auth/AuthLayout";
import ConfigError from "../components/auth/ConfigError";
import {
  AuthBanner,
  Field,
  PasswordField,
  SubmitButton,
} from "../components/auth/AuthFormBits";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import {
  describeAuthError,
  validateEmail,
  validateNewPassword,
} from "../lib/authHelpers";
import { getSelectedPlanFromUrl } from "../utils/planQuery";
import { withPlan, postAuthRedirect } from "../utils/planRedirect";

export default function SignupPage() {
  const search = typeof window !== "undefined" ? window.location.search : "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const plan = getSelectedPlanFromUrl(search);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;

    setFormError(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmError(null);

    const emailProblem = validateEmail(email);
    if (emailProblem) {
      setEmailError(emailProblem);
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

    // Carry the selected plan through email confirmation: the link lands back
    // on the site root with ?plan= preserved, so the next phase can use it.
    const emailRedirectTo = `${origin}${postAuthRedirect(search, "/")}`;

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo },
    });

    setLoading(false);

    if (error) {
      setFormError(describeAuthError(error));
      return;
    }

    // Email confirmation on: Supabase returns an obfuscated user with an empty
    // `identities` array when the address is already registered (anti-
    // enumeration). Treat that as "already exists" rather than success.
    if (
      data.user &&
      Array.isArray(data.user.identities) &&
      data.user.identities.length === 0
    ) {
      setFormError(
        "An account already exists for that email. Try signing in instead."
      );
      return;
    }

    if (data.session) {
      // Confirmation disabled on the project: a real session exists now.
      window.location.assign(postAuthRedirect(search, "/"));
      return;
    }

    // No session: confirmation is required. Do NOT claim the user is logged in.
    setSentTo(email.trim());
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="Create an account to start with 20 free pages."
    >
      {!isSupabaseConfigured ? (
        <ConfigError />
      ) : sentTo ? (
        <div>
          <AuthBanner tone="success">
            Confirmation email sent to <strong>{sentTo}</strong>. Open the link
            in that email to finish creating your account, then sign in.
          </AuthBanner>
          <p className="text-[12.5px] leading-relaxed text-content-dim">
            Didn&rsquo;t get it? Check your spam folder, or{" "}
            <a
              href={withPlan("/signup", plan)}
              className="font-semibold text-accent-soft hover:text-white"
            >
              try again
            </a>
            .
          </p>
          <a href={withPlan("/login", plan)} className="btn-glass mt-6 w-full py-2.5 text-[13px]">
            Go to sign in
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {formError && <AuthBanner tone="error">{formError}</AuthBanner>}

          <Field
            id="signup-email"
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

          <PasswordField
            id="signup-password"
            label="Password"
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
            id="signup-confirm"
            label="Confirm password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={confirm}
            error={confirmError}
            onChange={(e) => {
              setConfirm(e.target.value);
              if (confirmError) setConfirmError(null);
            }}
            required
          />

          <SubmitButton loading={loading} loadingLabel="Creating account…">
            Create account
          </SubmitButton>

          <p className="mt-4 text-center text-[12.5px] text-content-faint">
            Already have an account?{" "}
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
