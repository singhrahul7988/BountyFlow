import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        "surface-low": "var(--surface-container-low)",
        "surface-high": "var(--surface-container-high)",
        "surface-highest": "var(--surface-container-highest)",
        primary: "var(--primary)",
        "primary-container": "var(--primary-container)",
        "primary-fixed": "var(--primary-fixed)",
        "on-primary": "var(--on-primary)",
        indigo: "var(--indigo)",
        amber: "var(--amber)",
        danger: "var(--danger)",
        error: "var(--error)",
        foreground: "var(--on-surface)",
        muted: "var(--on-surface-variant)",
        outline: "var(--outline)",
        "outline-variant": "var(--outline-variant)"
      },
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
        data: ["var(--font-space-mono)", "monospace"]
      },
      letterSpacing: {
        tighterDisplay: "-0.04em",
        tightHeading: "-0.03em",
        label: "0.08em",
        terminal: "0.05em"
      },
      spacing: {
        18: "4.5rem",
        22: "5rem",
        24: "5.5rem"
      },
      maxWidth: {
        shell: "1440px"
      },
      boxShadow: {
        ambient: "0 0 12px rgba(110, 255, 192, 0.1)",
        cta: "0 0 16px rgba(71, 255, 184, 0.35)"
      },
      backgroundImage: {
        "primary-gradient": "linear-gradient(135deg, var(--primary), var(--primary-container))"
      },
      keyframes: {
        pulseDot: {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "1" }
        },
        borderPulse: {
          "0%, 100%": { boxShadow: "0 0 12px rgba(110, 255, 192, 0.1)" },
          "50%": { boxShadow: "0 0 18px rgba(110, 255, 192, 0.25)" }
        }
      },
      animation: {
        "pulse-dot": "pulseDot 1.6s linear infinite",
        "border-pulse": "borderPulse 1.8s ease infinite"
      }
    }
  },
  plugins: []
};

export default config;
