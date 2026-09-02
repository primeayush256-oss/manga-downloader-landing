import Section from "./Section";
import Reveal from "./Reveal";
import { FREE_PAGES } from "../config/pricing";

/**
 * A minimal trust strip.
 *
 * Every item here is a factual property of the product. No user counts,
 * ratings, or testimonials are claimed, because there is no verified data
 * to back them up.
 */
const TRUST_POINTS = [
  `${FREE_PAGES} free pages`,
  "Account based",
  "Fast downloads",
  "Secure authentication",
  "Premium upgrade",
] as const;

export default function TrustSection() {
  return (
    <Section className="pb-4" aria-label="What the product provides">
      <Reveal>
        <ul className="glass glass-soft flex flex-wrap items-center justify-center gap-x-3 gap-y-3 rounded-[18px] px-5 py-5 sm:gap-x-2 sm:px-8">
          {TRUST_POINTS.map((point, index) => (
            <li key={point} className="flex items-center gap-3">
              {index > 0 && (
                <span
                  className="hidden h-1 w-1 rounded-full bg-white/20 sm:block"
                  aria-hidden="true"
                />
              )}
              <span className="flex items-center gap-2 text-[13px] font-medium text-content-dim">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="shrink-0 text-accent-soft"
                  aria-hidden="true"
                >
                  <path
                    d="M2.8 7.2 5.6 10 11.2 4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {point}
              </span>
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}
