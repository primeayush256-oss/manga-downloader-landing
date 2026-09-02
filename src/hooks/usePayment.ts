import { useCallback, useRef, useState } from "react";
import type { PlanId } from "../config/pricing";
import { useAuth } from "../context/AuthContext";
import { withPlan } from "../utils/planRedirect";
import {
  createSubscription,
  verifyPayment,
  type ApiError,
} from "../lib/paymentApi";
import { openRazorpayCheckout } from "../lib/razorpayCheckout";

/**
 * Drives the checkout flow for a plan:
 *   idle → creating → checkout → verifying → success | failed | already_active
 *
 * - Requires auth: if signed out, redirects to /login?plan=<plan> so the plan
 *   survives login (the flow resumes when the user returns to pricing).
 * - Guards against double-submission with an in-flight ref.
 * - Never marks premium on the client's say-so: success is only reported after
 *   the server verifies the signature.
 */
export type PaymentPhase =
  | "idle"
  | "creating"
  | "checkout"
  | "verifying"
  | "success"
  | "failed"
  | "already_active";

export interface UsePaymentResult {
  phase: PaymentPhase;
  activePlan: PlanId | null;
  error: string | null;
  isPremiumAfter: boolean;
  startCheckout: (plan: PlanId) => void;
  reset: () => void;
}

export function usePayment(): UsePaymentResult {
  const { isAuthenticated, email } = useAuth();
  const [phase, setPhase] = useState<PaymentPhase>("idle");
  const [activePlan, setActivePlan] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPremiumAfter, setIsPremiumAfter] = useState(false);
  const inFlight = useRef(false);

  const reset = useCallback(() => {
    if (inFlight.current) return;
    setPhase("idle");
    setError(null);
    setActivePlan(null);
    setIsPremiumAfter(false);
  }, []);

  const startCheckout = useCallback(
    (plan: PlanId) => {
      // Double-submit guard.
      if (inFlight.current) return;

      // Auth gate: preserve the plan through login.
      if (!isAuthenticated) {
        window.location.assign(withPlan("/login", plan));
        return;
      }

      inFlight.current = true;
      setActivePlan(plan);
      setError(null);
      setIsPremiumAfter(false);
      setPhase("creating");

      void (async () => {
        const created = await createSubscription(plan);
        if (!created.ok) {
          inFlight.current = false;
          if (created.error.error === "already_active") {
            setPhase("already_active");
          } else {
            setError(created.error.message);
            setPhase("failed");
          }
          return;
        }

        setPhase("checkout");
        const opened = await openRazorpayCheckout({
          keyId: created.data.key_id,
          subscriptionId: created.data.subscription_id,
          email,
          onSuccess: (payload) => {
            setPhase("verifying");
            void (async () => {
              const verified = await verifyPayment(payload);
              inFlight.current = false;
              if (!verified.ok) {
                setError(verified.error.message);
                setPhase("failed");
                return;
              }
              setIsPremiumAfter(verified.is_premium);
              setPhase("success");
            })();
          },
          onDismiss: () => {
            // User closed the modal or payment failed at Razorpay's end.
            inFlight.current = false;
            setError("Payment was not completed.");
            setPhase("failed");
          },
        });

        if (!opened) {
          inFlight.current = false;
          setError("Could not open checkout. Please try again.");
          setPhase("failed");
        }
      })();
    },
    [isAuthenticated, email]
  );

  return { phase, activePlan, error, isPremiumAfter, startCheckout, reset };
}

export type { ApiError };
