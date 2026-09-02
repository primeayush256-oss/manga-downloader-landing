import Section from "./Section";
import Reveal from "./Reveal";
import { FREE_PAGES, PLANS, formatPrice } from "../config/pricing";

const STEPS = [
  {
    number: "01",
    title: "Create your account",
    description:
      "Sign up inside the extension. Free, and no card is needed for the free allowance.",
  },
  {
    number: "02",
    title: `Use your ${FREE_PAGES} free pages`,
    description: `Open a chapter, scan the page, and download. Your ${FREE_PAGES} free pages have no time limit.`,
  },
  {
    number: "03",
    title: "Upgrade for unlimited downloads",
    description: `Move to ${formatPrice(PLANS.monthly.price)}${
      PLANS.monthly.period
    } or ${formatPrice(PLANS.yearly.price)}${
      PLANS.yearly.period
    } whenever you need more.`,
  },
] as const;

export default function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      className="py-20 sm:py-28"
      aria-labelledby="how-heading"
    >
      <Reveal className="max-w-xl">
        <p className="eyebrow">How it works</p>
        <h2
          id="how-heading"
          className="mt-3 text-[1.9rem] font-extrabold leading-[1.15] tracking-[-0.025em] text-content sm:text-[2.4rem]"
        >
          Three steps, then you&rsquo;re downloading
        </h2>
      </Reveal>

      <ol className="relative mt-12 grid gap-4 lg:grid-cols-3">
        {/* Connector, echoing the dashed route track in the extension's
            result card. Desktop only; decorative. */}
        <div
          className="pointer-events-none absolute left-0 right-0 top-[3.4rem] hidden h-px lg:block"
          aria-hidden="true"
          style={{
            background:
              "repeating-linear-gradient(to right, rgba(255,255,255,0.16) 0, rgba(255,255,255,0.16) 4px, transparent 4px, transparent 9px)",
          }}
        />

        {STEPS.map((step, index) => (
          <Reveal as="li" key={step.number} delay={index * 90} className="relative">
            <div className="glass glass-soft glass-sheen h-full rounded-[18px] p-6">
              <span className="relative z-10 flex h-11 w-11 items-center justify-center rounded-[13px] border border-accent/35 bg-accent/[0.12] font-mono text-[15px] font-bold text-accent-soft tnum">
                {step.number}
              </span>

              <h3 className="mt-5 text-[15.5px] font-bold tracking-[-0.01em] text-content">
                {step.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-content-dim">
                {step.description}
              </p>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
