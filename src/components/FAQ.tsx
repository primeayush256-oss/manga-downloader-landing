import Section from "./Section";
import Reveal from "./Reveal";
import {
  FREE_PAGES,
  PLANS,
  annualSaving,
  annualSavingPercent,
  formatPrice,
} from "../config/pricing";

const FAQ_ITEMS = [
  {
    question: `What are the ${FREE_PAGES} free pages?`,
    answer: `Every account includes ${FREE_PAGES} manga page downloads at no cost. They are granted once, when you create your account.`,
  },
  {
    question: `What happens after I use all ${FREE_PAGES} pages?`,
    answer:
      "Downloads stop until you upgrade. Choose the monthly or yearly plan and unlimited downloads become available on the same account.",
  },
  {
    question: "Is the free access time-based?",
    answer: `No. The allowance is ${FREE_PAGES} page downloads, not a trial period, so there is no clock counting down — use them whenever you like.`,
  },
  {
    question: `What does the ${formatPrice(PLANS.monthly.price)}${
      PLANS.monthly.period
    } plan include?`,
    answer:
      "Unlimited manga downloads, premium Screenshot Mode, and account-based access, for as long as the subscription is active.",
  },
  {
    question: `What does the ${formatPrice(PLANS.yearly.price)}${
      PLANS.yearly.period
    } plan include?`,
    answer: `The same unlimited downloads, premium Screenshot Mode, and account-based access as the monthly plan, billed once a year. It saves ${formatPrice(
      annualSaving()
    )} a year compared with paying monthly — about ${annualSavingPercent()}%.`,
  },
  {
    question: "Is Screenshot Mode included?",
    answer:
      "Screenshot Mode is a premium feature, available on both the monthly and the yearly plan.",
  },
  {
    question: "How does account-based usage work?",
    answer:
      "Your free allowance and your plan belong to your account rather than to a device or browser profile, so signing in elsewhere carries the same status with you.",
  },
] as const;

export default function FAQ() {
  return (
    <Section id="faq" className="py-20 sm:py-28" aria-labelledby="faq-heading">
      <Reveal className="max-w-xl">
        <p className="eyebrow">FAQ</p>
        <h2
          id="faq-heading"
          className="mt-3 text-[1.9rem] font-extrabold leading-[1.15] tracking-[-0.025em] text-content sm:text-[2.4rem]"
        >
          Questions, answered
        </h2>
      </Reveal>

      <div className="mt-10 flex flex-col gap-2.5">
        {FAQ_ITEMS.map((item, index) => (
          <Reveal key={item.question} delay={index * 50}>
            <details className="group glass glass-soft rounded-[16px] px-5 transition-colors duration-300 ease-ease open:bg-glass hover:border-hair">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-[1.15rem] text-[14.5px] font-semibold text-content marker:content-none [&::-webkit-details-marker]:hidden">
                {item.question}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="shrink-0 text-content-faint transition-transform duration-300 ease-spring group-open:rotate-45 group-open:text-accent-soft"
                  aria-hidden="true"
                >
                  <path
                    d="M7 1.5v11M1.5 7h11"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </summary>
              <p className="max-w-2xl pb-5 text-[13.5px] leading-relaxed text-content-dim">
                {item.answer}
              </p>
            </details>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
