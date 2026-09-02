import type { PlanId } from "../../config/pricing";
import type { PaymentPhase } from "../../hooks/usePayment";

/**
 * A lightweight modal that reflects the checkout phase. It shows only for the
 * phases that need attention (verifying / success / failed). The "creating"
 * and "checkout" phases are represented on the button itself, and Razorpay's
 * own modal covers the payment step.
 *
 * Uses the existing glass / navy / accent design tokens — no new visual
 * language is introduced.
 */
interface Props {
  phase: PaymentPhase;
  error: string | null;
  activePlan: PlanId | null;
  onRetry: () => void;
  onClose: () => void;
}

export default function PaymentStatusOverlay({
  phase,
  error,
  onRetry,
  onClose,
}: Props) {
  const visible =
    phase === "verifying" || phase === "success" || phase === "failed";
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Payment status"
    >
      <div className="glass glass-sheen w-full max-w-md rounded-[22px] p-7 text-center">
        {phase === "verifying" && (
          <>
            <Spinner />
            <h3 className="mt-4 text-lg font-bold text-content">
              Confirming your payment…
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-content-dim">
              Hang on while we verify this securely. Don&rsquo;t close this window.
            </p>
          </>
        )}

        {phase === "success" && (
          <>
            <SuccessMark />
            <h3 className="mt-4 text-lg font-bold text-content">
              Unlimited access is active
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-content-dim">
              Your subscription is confirmed. Open the Manga Manhwa Downloader
              extension and refresh — your unlimited downloads are ready.
            </p>
            <button type="button" onClick={onClose} className="btn-accent mt-6 w-full py-2.5">
              Done
            </button>
          </>
        )}

        {phase === "failed" && (
          <>
            <FailMark />
            <h3 className="mt-4 text-lg font-bold text-content">
              Payment was not completed
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-content-dim">
              {error ?? "Something interrupted the payment."} You have not been
              charged.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={onRetry} className="btn-accent w-full py-2.5">
                Try again
              </button>
              <button type="button" onClick={onClose} className="btn-glass w-full py-2.5">
                Back to pricing
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span
      className="mx-auto block h-9 w-9 rounded-full border-[3px] border-white/25 border-t-accent motion-safe:animate-spin"
      aria-hidden="true"
    />
  );
}

function SuccessMark() {
  return (
    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-good/40 bg-good/[0.12]" aria-hidden="true">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-good">
        <path d="M5 12.5 10 17 19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function FailMark() {
  return (
    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-bad/40 bg-bad/[0.12]" aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-bad">
        <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </span>
  );
}
