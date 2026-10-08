"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MoreHorizontal } from "@/components/ui/icones";
import { cn } from "@/lib/utils";

/**
 * Ações que existem mas não são do dia a dia.
 *
 * Cada endpoint tinha oito botões sempre visíveis; o que se usa toda hora
 * (copiar, testar) some no meio do que se usa uma vez por ano (rotacionar
 * token). Aqui o raro fica a um clique, não a zero — e a linha volta a ter
 * uma ação óbvia.
 */
export function MenuMais({
  children,
  label = "Mais ações",
  className,
}: {
  children: ReactNode | ((fechar: () => void) => ReactNode);
  label?: string;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  const fechar = () => setAberto(false);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label={label}
        aria-expanded={aberto}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-button text-text-tertiary transition-colors hover:bg-card-hover hover:text-text-primary",
          aberto && "bg-card-hover text-text-primary"
        )}
      >
        <MoreHorizontal size={15} />
      </button>
      {aberto && (
        <div className="absolute right-0 top-full z-30 mt-1 min-w-[180px] overflow-hidden rounded-card bg-card py-1 shadow-popover">
          {typeof children === "function" ? children(fechar) : children}
        </div>
      )}
    </div>
  );
}

/** Item do MenuMais. */
export function ItemMenu({
  onClick,
  icone,
  perigo,
  children,
}: {
  onClick: () => void;
  icone?: ReactNode;
  perigo?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors",
        perigo
          ? "text-danger hover:bg-danger-soft"
          : "text-text-secondary hover:bg-card-hover hover:text-text-primary"
      )}
    >
      {icone}
      {children}
    </button>
  );
}
