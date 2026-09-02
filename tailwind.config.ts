import type { Config } from "tailwindcss";

/**
 * Design tokens are a direct port of the Manga Manhwa Downloader Chrome
 * extension's own `popup.css` custom properties, so the landing page and the
 * extension render from one shared palette.
 *
 * Deliberate deviation: the extension's backdrop mixes in a third violet
 * mesh (`--mesh-3: #2c1f52`). The website keeps the navy + teal meshes only,
 * so the brand reads calm and blue rather than purple.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* --void: the near-black navy everything sits on */
        void: "#070b16",

        /* Atmospheric mesh colours used by the ambient backdrop */
        mesh: {
          navy: "#163a7a",
          teal: "#0d5266",
        },

        /* Deeper navy surfaces for opaque panels */
        navy: {
          900: "#0a1020",
          800: "#0e1526",
          700: "#12182a",
        },

        /* --accent / --accent-2: route blue + sky */
        accent: {
          DEFAULT: "#3fa2ff",
          deep: "#2170c9",
          soft: "#8fd6ff",
        },

        /* --text / --text-dim / --text-faint */
        content: {
          DEFAULT: "#f1f5fb",
          dim: "#93a2bd",
          faint: "#5c6883",
        },

        /* Status tokens, used as sparingly as the extension uses them */
        gold: {
          DEFAULT: "#ffb648",
          deep: "#d98a1c",
        },
        good: "#3ddc97",
        bad: "#ff6b6b",
      },

      /* --glass / --glass-strong / --glass-press */
      backgroundColor: {
        glass: "rgba(255, 255, 255, 0.06)",
        "glass-strong": "rgba(255, 255, 255, 0.11)",
        "glass-press": "rgba(255, 255, 255, 0.16)",
      },

      /* --border / --border-soft */
      borderColor: {
        hair: "rgba(255, 255, 255, 0.14)",
        "hair-soft": "rgba(255, 255, 255, 0.08)",
      },

      fontFamily: {
        /* Mirrors --font-ui from popup.css */
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'SF Pro Display'",
          "'SF Pro Text'",
          "'Segoe UI Variable'",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
        /* Mirrors --font-mono; used for figures, exactly as the extension does */
        mono: [
          "'SF Mono'",
          "ui-monospace",
          "'Cascadia Code'",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },

      transitionTimingFunction: {
        /* --ease / --ease-spring */
        ease: "cubic-bezier(0.22, 1, 0.36, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },

      boxShadow: {
        /* Matches the extension's accent glow, restrained */
        accent: "0 6px 18px rgba(63, 162, 255, 0.32)",
        "accent-sm": "0 4px 14px rgba(63, 162, 255, 0.35)",
        glass: "0 18px 40px -20px rgba(0, 0, 0, 0.7)",
        lift: "0 26px 60px -28px rgba(0, 0, 0, 0.85)",
      },

      borderRadius: {
        glass: "16px",
      },

      maxWidth: {
        prose: "68ch",
      },

      keyframes: {
        /* Ported from popup.css: fadeUp / sheetIn / shimmer / driftMesh */
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "sheet-in": {
          "0%": { opacity: "0", transform: "translateY(10px) scale(0.99)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "nav-in": {
          "0%": { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-60% 0" },
        },
        "drift-mesh": {
          "0%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "100%": { transform: "translate3d(0, -1.5%, 0) scale(1.05)" },
        },
        float: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-10px)" },
        },
      },

      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "sheet-in": "sheet-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both",
        "nav-in": "nav-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        shimmer: "shimmer 1.3s ease-in-out infinite",
        "drift-mesh": "drift-mesh 24s ease-in-out infinite alternate",
        float: "float 7s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [],
} satisfies Config;
