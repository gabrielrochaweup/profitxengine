import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-input border border-border bg-input px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted outline-none transition-colors duration-150 hover:border-border-strong focus:border-accent",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
