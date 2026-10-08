"use client";

import { useState } from "react";
import { Info } from "@/components/ui/icones";
import { cn } from "@/lib/utils";

// Ícone "ⓘ" pequeno que revela uma explicação curta ao passar o mouse/tocar
// — guarda o "como funciona" que antes ficava sempre visível em parágrafo.
export function Tooltip({ text, className }: { text: string; className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className={cn("relative inline-flex", className)}>
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:text-text-primary"
        aria-label="Mais informações"
      >
        <Info size={14} />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-full z-20 mt-1.5 w-64 -translate-x-1/2 rounded-input bg-card px-3 py-2 text-[11px] font-normal leading-relaxed text-text-secondary shadow-popover"
        >
          {text}
        </span>
      )}
    </span>
  );
}
