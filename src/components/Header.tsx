import { useEffect, useState } from "react";
import BrandLogo from "./BrandLogo";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS = [
  { href: "#product", label: "Product" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, email, signOut } = useAuth();

  /* Deepen the navbar's glass once the page has moved, so it separates from
     the hero without needing a hard border at rest. */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close the mobile sheet when the viewport grows past the breakpoint,
     otherwise it can stay open and invisible. */
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (query.matches) setMenuOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 animate-nav-in px-4 pt-3 sm:px-6 sm:pt-4">
      <div className="mx-auto w-full max-w-6xl">
        <div
          className={`glass glass-sheen rounded-[18px] transition-[background-color,box-shadow] duration-300 ease-ease ${
            scrolled ? "bg-glass-strong shadow-glass" : ""
          }`}
        >
          <div className="flex h-14 items-center justify-between gap-4 pl-3 pr-2.5 sm:h-16 sm:pl-4 sm:pr-3">
            <a
              href="/"
              className="group flex min-w-0 items-center gap-2.5 rounded-xl py-1"
              aria-label="Manga Manhwa Downloader — home"
            >
              <BrandLogo size={32} interactive />
              <span className="truncate text-[15px] font-bold tracking-[-0.01em] text-content">
                Manga Manhwa Downloader
              </span>
            </a>

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-[13px] font-medium text-content-dim transition-colors duration-200 ease-ease hover:bg-glass hover:text-content"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="hidden items-center gap-2 lg:flex">
              {isAuthenticated ? (
                <>
                  {email && (
                    <span
                      className="max-w-[16ch] truncate text-[13px] font-medium text-content-dim"
                      title={email}
                    >
                      {email}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="rounded-lg px-3 py-2 text-[13px] font-medium text-content-dim transition-colors duration-200 ease-ease hover:text-content"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <a
                    href="/login"
                    className="rounded-lg px-3 py-2 text-[13px] font-medium text-content-dim transition-colors duration-200 ease-ease hover:text-content"
                  >
                    Sign in
                  </a>
                  <a href="/signup" className="btn-accent px-4 py-2 text-[13px]">
                    Create account
                  </a>
                </>
              )}
            </div>

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-hair-soft bg-glass text-content transition-colors duration-200 ease-ease hover:bg-glass-strong lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                {menuOpen ? (
                  <path
                    d="M3 3L15 15M15 3L3 15"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d="M2.5 5H15.5M2.5 9H15.5M2.5 13H15.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </button>
          </div>

          {menuOpen && (
            <nav
              id="mobile-nav"
              aria-label="Mobile"
              className="animate-fade-up border-t border-hair-soft px-3 pb-3 pt-3 lg:hidden"
            >
              <ul className="flex flex-col gap-0.5">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="block rounded-lg px-3 py-2.5 text-sm font-medium text-content-dim transition-colors duration-200 ease-ease hover:bg-glass hover:text-content"
                      onClick={() => setMenuOpen(false)}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-col gap-2 border-t border-hair-soft pt-3">
                {isAuthenticated ? (
                  <>
                    {email && (
                      <span
                        className="truncate px-1 text-[12.5px] font-medium text-content-dim"
                        title={email}
                      >
                        Signed in as {email}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        void signOut();
                      }}
                      className="btn-glass w-full py-2.5 text-[13px]"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <a
                      href="/login"
                      className="btn-glass w-full py-2.5 text-[13px]"
                      onClick={() => setMenuOpen(false)}
                    >
                      Sign in
                    </a>
                    <a
                      href="/signup"
                      className="btn-accent w-full py-2.5 text-[13px]"
                      onClick={() => setMenuOpen(false)}
                    >
                      Create account
                    </a>
                  </>
                )}
              </div>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
