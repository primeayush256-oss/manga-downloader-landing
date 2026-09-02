import Section from "./Section";
import BrandLogo from "./BrandLogo";

const YEAR = new Date().getFullYear();

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Product", href: "#product" },
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    heading: "Account",
    links: [
      /* TODO(auth-integration): wire to Supabase Auth flows */
      { label: "Login", href: "/login" },
      { label: "Create account", href: "/signup" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
] as const;

export default function Footer() {
  return (
    <footer className="border-t border-hair-soft">
      <Section className="py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <a
              href="/"
              className="group flex items-center gap-2.5"
              aria-label="Manga Manhwa Downloader — home"
            >
              <BrandLogo size={32} interactive />
              <span className="text-[14.5px] font-bold tracking-[-0.01em] text-content">
                Manga Manhwa Downloader
              </span>
            </a>
            <p className="mt-3.5 max-w-xs text-[13px] leading-relaxed text-content-faint">
              one click, whole chapter — a Chrome extension for downloading
              manga chapters directly from the pages you read.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="eyebrow">{column.heading}</h3>
              <ul className="mt-3.5 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[13px] text-content-dim transition-colors duration-200 ease-ease hover:text-content"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-hair-soft pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11.5px] text-content-faint">
            © {YEAR} Manga Manhwa Downloader. All rights reserved.
          </p>
          <p className="text-[11.5px] text-content-faint">
            For personal use — saving chapters you already read, for offline
            access.
          </p>
        </div>
      </Section>
    </footer>
  );
}
