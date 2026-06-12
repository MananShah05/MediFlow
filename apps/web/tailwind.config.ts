import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* New Palette Mappings */
        brand: {
          50: "var(--color-primary-50)",
          5050: "var(--color-primary-50)", // Safeguard
          500: "var(--color-primary-500)",
          600: "var(--color-primary-600)",
        },
        surface: {
          base: "var(--color-bg-base)",
          DEFAULT: "var(--color-bg-surface)",
          elevated: "var(--color-bg-elevated)",
          subtle: "var(--color-bg-subtle)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)",
          subtle: "var(--color-border-subtle)", // backward compatibility
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          tertiary: "var(--color-text-tertiary)",
          inverse: "var(--color-text-inverse)",
        },
        danger: {
          bg: "var(--color-danger-bg)",
          border: "var(--color-danger-border)",
          text: "var(--color-danger-text)",
          strong: "var(--color-danger-strong)",
        },
        warning: {
          bg: "var(--color-warning-bg)",
          border: "var(--color-warning-border)",
          text: "var(--color-warning-text)",
          strong: "var(--color-warning-strong)",
        },
        success: {
          bg: "var(--color-success-bg)",
          border: "var(--color-success-border)",
          text: "var(--color-success-text)",
          strong: "var(--color-success-strong)",
        },
        info: {
          bg: "var(--color-info-bg)",
          border: "var(--color-info-border)",
          text: "var(--color-info-text)",
          strong: "var(--color-info-strong)",
        },

        /* Backward Compatibility Mappings */
        bg: {
          base: "var(--color-bg-base)",
          elevated: "var(--color-bg-elevated)",
          overlay: "var(--color-bg-overlay)",
          subtle: "var(--color-bg-subtle)",
          muted: "var(--color-bg-muted)",
        },
        clinical: {
          DEFAULT: "var(--color-clinical)",
          muted: "var(--color-clinical-muted)",
          hover: "var(--color-clinical-hover)",
        },
        critical: {
          DEFAULT: "var(--color-critical)",
          muted: "var(--color-critical-muted)",
          text: "var(--color-critical-text)",
        },
        neutral: {
          50: "var(--color-neutral-50)",
          100: "var(--color-neutral-100)",
          200: "var(--color-neutral-200)",
          400: "var(--color-neutral-400)",
          600: "var(--color-neutral-600)",
          800: "var(--color-neutral-800)",
          900: "var(--color-neutral-900)",
        },
        role: {
          patient: "var(--color-role-patient)",
          doctor: "var(--color-role-doctor)",
          nurse: "var(--color-role-nurse)",
          admin: "var(--color-role-admin)",
          superadmin: "var(--color-role-superadmin)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        ui: ["var(--font-ui)", "system-ui", "sans-serif"],
        data: ["var(--font-data)", "monospace"],
      },
      fontSize: {
        xs: ["11px", { lineHeight: "1.5" }],
        sm: ["13px", { lineHeight: "1.5" }],
        base: ["15px", { lineHeight: "1.5" }],
        lg: ["17px", { lineHeight: "1.25" }],
        xl: ["20px", { lineHeight: "1.25" }],
        "2xl": ["24px", { lineHeight: "1.25" }],
        "3xl": ["30px", { lineHeight: "1.25" }],
        "4xl": ["36px", { lineHeight: "1.25" }],
      },
      lineHeight: {
        tight: "1.25",
        normal: "1.5",
        loose: "1.75",
      },
      fontWeight: {
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
      spacing: {
        "0": "0px",
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "6": "24px",
        "8": "32px",
        "10": "40px",
        "12": "48px",
        "16": "64px",
        "20": "80px",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        full: "9999px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.3)",
        md: "0 4px 12px rgba(0,0,0,0.4)",
        lg: "0 8px 24px rgba(0,0,0,0.5)",
        clinical: "0 0 0 2px var(--color-critical)",
      },
      transitionTimingFunction: {
        "ease-out-custom": "cubic-bezier(0.23, 1, 0.32, 1)",
        "ease-in-out-custom": "cubic-bezier(0.77, 0, 0.175, 1)",
        "ease-drawer": "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      transitionDuration: {
        instant: "0ms",
        fast: "100ms",
        ui: "175ms",
        modal: "220ms",
      },
      keyframes: {
        modalIn: {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        sheetIn: {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        toastIn: {
          from: { opacity: "0", transform: "translateY(8px) scale(0.97)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
        criticalPulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        "modal-in": "modalIn 220ms cubic-bezier(0.23, 1, 0.32, 1) forwards",
        "sheet-in": "sheetIn 220ms cubic-bezier(0.32, 0.72, 0, 1) forwards",
        "fade-up": "fadeUp 200ms cubic-bezier(0.23, 1, 0.32, 1) forwards",
        "toast-in": "toastIn 200ms cubic-bezier(0.23, 1, 0.32, 1) forwards",
        shimmer: "shimmer 1.5s infinite",
        "critical-pulse": "criticalPulse 3s ease-in-out 1",
      },
      maxWidth: {
        content: "1280px",
      },
      width: {
        sidebar: "240px",
        "sidebar-collapsed": "64px",
      },
    },
  },
  plugins: [],
};

export default config;
