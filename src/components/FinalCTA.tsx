import Section from "./Section";
import Reveal from "./Reveal";
import BrandLogo from "./BrandLogo";
import { FREE_PAGES, PLANS, formatPrice } from "../config/pricing";

export default function FinalCTA() {
  return (
    <Section className="py-16 sm:py-20">
      <Reveal>
        <div className="glass glass-sheen relative overflow-hidden rounded-[24px] px-6 py-14 text-center sm:px-16 sm:py-16">
          {/* Restrained accent bloom, matching the header atmosphere. */}
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(520px 260px at 50% -10%, rgba(63, 162, 255, 0.22), transparent 65%), radial-gradient(420px 240px at 50% 115%, rgba(13, 82, 102, 0.3), transparent 62%)",
            }}
          />

          <BrandLogo size={52} radiusClassName="rounded-[15px]" className="mx-auto" />

          <h2 className="mt-6 text-[1.8rem] font-extrabold leading-[1.15] tracking-[-0.025em] text-content sm:text-[2.2rem]">
            Start with {FREE_PAGES} free pages
          </h2>

          <p className="mx-auto mt-3.5 max-w-md text-[14.5px] leading-relaxed text-content-dim">
            Install the extension, create an account, and download your first
            chapter. Upgrade to unlimited from{" "}
            {formatPrice(PLANS.monthly.price)}
            {PLANS.monthly.period} only when you&rsquo;re ready.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {/* TODO(auth-integration): wire to Supabase Auth sign-up flow */}
            <a href="/signup" className="btn-accent w-full sm:w-auto">
              Get started free
            </a>
            <a href="#pricing" className="btn-glass w-full sm:w-auto">
              View pricing
            </a>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
