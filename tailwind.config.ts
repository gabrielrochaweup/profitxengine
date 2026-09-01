import type { Config } from "tailwindcss";

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
        app: "var(--bg-app)",
        sidebar: "var(--bg-sidebar)",
        card: "var(--bg-card)",
        "card-hover": "var(--bg-card-hover)",
        input: "var(--bg-input)",
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          pink: "var(--accent-pink)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        "success-soft": "var(--success-soft)",
        "warning-soft": "var(--warning-soft)",
        "danger-soft": "var(--danger-soft)",
        "accent-soft": "var(--accent-soft)",
      },
      borderRadius: {
        card: "20px",
        panel: "24px",
        button: "999px",
        input: "12px",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
      },
      boxShadow: {
        popover: "var(--shadow-popover)",
        card: "var(--shadow-card)",
        "card-sm": "var(--shadow-card-sm)",
      },
    },
  },
  plugins: [],
};
export default config;
