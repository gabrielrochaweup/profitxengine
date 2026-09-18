import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  // O verde é claro: texto escuro em cima, não branco.
  primary: "bg-accent text-accent-contrast hover:bg-accent-hover",
  secondary: "text-text-primary bg-card-hover border border-border hover:border-border-strong hover:bg-input",
  ghost: "text-text-secondary hover:text-text-primary hover:bg-card-hover",
  danger: "text-danger bg-danger-soft border border-danger/25 hover:border-danger/50",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-7 px-2.5 text-xs",
  md: "h-9 px-3.5 text-[13px]",
  lg: "h-10 px-5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-button font-medium transition-colors duration-150 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
