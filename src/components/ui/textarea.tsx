import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-input border border-border bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
