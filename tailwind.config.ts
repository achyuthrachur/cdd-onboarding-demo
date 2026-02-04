import type { Config } from "tailwindcss";

/**
 * Tailwind CSS v4 Configuration
 *
 * Note: Tailwind v4 uses CSS-based configuration via @theme directive in globals.css.
 * This config file provides additional customization that can extend the CSS-based setup.
 *
 * Color System follows the Design System principles:
 * - 60-30-10 rule: 60% neutral, 30% secondary, 10% accent
 * - Warm blacks (#1c1917 or #121212), never pure black
 * - Muted, desaturated accent colors
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
           Warm Grey Color Palette - Design System
           Usage: bg-grey-50, text-grey-900, etc.
           ============================================ */
        grey: {
          50: "#fafaf9",
          100: "#f5f5f4",
          200: "#e7e5e4",
          300: "#d6d3d1",
          400: "#a8a29e",
          500: "#78716c",
          600: "#57534e",
          700: "#44403c",
          800: "#292524",
          900: "#1c1917",
          950: "#0c0a09",
        },

        /* ============================================
           Accent Colors - Design System
           ============================================ */
        accent: {
          DEFAULT: "#64748b",
          light: "#94a3b8",
          dark: "#475569",
        },

        /* Slate Blue Accent */
        "accent-blue": {
          DEFAULT: "#64748b",
          light: "#94a3b8",
          dark: "#475569",
        },

        /* Warm Taupe Accent */
        "accent-warm": {
          DEFAULT: "#a8927c",
          light: "#c4b5a5",
          dark: "#8c7a66",
        },

        /* ============================================
           Functional Colors - Design System
           ============================================ */
        success: {
          DEFAULT: "#6b8f71",
          light: "#a3c4a9",
        },
        warning: {
          DEFAULT: "#c9a962",
          light: "#e5d4a1",
        },
        error: {
          DEFAULT: "#b07070",
          light: "#d4a5a5",
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
          "var(--font-display)",
          "Playfair Display",
          "Fraunces",
          "Libre Baskerville",
          "Georgia",
          "serif",
        ],
        body: [
          "var(--font-body)",
          "DM Sans",
          "Bricolage Grotesque",
          "Source Sans Pro",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
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

      boxShadow: {
        sm: "0 1px 2px rgba(0, 0, 0, 0.04)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.03)",
        hover: "0 12px 24px rgba(0, 0, 0, 0.12)",
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
