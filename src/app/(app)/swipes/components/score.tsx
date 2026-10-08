"use client";

import { cn } from "@/lib/utils";

/** Verde a partir de 8, âmbar no meio, vermelho abaixo de 5. */
function corDoScore(valor: number): string {
  if (valor >= 8) return "bg-success";
  if (valor >= 5) return "bg-frame";
  return "bg-danger";
}

/**
 * Score de 0 a 10 em dez segmentos, como um medidor de painel. Com onChange
 * cada segmento é clicável (clicar no valor atual zera); sem, é só leitura.
 */
export function ScoreBarra({
  valor,
  onChange,
  grande = false,
  className,
}: {
  valor: number | null;
  onChange?: (valor: number | null) => void;
  grande?: boolean;
  className?: string;
}) {
  const cor = valor !== null ? corDoScore(valor) : "";
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        role={onChange ? "radiogroup" : "img"}
        aria-label={onChange ? "Score de 0 a 10" : `Score ${valor ?? "sem nota"} de 10`}
        className="flex gap-[3px]"
      >
        {Array.from({ length: 10 }, (_, i) => {
          const n = i + 1;
          const cheio = valor !== null && n <= valor;
          const classe = cn(
            "shrink-0 transition-colors",
            grande ? "h-6 w-4" : "h-2.5 w-[7px]",
            cheio ? cor : "bg-input",
            onChange && "cursor-pointer hover:outline hover:outline-1 hover:outline-frame-line"
          );
          return onChange ? (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={valor === n}
              aria-label={`Nota ${n}`}
              onClick={() => onChange(valor === n ? null : n)}
              className={classe}
            />
          ) : (
            <span key={n} className={classe} />
          );
        })}
      </div>
      <span
        className={cn(
          "font-display font-semibold tabular-nums text-text-primary",
          grande ? "text-[28px] leading-none" : "text-[13px]"
        )}
      >
        {valor ?? "–"}
        <span className={cn("text-text-muted", grande ? "text-[14px]" : "text-[10px]")}>/10</span>
      </span>
    </div>
  );
}
