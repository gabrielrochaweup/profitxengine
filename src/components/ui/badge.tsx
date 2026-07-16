import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "success" | "warning" | "danger";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border-border-strong text-text-secondary",
  success: "border-success/40 text-success bg-success/10",
  warning: "border-warning/40 text-warning bg-warning/10",
  danger: "border-danger/40 text-danger bg-danger/10",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-button border px-2.5 py-0.5 text-[11px] font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
