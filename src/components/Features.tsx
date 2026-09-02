import type { ReactNode } from "react";
import Section from "./Section";
import Reveal from "./Reveal";
import { FREE_PAGES } from "../config/pricing";

/* Small line icons only, drawn on the same 24-unit grid and 2px stroke the
   extension's own inline SVGs use. */
const ICONS: Record<string, ReactNode> = {
  fast: (
    <>
      <path d="M12 3v13" strokeLinecap="round" />
      <path d="M6.5 11.5 12 17l5.5-5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 20h15" strokeLinecap="round" />
    </>
  ),
  free: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9 14.5 15 8.5" strokeLinecap="round" />
      <circle cx="9.8" cy="9.8" r="1.3" />
      <circle cx="14.2" cy="14.2" r="1.3" />
    </>
  ),
  direct: (
    <>
      <path d="M5 4.5h9.5L19 9v10.5H5z" strokeLinejoin="round" />
      <path d="M14 4.5V9h5" strokeLinejoin="round" />
      <path d="M12 11v5" strokeLinecap="round" />
      <path d="M9.8 13.8 12 16l2.2-2.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  screenshot: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="M3.5 10h17" strokeLinecap="round" />
      <path d="M8 14.5h5" strokeLinecap="round" />
    </>
  ),
  account: (
    <>
      <circle cx="12" cy="9" r="3.3" />
      <path d="M5.5 19.5a6.5 6.5 0 0113 0" strokeLinecap="round" />
      <circle cx="12" cy="12" r="9" strokeOpacity="0.4" />
    </>
  ),
  unlimited: (
    <>
      <path
        d="M8 12c0-1.9-1.3-3.2-2.8-3.2S2.5 10.1 2.5 12s1.2 3.2 2.7 3.2S8 13.9 8 12zm0 0c0 1.9 1.3 3.2 2.8 3.2S16 13.9 16 12s1.3-3.2 2.8-3.2 2.7 1.3 2.7 3.2-1.2 3.2-2.7 3.2S16 13.9 16 12s-1.3-3.2-2.8-3.2S8 10.1 8 12z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
};

const FEATURES = [
  {
    icon: "fast",
    title: "Fast downloads",
    description: "Download manga chapters quickly and conveniently.",
  },
  {
    icon: "free",
    title: `${FREE_PAGES} free pages`,
    description: `Every account starts with ${FREE_PAGES} free page downloads.`,
  },
  {
    icon: "direct",
    title: "Direct download",
    description: "Download chapter pages directly from supported pages.",
  },
  {
    icon: "screenshot",
    title: "Screenshot Mode",
    description: "Premium screenshot-based capture functionality.",
  },
  {
    icon: "account",
    title: "Account based usage",
    description: "Your free allowance is tied to your account.",
  },
  {
    icon: "unlimited",
    title: "Unlimited with Premium",
    description: `Upgrade when your ${FREE_PAGES} free pages are exhausted.`,
  },
] as const;

export default function Features() {
  return (
    <Section
      id="features"
      className="py-20 sm:py-28"
      aria-labelledby="features-heading"
    >
      <Reveal className="max-w-xl">
        <p className="eyebrow">Features</p>
        <h2
          id="features-heading"
          className="mt-3 text-[1.9rem] font-extrabold leading-[1.15] tracking-[-0.025em] text-content sm:text-[2.4rem]"
        >
          Built for the way you already read
        </h2>
        <p className="mt-3.5 text-[15px] leading-relaxed text-content-dim">
          Everything the extension does, in one place — nothing you have to
          configure before your first download.
        </p>
      </Reveal>

      <ul className="mt-12 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <Reveal as="li" key={feature.title} delay={index * 60}>
            <article className="group glass glass-soft glass-sheen h-full rounded-[18px] p-6 transition-[transform,background-color,border-color] duration-300 ease-ease hover:-translate-y-1 hover:border-hair hover:bg-glass">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-hair-soft bg-glass text-accent-soft transition-colors duration-300 ease-ease group-hover:border-accent/40 group-hover:text-accent">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  aria-hidden="true"
                >
                  {ICONS[feature.icon]}
                </svg>
              </span>

              <h3 className="mt-5 text-[15px] font-bold tracking-[-0.01em] text-content">
                {feature.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-content-dim">
                {feature.description}
              </p>
            </article>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
