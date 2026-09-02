# Manga Manhwa Downloader — Landing Page

Marketing / upgrade landing page for the **Manga Manhwa Downloader** Chrome
extension (*one click, whole chapter*).

This is a standalone project. It does not modify, import from, or depend on
the extension codebase.

## Stack

- Vite + React + TypeScript
- Tailwind CSS (custom design tokens, no default theme colours)
- Vitest for unit tests
- Static output, deployable to Cloudflare Pages

## Getting started

```bash
npm install
npm run dev         # local dev server
npm run typecheck   # TypeScript project check
npm run lint        # ESLint
npm test            # Vitest unit tests
npm run build       # production build to dist/
npm run preview     # preview the production build locally
```

## Design system — matched to the extension

The site is deliberately not styled independently. Its tokens are a direct
port of the extension's own `popup.css` custom properties, so the landing
page and the extension read as one product.

| Token | Value | Tailwind name |
| --- | --- | --- |
| `--void` | `#070b16` | `bg-void` |
| `--mesh-1` / `--mesh-2` | `#163a7a` / `#0d5266` | `mesh-navy` / `mesh-teal` |
| `--accent` | `#3fa2ff` | `accent` |
| `--accent-2` | `#8fd6ff` | `accent-soft` |
| `--text` | `#f1f5fb` | `content` |
| `--text-dim` | `#93a2bd` | `content-dim` |
| `--text-faint` | `#5c6883` | `content-faint` |
| `--glass` / `--glass-strong` | `rgba(255,255,255,.06)` / `.11` | `bg-glass` / `bg-glass-strong` |
| `--border` / `--border-soft` | `rgba(255,255,255,.14)` / `.08` | `border-hair` / `border-hair-soft` |
| `--gold` | `#ffb648` | `gold` |
| `--ease` / `--ease-spring` | see config | `ease-ease` / `ease-spring` |

**One deliberate deviation:** the extension's backdrop mixes in a third
violet mesh (`--mesh-3: #2c1f52`). The website omits it and stays on navy
and teal only, so the brand reads calm and blue rather than purple.

Typography uses the same system font stack as the extension
(`-apple-system` → `SF Pro` → `Segoe UI` → `Roboto`), with the `SF Mono`
stack for figures. No webfonts are loaded, so there is no font network
request and no layout shift.

Composite surfaces live in `src/index.css`: `.glass`, `.glass-soft`,
`.glass-sheen`, `.btn-accent`, `.btn-glass`, `.eyebrow`.

## Logo

`public/logo.png` is the extension's own `icons/icon-header.png`, copied
byte-for-byte. `public/icon128.png` is its `icons/icon128.png`.

**Do not redraw, recolour, or substitute these.** `src/components/BrandLogo.tsx`
is the only component that renders the mark; it is used in the navbar, hero,
product showcase, final CTA, footer, placeholder pages, and as the favicon.

If the extension's icon is ever updated, re-copy the file rather than
editing anything here.

## Product showcase

`src/components/ProductShowcase.tsx` is a website presentation of the
**real** extension popup. Every element maps to something the extension
actually shows: the brand lockup, the signed-in account bar, the `FREE`
plan badge and free-page meter, the "Chapters zipped" / "Images saved" stat
tiles, the Direct Download / Screenshot Mode segmented control, and
"Scan this page".

It is a clean re-presentation, not a pixel copy of a screenshot. The figures
in it are illustrative sample state, not live data. It contains **no manga
artwork of any kind** — only product chrome.

## Plan query parameter

The extension redirects users here with `?plan=monthly` or `?plan=yearly`
(see `pricing-config.js` → `buildUpgradeUrl` in the extension).

`src/utils/planQuery.ts` reads and validates that parameter. Only the two
known plan ids are ever honoured; anything else — missing, mistyped, or
injected — resolves to "no plan selected" so URL input can never steer
application state. `src/components/Pricing.tsx` uses the result to
highlight the matching card, and marks it with a visible
"The plan you selected" label so the highlight is never colour-only.

Covered by `src/utils/planQuery.test.ts`.

> The extension can also build `?view=account` for existing subscribers to
> manage their subscription. That view is not implemented yet and is out of
> scope for this phase; the parameter is currently ignored.

## Pricing

All prices, the free-page allowance, and every derived number (annual
saving, saving %, effective monthly cost) live in `src/config/pricing.ts`.
Nothing is hard-coded elsewhere — change a price there and the whole page
updates, including the FAQ copy.

Advertised saving is derived, never hand-written:
`₹99 × 12 = ₹1,188` vs `₹999` → saves `₹189/year`, about `16%`.
Asserted in `src/config/pricing.test.ts` so the claim cannot drift from the
prices.

## Motion & accessibility

- Section reveals use `IntersectionObserver` via `src/components/Reveal.tsx`.
- `prefers-reduced-motion: reduce` collapses animations and transitions, and
  force-resolves `.reveal` to its final state, so content can never be left
  stuck at `opacity: 0`.
- One `<h1>` per page; sections use `h2`, cards use `h3`.
- Landmark sections are labelled via `aria-labelledby` / `aria-label`.
- Glass panels keep a visible border under `forced-colors: active`.

Full WCAG conformance has not been validated — that needs manual testing
with assistive technology and expert review.

## Payments & auth — not implemented yet

Per the current phase scope:

- **No Razorpay integration.** Pricing CTAs link to `/signup` (with the plan
  as a query param) as placeholders. Search for `TODO(payments-integration)`.
- **No live Supabase auth.** "Sign in" / "Create account" link to `/login`
  and `/signup`, which render a placeholder page. Search for
  `TODO(auth-integration)`.
- **Privacy Policy / Terms** (`/privacy`, `/terms`) are placeholder pages
  until real legal copy exists.

## Known gaps

- `index.html` references `/og-image.png` for social sharing, which does not
  exist yet. A 1200×630 image needs to be added to `public/`, or the two
  `og:image` / `twitter:image` tags removed.
- The extension's `LANDING_PAGE_URL` in `pricing-config.js` is still the
  placeholder value and needs replacing once this site is deployed.

## Deployment (Cloudflare Pages)

- Build command: `npm run build`
- Output directory: `dist`
- `public/_redirects` is included so client-side routes (`/privacy`,
  `/terms`, `/login`, `/signup`) resolve correctly.
