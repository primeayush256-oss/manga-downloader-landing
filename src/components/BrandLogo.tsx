/**
 * The Manga Manhwa Downloader mark.
 *
 * This renders the extension's own icon asset (`public/logo.png`, copied
 * verbatim from the extension's `icons/icon-header.png`). It is never
 * redrawn, recoloured, or substituted with an SVG lookalike — the website
 * and the extension show the exact same file.
 *
 * Presentation mirrors the extension's `.mark` rule: square, rounded, and
 * lifted with a soft route-blue glow.
 */

interface BrandLogoProps {
  /** Rendered size in px. Also used for the intrinsic width/height. */
  size?: number;
  /** Tailwind border-radius class, matched to the surrounding surface. */
  radiusClassName?: string;
  className?: string;
  /** Adds the extension's playful hover tilt. Off for decorative uses. */
  interactive?: boolean;
}

export default function BrandLogo({
  size = 36,
  radiusClassName = "rounded-[11px]",
  className = "",
  interactive = false,
}: BrandLogoProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden shadow-accent-sm ${radiusClassName} ${
        interactive
          ? "transition-transform duration-300 ease-spring group-hover:-rotate-6 group-hover:scale-105"
          : ""
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/logo.png"
        alt=""
        width={size}
        height={size}
        decoding="async"
        className="h-full w-full object-cover"
      />
    </span>
  );
}
