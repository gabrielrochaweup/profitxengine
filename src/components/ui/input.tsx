import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-input bg-input px-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-shadow focus:shadow-[0_0_0_2px_var(--accent)]",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
