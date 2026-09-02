import Section from "./Section";
import ProductShowcase from "./ProductShowcase";
import BrandLogo from "./BrandLogo";
import { FREE_PAGES } from "../config/pricing";

/* Restated from the extension's own copy so the promise reads identically
   in both places. */
const ASSURANCES = [
  `${FREE_PAGES} free pages included with every account`,
  "No time-based trial",
  "No credit card required for the free allowance",
];

export default function Hero() {
  return (
    <Section
      id="product"
      className="pt-28 pb-16 sm:pt-36 sm:pb-24"
      aria-labelledby="hero-heading"
    >
      <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        <div className="max-w-xl animate-sheet-in">
          {/* Product lockup — the extension's mark, name and subtitle,
              in the same order the popup presents them. */}
          <div className="flex items-center gap-3">
            <BrandLogo size={44} radiusClassName="rounded-[13px]" />
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-[-0.01em] text-content">
                Manga Manhwa Downloader
              </span>
              <span className="text-[11px] text-content-dim">
                one click, whole chapter
              </span>
            </span>
          </div>

          <h1
            id="hero-heading"
            className="mt-7 text-[2.6rem] font-extrabold leading-[1.06] tracking-[-0.03em] text-content sm:text-[3.4rem]"
          >
            Download manga.
            <br />
            <span className="bg-gradient-to-br from-white via-accent-soft to-accent bg-clip-text text-transparent">
              One click, whole chapter.
            </span>
          </h1>

          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-content-dim sm:text-base">
            A fast and simple Chrome extension for downloading manga chapters
            directly from the pages you read.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* TODO(auth-integration): wire to Supabase Auth sign-up flow */}
            <a href="/signup" className="btn-accent w-full sm:w-auto">
              Get started free
            </a>
            <a href="#pricing" className="btn-glass w-full sm:w-auto">
              View pricing
            </a>
          </div>

          <ul className="mt-8 flex flex-col gap-2.5">
            {ASSURANCES.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-[13px] text-content-dim"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="mt-[3px] shrink-0 text-accent-soft"
                  aria-hidden="true"
                >
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeOpacity="0.35" />
                  <path
                    d="M5 8.3 7 10.2 11 5.9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-sheet-in [animation-delay:140ms]">
          <ProductShowcase />
        </div>
      </div>
    </Section>
  );
}
