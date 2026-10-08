"use client";

import { cn } from "@/lib/utils";

/**
 * Nível 2 de navegação (sub-abas, filtros de visão): pílulas num trilho.
 * Mesmo desenho do SegmentedControl (components/ui/panel.tsx) — o nível 1 é
 * sempre outra coisa (coluna lateral), nunca a mesma barra.
 */
export function SubTabs<T extends string>({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: readonly { key: T; label: string }[];
  active: T;
  onChange: (key: T) => void;
  /** Pra quem usa dentro de uma barra de acoes e nao quer a margem de baixo. */
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      className={cn("mb-4 inline-flex max-w-full gap-0.5 overflow-x-auto rounded-xl bg-input p-1", className)}
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="radio"
          aria-checked={active === t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "shrink-0 rounded-lg px-3 py-1.5 font-display text-xs font-semibold tracking-[0.04em] transition-colors duration-150",
            active === t.key
              ? "bg-card text-text-primary shadow-[inset_0_-2px_0_var(--frame)]"
              : "text-text-tertiary hover:text-text-secondary"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
