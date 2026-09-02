import {
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
  type RefObject,
} from "react";

interface RevealProps {
  /** Stagger in ms, applied as a transition-delay. */
  delay?: number;
  className?: string;
  /** Element to render. Defaults to a div. */
  as?: "div" | "li" | "article" | "section";
}

/**
 * Reveals its children once they scroll into view.
 *
 * Motion is opt-out rather than opt-in: if the visitor prefers reduced
 * motion, or IntersectionObserver is unavailable, the content is rendered
 * in its final state immediately. The `.reveal` utility in index.css also
 * force-resolves under `prefers-reduced-motion`, so content can never be
 * left stuck at `opacity: 0`.
 */
export default function Reveal({
  delay = 0,
  className = "",
  as = "div",
  children,
}: PropsWithChildren<RevealProps>) {
  const ref = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Tag = as as "div";

  return (
    <Tag
      ref={ref as RefObject<HTMLDivElement>}
      className={`reveal ${revealed ? "is-revealed" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
