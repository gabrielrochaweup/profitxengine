"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { HelpCircle, X } from "@/components/ui/icones";
import { tutorialDaTela } from "@/lib/tutoriais";
import { cn } from "@/lib/utils";

/*
  A ajuda da tela em que a pessoa está.

  Um botão no canto inferior direito, presente em todo o app. O conteúdo não
  é genérico: ele acompanha a aba. Em Tracking → Pessoas o painel fala da
  lista de cobrança; em Tracking → Eventos, do log cru. É a diferença entre
  ajuda que responde e ajuda que manda ler o manual.

  Mora no layout, e não em cada página, por dois motivos: página nova ganha
  o botão sem ninguém lembrar de plugar, e o texto fica num arquivo só
  (src/lib/tutoriais.ts) em vez de espalhado em vinte telas.
*/
export function AjudaFlutuante() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [aberto, setAberto] = useState(false);

  // A aba vem da URL (?aba=&sub=), que é como o Tracking guarda onde a
  // pessoa está. Página que mantém a aba só na memória cai no verbete dela
  // mesma — o texto então cobre as abas em vez de fingir que sabe qual está
  // aberta.
  const tutorial = tutorialDaTela(pathname, searchParams.get("aba"), searchParams.get("sub"));

  // Fecha no Escape. Painel que só fecha no X é painel que fica aberto.
  useEffect(() => {
    if (!aberto) return;
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  // Trocar de tela fecha o painel: o conteúdo dele não vale mais.
  useEffect(() => {
    setAberto(false);
  }, [pathname, searchParams]);

  if (!tutorial) return null;

  return (
    <>
      {aberto && (
        <>
          {/* Véu discreto: escurece o fundo o suficiente pra separar o painel,
              e fecha no clique. */}
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setAberto(false)} />

          <div
            role="dialog"
            aria-label={`Ajuda — ${tutorial.titulo}`}
            className={cn(
              "fixed z-50 flex max-h-[70vh] w-[min(26rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-panel border border-border-strong bg-card shadow-popover",
              "right-3 bottom-[max(9rem,calc(env(safe-area-inset-bottom)+8.5rem))] md:right-4 md:bottom-[4.5rem]"
            )}
          >
            <div className="flex items-start justify-between gap-2 border-b border-border bg-card-hover/40 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-accent-text">Como funciona</p>
                <h2 className="mt-0.5 text-[15px] font-semibold text-text-primary">{tutorial.titulo}</h2>
              </div>
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar ajuda"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-button text-text-tertiary hover:bg-card-hover hover:text-text-primary"
              >
                <X size={15} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              <p className="text-[13px] leading-relaxed text-text-secondary">{tutorial.resumo}</p>

              {tutorial.passos && tutorial.passos.length > 0 && (
                <ol className="mt-3 space-y-2">
                  {tutorial.passos.map((passo, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[10px] font-semibold tabular-nums text-accent-text">
                        {i + 1}
                      </span>
                      <span className="text-[12px] leading-relaxed text-text-secondary">{passo}</span>
                    </li>
                  ))}
                </ol>
              )}

              {tutorial.atencao && (
                <div className="mt-3 rounded-card border border-warning/25 bg-warning-soft/30 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-warning">Vale saber</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-text-secondary">{tutorial.atencao}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* O botão. No celular ele sobe pra não brigar com o menu inferior. */}
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label={aberto ? "Fechar ajuda" : `Ajuda sobre ${tutorial.titulo}`}
        title={`Ajuda — ${tutorial.titulo}`}
        className={cn(
          "fixed z-50 flex h-10 w-10 items-center justify-center rounded-full shadow-popover transition-colors duration-150",
          "right-3 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+5rem))] md:right-4 md:bottom-4",
          aberto
            ? "bg-accent text-accent-contrast"
            : "bg-card text-text-secondary ring-1 ring-border-strong hover:bg-card-hover hover:text-accent-text"
        )}
      >
        <HelpCircle size={20} />
      </button>
    </>
  );
}
