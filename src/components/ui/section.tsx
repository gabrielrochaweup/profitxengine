"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DentroDePainel, useNivel } from "./nivel";
import { IconTile } from "./panel";

/**
 * Bloco com assunto próprio dentro de uma página.
 *
 * Solto na página é um PAINEL (nível 1): superfície um degrau acima do
 * fundo, com borda e o título como cabeçalho — é o contraste que separa um
 * assunto do outro, não mais só o espaço. Dentro de outro painel vira
 * subseção: só o subtítulo, sem caixa nova.
 */
export function Section({
  titulo,
  descricao,
  acoes,
  icone,
  className,
  children,
}: {
  titulo?: ReactNode;
  descricao?: ReactNode;
  acoes?: ReactNode;
  icone?: LucideIcon;
  className?: string;
  children: ReactNode;
}) {
  const nivel = useNivel();

  if (nivel === "painel") {
    return (
      <section className={cn("mb-6 last:mb-0", className)}>
        {(titulo || acoes) && (
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              {titulo && (
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">{titulo}</h3>
              )}
              {descricao && <p className="mt-0.5 text-xs text-text-tertiary">{descricao}</p>}
            </div>
            {acoes && <div className="flex shrink-0 items-center gap-2">{acoes}</div>}
          </div>
        )}
        {children}
      </section>
    );
  }

  return (
    <DentroDePainel>
      <section
        className={cn("mb-5 min-w-0 rounded-2xl border border-border bg-card p-4 shadow-card last:mb-0 sm:p-5", className)}
      >
        {(titulo || acoes) && (
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              {icone && <IconTile icon={icone} />}
              <div className="min-w-0">
                {titulo && <h2 className="text-[15px] font-semibold text-text-primary">{titulo}</h2>}
                {descricao && (
                  <p className="mt-1 max-w-[72ch] text-[12px] leading-relaxed text-text-tertiary">{descricao}</p>
                )}
              </div>
            </div>
            {acoes && <div className="flex shrink-0 flex-wrap items-center gap-2">{acoes}</div>}
          </div>
        )}
        {children}
      </section>
    </DentroDePainel>
  );
}

/**
 * Tela/lista sem conteúdo ainda: diz o que está vazio e o que fazer.
 * Dentro de um painel fica no tom do fundo; solta, no tom de cartão.
 */
export function EmptyState({
  titulo,
  descricao,
  acao,
  icone: Icone,
  className,
}: {
  titulo: string;
  descricao?: ReactNode;
  acao?: ReactNode;
  icone?: LucideIcon;
  className?: string;
}) {
  const nivel = useNivel();
  return (
    <div
      className={cn(
        "flex flex-col items-center px-6 py-10 text-center",
        nivel === "painel" ? "rounded-xl border border-border bg-app" : "rounded-card bg-card-hover",
        className
      )}
    >
      {Icone && (
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-input text-text-tertiary">
          <Icone size={18} />
        </span>
      )}
      <p className="text-[14px] font-medium text-text-primary">{titulo}</p>
      {descricao && <p className="mx-auto mt-1.5 max-w-[46ch] text-[12px] text-text-tertiary">{descricao}</p>}
      {acao && <div className="mt-4 flex justify-center">{acao}</div>}
    </div>
  );
}
