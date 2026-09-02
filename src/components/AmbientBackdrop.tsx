/**
 * The site's atmospheric backdrop.
 *
 * A direct adaptation of the extension's `.backdrop` rule — layered radial
 * meshes over `--void`, densest near the top of the page so the header area
 * carries the same dark teal/blue glow as the extension popup.
 *
 * The extension's third violet mesh is intentionally omitted; the website
 * stays on navy and teal only.
 */
export default function AmbientBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Base wash: navy top-left, teal top-right, matching --mesh-1 / --mesh-2 */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(1100px 620px at 14% -8%, rgba(22, 58, 122, 0.72), transparent 62%)",
            "radial-gradient(900px 560px at 92% 2%, rgba(13, 82, 102, 0.6), transparent 58%)",
            "radial-gradient(1000px 700px at 50% 108%, rgba(13, 60, 96, 0.42), transparent 62%)",
            "#070b16",
          ].join(","),
        }}
      />

      {/* Slow-drifting accent bloom. Purely decorative; collapses under
          prefers-reduced-motion via the global guard in index.css. */}
      <div
        className="absolute -top-40 left-1/2 h-[46rem] w-[46rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl animate-drift-mesh"
        style={{
          background:
            "radial-gradient(circle, rgba(63, 162, 255, 0.3) 0%, rgba(63, 162, 255, 0) 68%)",
        }}
      />

      {/* Hairline horizon under the header region, echoing the popup's
          separation between the header glow and the body. */}
      <div className="absolute inset-x-0 top-[34rem] h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

      {/* Very faint vignette to keep long scrolls from feeling flat. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, transparent 40%, rgba(7, 11, 22, 0.55) 100%)",
        }}
      />
    </div>
  );
}
