import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "success" | "warning" | "danger";

// Etiqueta reta, em fonte técnica e caixa-alta, como os rótulos da
// referência. Borda sutil da própria cor em vez de um bloco chapado.
const toneClasses: Record<BadgeTone, string> = {
  neutral: "text-text-secondary bg-card-hover border border-border",
  success: "text-success bg-success-soft border border-success/20",
  warning: "text-warning bg-warning-soft border border-warning/20",
  danger: "text-danger bg-danger-soft border border-danger/25",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-1.5 py-0.5 font-display text-[10px] font-semibold uppercase leading-4 tracking-[0.1em]",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
