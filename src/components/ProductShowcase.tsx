import BrandLogo from "./BrandLogo";
import { FREE_PAGES, PLANS, formatPrice } from "../config/pricing";

/**
 * A website presentation of the actual Manga Manhwa Downloader popup.
 *
 * Every element here corresponds to something the extension really shows:
 * the brand lockup, the signed-in account bar, the FREE plan badge and
 * free-page meter, the "Chapters zipped" / "Images saved" stat tiles, the
 * Direct Download / Screenshot Mode segmented control, and "Scan this page".
 *
 * It is a clean re-presentation rather than a pixel copy of a screenshot,
 * and it contains no manga artwork of any kind — only the product chrome.
 * The figures are illustrative sample state, not live data.
 */

/* Illustrative sample state — a fresh account that has not spent any of
   its allowance yet, which is what a new visitor will actually see. */
const SAMPLE = {
  email: "reader@example.com",
  freePagesLeft: FREE_PAGES,
  chaptersZipped: 0,
  imagesSaved: 0,
} as const;

const usedPercent = ((FREE_PAGES - SAMPLE.freePagesLeft) / FREE_PAGES) * 100;

export default function ProductShowcase() {
  return (
    <div className="relative mx-auto w-full max-w-[400px] lg:max-w-[420px]">
      {/* Ambient glow behind the popup, echoing the extension's own
          backdrop mesh. Decorative only. */}
      <div
        className="pointer-events-none absolute -inset-10 -z-10 opacity-70 blur-3xl"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(63, 162, 255, 0.28), transparent 62%), radial-gradient(circle at 78% 74%, rgba(13, 82, 102, 0.5), transparent 60%)",
        }}
      />

      <figure className="m-0 motion-safe:animate-float">
        <div className="glass glass-sheen overflow-hidden rounded-[22px] p-4 shadow-lift">
          {/* ---------- brand head (extension .head) ---------- */}
          <div className="flex items-center gap-2.5">
            <BrandLogo size={38} />
            <div className="min-w-0">
              <p className="m-0 text-[14px] font-bold leading-tight tracking-[-0.01em] text-content">
                Manga Manhwa Downloader
              </p>
              <p className="m-0 mt-0.5 text-[11px] text-content-dim">
                one click, whole chapter
              </p>
            </div>
          </div>

          {/* ---------- signed-in account bar (extension .account-bar) ---------- */}
          <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-hair-soft bg-glass px-2 py-1.5">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-[#08131f]"
              style={{
                background: "linear-gradient(155deg, #8fd6ff, #3fa2ff)",
              }}
              aria-hidden="true"
            >
              R
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="eyebrow text-[9px]">Signed in</span>
              <span className="truncate text-[11px] font-semibold text-content">
                {SAMPLE.email}
              </span>
            </span>
            <span className="ml-auto shrink-0 rounded-lg border border-hair-soft px-2.5 py-1 text-[10.5px] font-semibold text-content-dim">
              Sign out
            </span>
          </div>

          {/* ---------- plan strip (extension .plan-strip) ---------- */}
          <div className="mt-2.5 flex items-center gap-2.5 rounded-xl border border-hair-soft bg-glass px-2.5 py-2">
            <span
              className="shrink-0 rounded-full px-2 py-[3px] text-[9.5px] font-extrabold uppercase tracking-[0.5px] text-[#08131f]"
              style={{
                background: "linear-gradient(155deg, #8fd6ff, #3fa2ff)",
              }}
            >
              Free
            </span>
            <span className="text-[11px] leading-snug text-content-dim">
              <strong className="font-semibold text-content tnum">
                {SAMPLE.freePagesLeft} of {FREE_PAGES}
              </strong>{" "}
              free pages left
            </span>
          </div>

          {/* ---------- stat tiles (extension .stats-strip) ---------- */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <StatTile value={SAMPLE.chaptersZipped} label="Chapters zipped" />
            <StatTile value={SAMPLE.imagesSaved} label="Images saved" />
          </div>

          {/* ---------- segmented control (extension .segmented) ---------- */}
          <div className="mt-3 flex gap-0.5 rounded-[13px] border border-hair bg-glass p-[3px]">
            <span
              className="flex-1 rounded-[10px] px-2 py-2 text-center text-[11.5px] font-semibold text-[#08131f] shadow-accent-sm"
              style={{
                background: "linear-gradient(155deg, #3fa2ff, #2c86e0)",
              }}
            >
              Direct Download
            </span>
            <span className="flex flex-1 items-center justify-center gap-1 rounded-[10px] px-2 py-2 text-center text-[11.5px] font-semibold text-content-dim">
              Screenshot Mode
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                className="shrink-0 text-gold"
                aria-hidden="true"
              >
                <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
                <path d="M8.5 10.5V7.5a3.5 3.5 0 017 0v3" strokeLinecap="round" />
              </svg>
            </span>
          </div>

          {/* ---------- scan action (extension #scanBtn) ---------- */}
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-hair bg-glass-strong px-3 py-2.5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="shrink-0 text-content"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
            <span className="text-[13px] font-semibold text-content">
              Scan this page
            </span>
          </div>

          <p className="m-0 mt-2.5 text-[10.5px] leading-relaxed text-content-faint">
            Grabs the original files as-is — full quality, nothing re-encoded.
          </p>

          {/* ---------- free plan section + usage meter
                        (extension .pricing / .free-meter) ---------- */}
          <div className="mt-4 border-t border-hair-soft pt-3.5">
            <p className="m-0 text-[12.5px] font-bold tracking-[0.2px] text-content">
              Free plan
            </p>
            <p className="m-0 mt-0.5 text-[10.5px] leading-relaxed text-content-dim">
              {FREE_PAGES} free pages, then unlimited from{" "}
              {formatPrice(PLANS.monthly.price)}
              {PLANS.monthly.period}.
            </p>

            <div className="mt-2.5">
              <div
                className="h-[5px] overflow-hidden rounded-full bg-white/[0.09]"
                role="presentation"
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${usedPercent}%`,
                    background: "linear-gradient(90deg, #3fa2ff, #8fd6ff)",
                  }}
                />
              </div>
              <p className="m-0 mt-1.5 font-mono text-[10px] tracking-[0.1px] text-content-dim tnum">
                <strong className="font-semibold text-content">
                  {FREE_PAGES - SAMPLE.freePagesLeft} of {FREE_PAGES}
                </strong>{" "}
                free pages used
              </p>
            </div>

            {/* Compact plan cards, as the popup shows them */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <MiniPlanCard
                name={PLANS.monthly.name}
                amount={formatPrice(PLANS.monthly.price)}
                period={PLANS.monthly.period}
              />
              <MiniPlanCard
                name={PLANS.yearly.name}
                amount={formatPrice(PLANS.yearly.price)}
                period={PLANS.yearly.period}
                featured
              />
            </div>
          </div>
        </div>

        <figcaption className="mt-4 text-center text-[11.5px] text-content-faint">
          The Manga Manhwa Downloader extension popup
        </figcaption>
      </figure>
    </div>
  );
}

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-hair-soft bg-glass px-3 py-2.5">
      <span className="font-mono text-[18px] font-bold leading-none tracking-[-0.2px] text-content tnum">
        {value}
      </span>
      <span className="eyebrow">{label}</span>
    </div>
  );
}

function MiniPlanCard({
  name,
  amount,
  period,
  featured = false,
}: {
  name: string;
  amount: string;
  period: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`flex flex-col rounded-[13px] border px-2.5 py-2.5 ${
        featured
          ? "border-accent/40 bg-accent/[0.09]"
          : "border-hair-soft bg-glass"
      }`}
    >
      {featured && (
        <span className="mb-1.5 self-start rounded-full bg-accent/20 px-1.5 py-[2px] text-[8.5px] font-extrabold uppercase tracking-[0.5px] text-accent-soft">
          Best value
        </span>
      )}
      <span className="eyebrow text-[9.5px] tracking-[0.7px]">{name}</span>
      <span className="mt-0.5 flex items-baseline gap-0.5">
        <span className="text-[18px] font-extrabold leading-none tracking-[-0.4px] text-content tnum">
          {amount}
        </span>
        <span className="text-[10px] font-semibold text-content-dim">
          {period}
        </span>
      </span>
      <span className="mt-1 text-[9.5px] leading-snug text-content-faint">
        Unlimited downloads
      </span>
    </div>
  );
}
