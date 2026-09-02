import type { PropsWithChildren, ReactNode } from "react";
import AmbientBackdrop from "../AmbientBackdrop";
import BrandLogo from "../BrandLogo";

interface AuthLayoutProps {
  /** Page heading, e.g. "Sign in". */
  title: string;
  /** One-line supporting copy under the title. */
  subtitle?: ReactNode;
}

/**
 * Shared shell for every auth page (login, signup, forgot / reset password).
 *
 * Reuses the homepage design system verbatim — the same ambient navy/teal
 * backdrop, the real Manga Manhwa Downloader logo, liquid-glass card, and
 * typography — so authentication feels like part of the same product. No
 * pricing cards live here; the auth screens stay focused and trustworthy.
 */
export default function AuthLayout({
  title,
  subtitle,
  children,
}: PropsWithChildren<AuthLayoutProps>) {
  return (
    <>
      <AmbientBackdrop />
      <main className="flex min-h-screen flex-col items-center justify-center px-5 py-16">
        <a
          href="/"
          className="group flex items-center gap-2.5"
          aria-label="Manga Manhwa Downloader — home"
        >
          <BrandLogo size={40} radiusClassName="rounded-[12px]" interactive />
          <span className="text-[15px] font-bold tracking-[-0.01em] text-content">
            Manga Manhwa Downloader
          </span>
        </a>

        <div className="glass glass-sheen mt-8 w-full max-w-[26rem] animate-sheet-in rounded-[22px] p-7 sm:p-8">
          <h1 className="text-[1.5rem] font-extrabold leading-tight tracking-[-0.025em] text-content">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-[13.5px] leading-relaxed text-content-dim">
              {subtitle}
            </p>
          )}

          <div className="mt-6">{children}</div>
        </div>

        <a
          href="/"
          className="mt-6 text-[13px] font-medium text-content-dim transition-colors duration-200 ease-ease hover:text-content"
        >
          ← Back to home
        </a>
      </main>
    </>
  );
}
