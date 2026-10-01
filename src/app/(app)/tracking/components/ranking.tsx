"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
  Peças de "ranking com barras" — a resposta visual a "quem manda mais?".

  Uma tabela de dez colunas obriga a comparar número com número; a barra
  deixa o olho comparar comprimento, e o número fica ao lado só pra confirmar.
  Usadas em Performance → Páginas e em Visão geral → Origens.
*/

/** Cor de série (fixa, ver --series-N em globals.css) por origem de tráfego. */
export function corDaFonte(fonte: string): string {
  const f = fonte.toLowerCase();
  if (f === "fb" || f === "facebook" || f === "meta") return "var(--series-1)";
  if (f === "ig" || f === "instagram") return "var(--series-3)";
  if (f === "an" || f === "audience_network") return "var(--series-4)";
  if (f === "(direto)" || f === "direto") return "var(--text-muted)";
  if (f.startsWith("google") || f === "gads") return "var(--series-2)";
  return "var(--accent-text)";
}

/** Barra de comprimento proporcional ao maior da lista. */
export function BarraProporcional({
  valor,
  max,
  cor = "var(--series-1)",
  className,
}: {
  valor: number;
  max: number;
  cor?: string;
  className?: string;
}) {
  const pct = max > 0 ? Math.max(valor > 0 ? 2 : 0, (valor / max) * 100) : 0;
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-input", className)} aria-hidden>
      <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${pct}%`, background: cor }} />
    </div>
  );
}

/** Barra dividida em fatias (ex: de onde vem o tráfego de uma página). */
export function BarraEmFatias({
  fatias,
  className,
}: {
  fatias: { rotulo: string; valor: number; cor: string }[];
  className?: string;
}) {
  const total = fatias.reduce((s, f) => s + f.valor, 0);
  if (total <= 0) return <div className={cn("h-2.5 w-full rounded-full bg-input", className)} aria-hidden />;
  return (
    <div className={cn("flex h-2.5 w-full gap-px overflow-hidden rounded-full bg-input", className)} aria-hidden>
      {fatias
        .filter((f) => f.valor > 0)
        .map((f) => (
          <div
            key={f.rotulo}
            title={`${f.rotulo}: ${f.valor} (${Math.round((f.valor / total) * 100)}%)`}
            style={{ width: `${(f.valor / total) * 100}%`, background: f.cor }}
          />
        ))}
    </div>
  );
}

/** Número com rótulo, no tamanho de uma "pílula" de métrica. Zero apagado. */
export function Metrica({
  rotulo,
  valor,
  extra,
  destaque,
  className,
}: {
  rotulo: string;
  valor: ReactNode;
  extra?: ReactNode;
  destaque?: boolean;
  className?: string;
}) {
  const vazio = valor === 0 || valor === "0" || valor === "—";
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted">{rotulo}</p>
      <p
        className={cn(
          "text-[13px] tabular-nums",
          vazio ? "text-text-muted" : destaque ? "font-semibold text-ok" : "font-medium text-text-primary"
        )}
      >
        {valor}
        {extra && <span className="ml-1 text-[11px] font-normal text-text-muted">{extra}</span>}
      </p>
    </div>
  );
}

export function pct(parte: number, todo: number): string {
  if (!todo) return "—";
  const v = (parte / todo) * 100;
  return `${v >= 10 || v === 0 ? Math.round(v) : v.toFixed(1).replace(".", ",")}%`;
}
