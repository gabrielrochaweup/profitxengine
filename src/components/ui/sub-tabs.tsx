"use client";

import { cn } from "@/lib/utils";

// Segunda camada de abas, aninhada dentro de uma aba principal — mesmo
// padrão visual da barra de cima (pill ativo em bg-accent), só que mais
// leve (texto menor, sombra mais fraca) pra ficar claro que é um nível
// abaixo, não outra seção do app.
export function SubTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly { key: T; label: string }[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-1 rounded-panel bg-sidebar p-1 shadow-card-sm">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={cn(
            "rounded-button px-3 py-1.5 text-xs font-medium transition-colors duration-150",
            active === t.key
              ? "bg-card-hover text-accent"
              : "text-text-secondary hover:bg-card-hover hover:text-text-primary"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
