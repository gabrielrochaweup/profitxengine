import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: "sm" | "md";
}

export function LoadingState({ message = "Carregando...", className, size = "md" }: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 text-text-muted",
        size === "sm" ? "py-4 text-xs" : "py-10 text-sm",
        className
      )}
    >
      <Loader2 size={size === "sm" ? 13 : 15} className="animate-spin" />
      {message}
    </div>
  );
}
