import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className={cn("relative", className)}>
        <select
          ref={ref}
          className={cn(
            "h-9 w-full appearance-none rounded-input border border-border bg-input px-3 pr-8 text-[13px] text-text-primary outline-none transition-colors duration-150 hover:border-border-strong focus:border-accent",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
      </div>
    );
  }
);
Select.displayName = "Select";
