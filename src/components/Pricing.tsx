import { useEffect, useState } from "react";
import Section from "./Section";
import Reveal from "./Reveal";
import PaymentStatusOverlay from "./payment/PaymentStatusOverlay";
import { getSelectedPlanFromUrl } from "../utils/planQuery";
import { useAuth } from "../context/AuthContext";
import { usePayment } from "../hooks/usePayment";
import { fetchPaymentStatus, type PaymentStatus } from "../lib/paymentApi";
import {
  FREE_PAGES,
  PLANS,
  type PlanId,
  annualCostIfPaidMonthly,
  annualSaving,
  annualSavingPercent,
  formatPrice,
} from "../config/pricing";

export default function Pricing() {
  /* The extension links here as `?plan=monthly` / `?plan=yearly`. Read once
     on mount so the matching card is highlighted. Any other value resolves
     to null and the section renders in its normal state — that validation
     lives in getSelectedPlanFromUrl() and is covered by unit tests. */
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const { isAuthenticated } = useAuth();
  const payment = usePayment();

  // Current entitlement, so an already-subscribed user sees "active" instead
  // of an upgrade button. Premium is resolved server-side (never a client flag).
  const [status, setStatus] = useState<PaymentStatus | null>(null);

  useEffect(() => {
    setSelectedPlan(getSelectedPlanFromUrl());
  }, []);

  useEffect(() => {
    let active = true;
    if (isAuthenticated) {
      void fetchPaymentStatus().then((s) => {
        if (active) setStatus(s);
      });
    } else {
      setStatus(null);
    }
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  // After a successful payment, refresh entitlement so the UI reflects premium.
  useEffect(() => {
    if (payment.phase === "success" || payment.phase === "already_active") {
      void fetchPaymentStatus().then((s) => setStatus(s));
    }
  }, [payment.phase]);

  const alreadyPremium = status?.is_premium === true;

  return (
    <Section id="pricing" className="py-20 sm:py-28" aria-labelledby="pricing-heading">
      <Reveal className="max-w-xl">
        <p className="eyebrow">Pricing</p>
        <h2
          id="pricing-heading"
          className="mt-3 text-[1.9rem] font-extrabold leading-[1.15] tracking-[-0.025em] text-content sm:text-[2.4rem]"
        >
          Start free, upgrade when you need to
        </h2>
        <p className="mt-3.5 text-[15px] leading-relaxed text-content-dim">
          Every account includes {FREE_PAGES} free pages. Prices are in Indian
          Rupees.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        <Reveal delay={0} className="h-full">
          <PricingCard
            name="Free"
            price={formatPrice(0)}
            period=""
            note={`${FREE_PAGES} free pages`}
            highlighted={false}
            badge={null}
            features={[
              `${FREE_PAGES} manga page downloads`,
              "Basic downloader access",
              "Account-based usage",
            ]}
            ctaLabel="Start free"
            ctaHref="/signup"
            ctaStyle="glass"
          />
        </Reveal>

        <Reveal delay={80} className="h-full">
          <PricingCard
            name={PLANS.monthly.name}
            price={formatPrice(PLANS.monthly.price)}
            period={PLANS.monthly.period}
            note="Unlimited downloads"
            highlighted={selectedPlan === "monthly"}
            badge={null}
            features={[
              "Unlimited manga downloads",
              "Premium Screenshot Mode",
              "Account-based access",
            ]}
            ctaLabel={PLANS.monthly.ctaLabel}
            ctaStyle="glass"
            planId="monthly"
            alreadyActive={alreadyPremium && status?.subscription_plan === "monthly"}
            anyPlanActive={alreadyPremium}
            busy={payment.phase !== "idle" && payment.activePlan === "monthly"}
            onSelect={() => payment.startCheckout("monthly")}
          />
        </Reveal>

        <Reveal delay={160} className="h-full">
          <PricingCard
            name={PLANS.yearly.name}
            price={formatPrice(PLANS.yearly.price)}
            period={PLANS.yearly.period}
            note="Unlimited downloads"
            highlighted={selectedPlan === "yearly"}
            badge="Best value"
            features={[
              "Unlimited manga downloads",
              "Premium Screenshot Mode",
              "Account-based access",
            ]}
            ctaLabel={PLANS.yearly.ctaLabel}
            ctaStyle="accent"
            planId="yearly"
            alreadyActive={alreadyPremium && status?.subscription_plan === "yearly"}
            anyPlanActive={alreadyPremium}
            busy={payment.phase !== "idle" && payment.activePlan === "yearly"}
            onSelect={() => payment.startCheckout("yearly")}
          />
        </Reveal>
      </div>

      {/* Saving maths, stated plainly and derived from the prices above so it
          can never drift: ₹99 × 12 = ₹1,188 vs ₹999. */}
      <Reveal delay={220}>
        <p className="mt-6 text-[13px] leading-relaxed text-content-faint">
          {formatPrice(PLANS.monthly.price)} × 12 ={" "}
          <span className="tnum">{formatPrice(annualCostIfPaidMonthly())}</span>.
          The yearly plan is{" "}
          <span className="tnum">{formatPrice(PLANS.yearly.price)}</span>, so you
          save{" "}
          <span className="font-semibold text-content-dim tnum">
            {formatPrice(annualSaving())} a year
          </span>{" "}
          — about {annualSavingPercent()}%.
        </p>
      </Reveal>

      <PaymentStatusOverlay
        phase={payment.phase}
        error={payment.error}
        activePlan={payment.activePlan}
        onRetry={() => {
          if (payment.activePlan) payment.startCheckout(payment.activePlan);
        }}
        onClose={payment.reset}
      />
    </Section>
  );
}

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  note: string;
  highlighted: boolean;
  badge: string | null;
  features: string[];
  ctaLabel: string;
  ctaStyle: "accent" | "glass";
  /** Free card: a plain link. Paid cards: a checkout button. */
  ctaHref?: string;
  planId?: PlanId;
  alreadyActive?: boolean;
  anyPlanActive?: boolean;
  busy?: boolean;
  onSelect?: () => void;
}

function PricingCard({
  name,
  price,
  period,
  note,
  highlighted,
  badge,
  features,
  ctaLabel,
  ctaStyle,
  ctaHref,
  alreadyActive = false,
  anyPlanActive = false,
  busy = false,
  onSelect,
}: PricingCardProps) {
  const buttonClass = ctaStyle === "accent" ? "btn-accent" : "btn-glass";

  return (
    <div
      className={`glass glass-sheen relative flex h-full flex-col rounded-[20px] p-7 transition-[transform,border-color,box-shadow] duration-300 ease-ease hover:-translate-y-1 hover:shadow-glass ${
        highlighted
          ? "border-accent/55 shadow-[0_0_0_1px_rgba(63,162,255,0.28),0_18px_40px_-22px_rgba(63,162,255,0.4)]"
          : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="eyebrow text-[10.5px] tracking-[0.7px]">{name}</h3>
        {badge && (
          <span className="shrink-0 rounded-full border border-accent/35 bg-accent/[0.12] px-2.5 py-[3px] text-[9.5px] font-extrabold uppercase tracking-[0.5px] text-accent-soft">
            {badge}
          </span>
        )}
      </div>

      <p className="mt-3.5 flex items-baseline gap-1">
        <span className="text-[2.1rem] font-extrabold leading-none tracking-[-0.03em] text-content tnum">
          {price}
        </span>
        {period && (
          <span className="text-[13px] font-semibold text-content-dim">
            {period}
          </span>
        )}
      </p>

      <p className="mt-2 text-[13px] text-content-dim">{note}</p>

      {/* Announced to screen readers so the highlight isn't colour-only. */}
      {highlighted && (
        <p className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-accent/35 bg-accent/[0.1] px-2.5 py-1 text-[10.5px] font-semibold text-accent-soft">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M2.5 6.5 5 9l4.5-5.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          The plan you selected
        </p>
      )}

      <ul className="mt-6 flex flex-1 flex-col gap-3 border-t border-hair-soft pt-6">
        {features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2.5 text-[13.5px] text-content-dim"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="mt-[3px] shrink-0 text-accent-soft"
              aria-hidden="true"
            >
              <path
                d="M2.8 7.2 5.6 10 11.2 4"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      {/* Free plan keeps its simple link. Paid plans open Razorpay checkout. */}
      {ctaHref ? (
        <a href={ctaHref} className={`mt-7 w-full ${buttonClass}`}>
          {ctaLabel}
        </a>
      ) : alreadyActive ? (
        <span
          className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-good/40 bg-good/[0.1] py-3 text-sm font-semibold text-good"
          aria-live="polite"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2.8 7.2 5.6 10 11.2 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Your plan is active
        </span>
      ) : (
        <button
          type="button"
          onClick={onSelect}
          disabled={busy || anyPlanActive}
          className={`mt-7 w-full ${buttonClass} disabled:cursor-not-allowed disabled:opacity-60`}
          aria-busy={busy}
        >
          {busy ? "Starting checkout…" : anyPlanActive ? "Plan already active" : ctaLabel}
        </button>
      )}
    </div>
  );
}
