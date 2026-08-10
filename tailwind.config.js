/** @type {import('tailwindcss').Config} */
// DataBridge Luminous Modern Design System — Vibrant accents, Manrope typography, crisp rounded cards.
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F172A",
        paper: "#F9FAFB",
        canvas: "#F4FBE4",
        primary: "#D4F06B",
        "primary-dark": "#0F172A",
        "primary-lt": "#E9F8B5",
        "primary-xlt": "#F4FBE4",
        lime: "#D4F06B",
        "lime-hover": "#C5E456",
        "lime-lt": "#F4FBE4",
        accent: "#D4F06B",
        "accent-dk": "#B5D645",
        danger: "#EF4444",
        "danger-lt": "#FEE2E2",
        success: "#10B981",
        "success-lt": "#D1FAE5",
        purple: {
          50: "#F5F3FF",
          100: "#EDE9FE",
          500: "#8B5CF6",
          600: "#7C3AED",
        },
        card: "#FFFFFF",
        line: "#E5E7EB",
        muted: "#6B7280",
      },
      fontFamily: {
        manrope: ["Manrope", "sans-serif"],
        heading: ["Manrope", "'Plus Jakarta Sans'", "sans-serif"],
        body: ["Manrope", "Inter", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        "4xl": "32px",
        "5xl": "40px",
      },
      boxShadow: {
        card: "0 10px 30px -10px rgba(0,0,0,0.04)",
        pop: "0 20px 50px -12px rgba(0,0,0,0.08)",
        nav: "0 -4px 20px rgba(0,0,0,0.05)",
      },
    },
  },
  plugins: [],
};
