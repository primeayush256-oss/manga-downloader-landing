import { useEffect } from "react";
import AuthLayout from "../components/auth/AuthLayout";
import { getSelectedPlanFromUrl } from "../utils/planQuery";
import { withPlan } from "../utils/planRedirect";

/**
 * Legacy route.
 *
 * Password reset no longer uses a clickable link / deep-link landing page —
 * it now happens entirely on /forgot-password via an emailed numeric code
 * (Supabase recovery OTP). This route is kept only so any old bookmark or
 * previously-sent link does not 404; it simply forwards to the code flow,
 * preserving any ?plan= selection.
 */
export default function ResetPasswordPage() {
  const search = typeof window !== "undefined" ? window.location.search : "";
  const plan = getSelectedPlanFromUrl(search);
  const target = withPlan("/forgot-password", plan);

  useEffect(() => {
    window.location.replace(target);
  }, [target]);

  return (
    <AuthLayout title="Reset password" subtitle="Taking you to the reset form…">
      <a href={target} className="btn-accent w-full py-2.5">
        Continue
      </a>
    </AuthLayout>
  );
}
