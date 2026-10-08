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
          // Usado como text-accent-text: a cor da marca quando ela escreve,
          // em vez de preencher. Ver o comentário em globals.css.
          text: "var(--accent-text)",
          pink: "var(--accent-pink)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        "danger-strong": "var(--danger-strong)",
        "success-soft": "var(--success-soft)",
        "warning-soft": "var(--warning-soft)",
        "danger-soft": "var(--danger-soft)",
        "accent-soft": "var(--accent-soft)",
        // Âmbar ESTRUTURAL: faixas de seção, rótulos, navegação ativa. Não é
        // cor de ação (essa continua o azul da marca, em accent).
        frame: {
          DEFAULT: "var(--frame)",
          contrast: "var(--frame-contrast)",
          text: "var(--frame-text)",
          soft: "var(--frame-soft)",
          line: "var(--frame-line)",
        },
        ok: "var(--ok)",
        "ok-soft": "var(--ok-soft)",
        series: {
          1: "var(--series-1)",
          2: "var(--series-2)",
          3: "var(--series-3)",
          4: "var(--series-4)",
        },
      },
      // Linhas retas. A escala inteira do Tailwind foi trazida pra perto de
      // zero, então os "rounded-xl" espalhados pelas telas viram quinas vivas
      // sem precisar caçar arquivo por arquivo. "full" continua círculo
      // (avatar, interruptor, ponto de status).
      borderRadius: {
        none: "0px",
        sm: "1px",
        DEFAULT: "2px",
        md: "2px",
        lg: "2px",
        xl: "3px",
        "2xl": "3px",
        "3xl": "4px",
        card: "3px",
        panel: "3px",
        button: "2px",
        input: "2px",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
        display: ["var(--font-display)", "var(--font-geist-sans)", "sans-serif"],
      },
      boxShadow: {
        popover: "var(--shadow-popover)",
        card: "var(--shadow-card)",
        "card-sm": "var(--shadow-card-sm)",
        // Painel de nível 1: aresta de 1px + o fio âmbar no topo.
        panel: "var(--shadow-panel)",
      },
    },
  },
  plugins: [],
};
export default config;
