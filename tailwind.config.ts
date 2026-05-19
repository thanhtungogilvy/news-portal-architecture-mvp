import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/components/**/*.{vue,js,ts}",
    "./app/layouts/**/*.vue",
    "./app/pages/**/*.vue",
    "./app/plugins/**/*.{js,ts}",
    "./app/app.vue",
    "./app/error.vue",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          DEFAULT: "#0066CC",
          50: "#EAF3FF",
          100: "#D7E9FF",
          200: "#A9D1FF",
          300: "#7AB9FF",
          400: "#4BA1FF",
          500: "#0071E3",
          600: "#0066CC",
          700: "#0055AD",
          800: "#003D80",
          900: "#00244D",
        },
        title: "#1D1D1F",
        body: "#1D1D1F",
        smoke: {
          DEFAULT: "#F5F5F7",
          50: "#FFFFFF",
          100: "#FAFAFC",
          200: "#F5F5F7",
          300: "#F0F0F0",
          400: "#E0E0E0",
        },
        border: {
          DEFAULT: "#E0E0E0",
          light: "#F0F0F0",
          dark: "#CCCCCC",
        },
        success: {
          DEFAULT: "#0066CC",
          light: "#EAF3FF",
          dark: "#0055AD",
        },
        error: {
          DEFAULT: "#C50000",
          light: "#F7D4D6",
          dark: "#8F0000",
        },
        warning: {
          DEFAULT: "#AB570A",
          light: "#FFEFCF",
          dark: "#7D3E07",
        },
        dark: {
          DEFAULT: "#1D1D1F",
          50: "#333333",
          100: "#2A2A2C",
          200: "#272729",
          300: "#252527",
          400: "#1D1D1F",
          500: "#111111",
          600: "#0A0A0A",
          700: "#050505",
          800: "#020202",
          900: "#000000",
        },
        // Verdana design tokens
        sage: {
          600: "#059669",
        },
        navy: {
          900: "#0f172a",
          950: "#020617",
        },
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          900: "#0f172a",
        },
      },
      fontFamily: {
        sans: ["Inter", "SF Pro Text", "system-ui", "-apple-system", "sans-serif"],
        display: ["Be Vietnam Pro", "SF Pro Display", "system-ui", "-apple-system", "sans-serif"],
        inter: ["Inter", "SF Pro Text", "system-ui", "-apple-system", "sans-serif"],
        vietnam: ["Be Vietnam Pro", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      boxShadow: {
        product: "3px 5px 30px rgba(0, 0, 0, 0.22)",
      },
      letterSpacing: {
        apple: "-0.374px",
        "apple-tight": "-0.28px",
      },
    },
  },
  plugins: [],
} satisfies Config;
