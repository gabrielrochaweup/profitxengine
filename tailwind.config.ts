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
          tertiary: "var(--text-tertiary)",
          muted: "var(--text-muted)",
          disabled: "var(--text-disabled)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          contrast: "var(--accent-contrast)",
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
      // Nada de pílula. O raio grande fazia cada botão parecer um chip
      // solto; em 8px o controle lê como controle e a tela ganha densidade.
      borderRadius: {
        card: "10px",
        panel: "12px",
        button: "8px",
        input: "8px",
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
