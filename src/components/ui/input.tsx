import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-9 w-full rounded-input border border-border bg-input px-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none transition-colors duration-150 hover:border-border-strong focus:border-accent",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
