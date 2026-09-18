import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "success" | "warning" | "danger";

// Badge continua arredondado: é rótulo, não controle. O que muda é o peso —
// borda sutil da própria cor em vez de um bloco chapado.
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
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium leading-5",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
