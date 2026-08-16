/** @type {import('tailwindcss').Config} */
// DataBridge "Kinetic Precision" Design System
// High contrast, deep charcoal (#08090C / #0F1117), vibrant orange (#FF6B00), Hanken Grotesk typography
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Kinetic Brand Accents
        primary: "#FF6B00",
        "primary-hover": "#FF7F1F",
        "primary-dark": "#E05E00",
        "primary-lt": "rgba(255, 107, 0, 0.12)",
        "primary-xlt": "rgba(255, 107, 0, 0.06)",
        orange: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#FF6B00",
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
        },
        // Deep Charcoal Surface Scale
        charcoal: {
          950: "#08090C",
          900: "#0F1117",
          850: "#13161F",
          800: "#171A24",
          750: "#1E222F",
          700: "#242938",
          600: "#343B4E",
          500: "#4B556D",
        },
        // Semantic Theme Variables
        ink: "var(--color-ink)",
        paper: "var(--color-paper)",
        card: "var(--color-card)",
        "card-hover": "var(--color-card-hover)",
        line: "var(--color-line)",
        muted: "var(--color-muted)",
        danger: "#EF4444",
        "danger-lt": "rgba(239, 68, 68, 0.15)",
        success: "#10B981",
        "success-lt": "rgba(16, 185, 129, 0.15)",
        warning: "#F59E0B",
        "warning-lt": "rgba(245, 158, 11, 0.15)",
      },
      fontFamily: {
        hanken: ["'Hanken Grotesk'", "sans-serif"],
        heading: ["'Hanken Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        "3xl": "24px",
        "4xl": "32px",
        "5xl": "40px",
      },
      boxShadow: {
        card: "0 8px 24px -6px rgba(0, 0, 0, 0.35)",
        "card-dark": "0 10px 30px -10px rgba(0, 0, 0, 0.7)",
        "orange-glow": "0 0 24px -4px rgba(255, 107, 0, 0.4)",
        "orange-sm": "0 2px 12px rgba(255, 107, 0, 0.25)",
        nav: "0 -4px 20px rgba(0, 0, 0, 0.4)",
      },
    },
  },
  plugins: [],
};
