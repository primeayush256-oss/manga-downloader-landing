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
import { describeAuthError, validateEmail } from "../lib/authHelpers";
import { getSelectedPlanFromUrl } from "../utils/planQuery";
import { withPlan, postAuthRedirect } from "../utils/planRedirect";

export default function LoginPage() {
  const search = typeof window !== "undefined" ? window.location.search : "";
  // Re-validated by getSelectedPlanFromUrl: only "monthly" | "yearly" survive.
  const plan = getSelectedPlanFromUrl(search);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;

    setFormError(null);
    const emailProblem = validateEmail(email);
    setEmailError(emailProblem);
    if (emailProblem) return;
    if (!password) {
      setFormError("Enter your password.");
      return;
    }

    if (!supabase) {
      setFormError("Authentication is not configured.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoading(false);
      setFormError(describeAuthError(error));
      return;
    }

    // Success: the AuthProvider listener will pick up the session. Send the
    // user on, carrying any selected plan so the next phase can use it.
    window.location.assign(postAuthRedirect(search, "/"));
  }

  return (
    <AuthLayout title="Sign in" subtitle="Sign in to use the downloader.">
      {!isSupabaseConfigured ? (
        <ConfigError />
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {formError && <AuthBanner tone="error">{formError}</AuthBanner>}

          <Field
            id="login-email"
            label="Email"
            type="email"
            autoComplete="username"
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
            id="login-password"
            label="Password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <SubmitButton loading={loading} loadingLabel="Signing in…">
            Sign in
          </SubmitButton>

          <div className="mt-4 flex items-center justify-between gap-3 text-[12.5px]">
            <a
              href={withPlan("/forgot-password", plan)}
              className="font-medium text-content-dim transition-colors duration-200 ease-ease hover:text-content"
            >
              Forgot password?
            </a>
            <span className="text-content-faint">
              No account?{" "}
              <a
                href={withPlan("/signup", plan)}
                className="font-semibold text-accent-soft transition-colors duration-200 ease-ease hover:text-white"
              >
                Create account
              </a>
            </span>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
