import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "success" | "warning" | "danger";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "text-text-secondary bg-card-hover",
  success: "text-success bg-success-soft",
  warning: "text-warning bg-warning-soft",
  danger: "text-danger bg-danger-soft",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-button px-2.5 py-0.5 text-[11px] font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
