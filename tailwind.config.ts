import type { Config } from "tailwindcss";

/**
 * Tailwind CSS v4 Configuration
 *
 * Crowe Brand Identity Design System
 * - Primary: Crowe Indigo (#011E41) + Crowe Amber (#F5A800)
 * - Secondary colors: Teal, Cyan, Blue, Violet, Coral (accents only)
 * - Typography: Helvetica Now Text/Display (Arial fallback)
 * - No gradient backgrounds
 *
 * Source: https://www.crowedigitalbrand.com
 */

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ============================================
           CROWE PRIMARY COLORS
           These are the foundation — must dominate all digital assets
           ============================================ */
        crowe: {
          amber: {
            bright: "#FFD231",
            DEFAULT: "#F5A800",
            dark: "#D7761D",
          },
          indigo: {
            bright: "#003F9F",
            DEFAULT: "#002E62",
            dark: "#011E41",
          },
          /* Secondary Colors - Complement primaries, never overshadow */
          teal: {
            bright: "#16D9BC",
            DEFAULT: "#05AB8C",
            dark: "#0C7876",
          },
          cyan: {
            light: "#8FE1FF",
            DEFAULT: "#54C0E8",
            dark: "#007DA3",
          },
          blue: {
            light: "#32A8FD",
            DEFAULT: "#0075C9",
            dark: "#0050AD",
          },
          violet: {
            bright: "#EA80FF",
            DEFAULT: "#B14FC5",
            dark: "#612080",
          },
          coral: {
            bright: "#FF526F",
            DEFAULT: "#E5376B",
            dark: "#992A5C",
          },
        },

        /* ============================================
           NEUTRAL TINTS — WARM undertone (not pure gray!)
           Every gray has indigo warmth so nothing feels cold
           ============================================ */
        tint: {
          950: "#1a1d2b",         /* Near-black with indigo warmth */
          900: "#2d3142",         /* Primary text — warm dark slate */
          700: "#545968",         /* Secondary text — muted with blue undertone */
          500: "#8b90a0",         /* Muted/placeholder text */
          300: "#c8cbd6",         /* Soft borders, dividers */
          200: "#dfe1e8",         /* Subtle separators */
          100: "#eef0f4",         /* Very subtle backgrounds */
          50: "#f6f7fa",          /* Off-white sections */
        },

        /* ============================================
           SOFT COLOR VARIANTS - Premium, Warm UI
           ============================================ */
        soft: {
          navy: {
            light: "#1e3a5f",
            DEFAULT: "#1a365d",
            dark: "#172554",
          },
        },

        /* ============================================
           Functional Colors - Aligned to brand
           ============================================ */
        success: {
          DEFAULT: "#05AB8C", // Crowe Teal
          light: "#16D9BC",
          dark: "#0C7876",
        },
        warning: {
          DEFAULT: "#F5A800", // Crowe Amber
          light: "#FFD231",
          dark: "#D7761D",
        },
        error: {
          DEFAULT: "#E5376B", // Crowe Coral
          light: "#FF526F",
          dark: "#992A5C",
        },
        info: {
          DEFAULT: "#0075C9", // Crowe Blue
          light: "#32A8FD",
          dark: "#0050AD",
        },

        /* ============================================
           Semantic Tokens - mapped to CSS variables
           ============================================ */
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",

        "surface-primary": "var(--surface-primary)",
        "surface-secondary": "var(--surface-secondary)",
        "surface-elevated": "var(--surface-elevated)",

        "border-default": "var(--border-default)",
        "border-strong": "var(--border-strong)",
      },

      fontFamily: {
        display: [
          "Helvetica Now Display",
          "Helvetica Neue",
          "Arial",
          "system-ui",
          "sans-serif",
        ],
        body: [
          "Helvetica Now Text",
          "Helvetica Neue",
          "Arial",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "IBM Plex Mono",
          "Consolas",
          "monospace",
        ],
      },

      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },

      /* ============================================
         INDIGO-TINTED SHADOWS — warm, not cold
         Use rgba(1, 30, 65, ...) NOT rgba(0, 0, 0, ...)
         ============================================ */
      boxShadow: {
        "crowe-sm": "0 1px 3px rgba(1,30,65,0.06), 0 1px 2px rgba(1,30,65,0.04)",
        "crowe-md": "0 4px 8px -2px rgba(1,30,65,0.06), 0 2px 4px -1px rgba(1,30,65,0.04)",
        "crowe-lg": "0 6px 16px -4px rgba(1,30,65,0.07), 0 4px 6px -2px rgba(1,30,65,0.04)",
        "crowe-xl": "0 12px 32px -8px rgba(1,30,65,0.08), 0 8px 16px -4px rgba(1,30,65,0.03)",
        "crowe-hover": "0 8px 24px -4px rgba(1,30,65,0.10), 0 4px 8px -2px rgba(1,30,65,0.04)",
        "crowe-card": "0 1px 3px rgba(1,30,65,0.04), 0 6px 16px rgba(1,30,65,0.04), 0 12px 32px rgba(1,30,65,0.02)",
        "amber-glow": "0 4px 16px rgba(245,168,0,0.20)",
        sm: "0 1px 3px rgba(1, 30, 65, 0.06), 0 1px 2px rgba(1, 30, 65, 0.04)",
        md: "0 4px 8px -2px rgba(1, 30, 65, 0.06), 0 2px 4px -1px rgba(1, 30, 65, 0.04)",
        lg: "0 6px 16px -4px rgba(1, 30, 65, 0.07), 0 4px 6px -2px rgba(1, 30, 65, 0.04)",
        xl: "0 12px 32px -8px rgba(1, 30, 65, 0.08), 0 8px 16px -4px rgba(1, 30, 65, 0.03)",
        hover: "0 8px 24px -4px rgba(1, 30, 65, 0.10), 0 4px 8px -2px rgba(1, 30, 65, 0.04)",
      },

      backgroundColor: {
        page: "#f8f9fc",
        section: "#f6f7fa",
        "section-warm": "#f0f2f8",
        "section-amber": "#fff8eb",
      },

      transitionDuration: {
        instant: "75ms",
        fast: "150ms",
        normal: "250ms",
        slow: "350ms",
        slower: "500ms",
      },

      transitionTimingFunction: {
        "ease-out": "cubic-bezier(0.16, 1, 0.3, 1)",
        "ease-in": "cubic-bezier(0.7, 0, 0.84, 0)",
        "ease-in-out": "cubic-bezier(0.65, 0, 0.35, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },

      keyframes: {
        "fade-in-up": {
          from: {
            opacity: "0",
            transform: "translateY(20px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },

      animation: {
        "fade-in-up": "fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards",
      },
    },
  },
  plugins: [],
};

export default config;
