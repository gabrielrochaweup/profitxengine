"use client";

import { Hash, Headphones, Lock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Sala } from "../lib";

export function SalasSidebar({
  salas,
  salaAtiva,
  naoLidas,
  naChamadaPorSala,
  podeCriar,
  onSelecionar,
  onCriar,
}: {
  salas: Sala[];
  salaAtiva: string | null;
  naoLidas: Map<string, number>;
  naChamadaPorSala: Map<string, number>;
  podeCriar: boolean;
  onSelecionar: (id: string) => void;
  onCriar: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">Salas</p>
        {podeCriar && (
          <button
            type="button"
            onClick={onCriar}
            title="Criar sala"
            className="flex h-6 w-6 items-center justify-center rounded-button text-text-tertiary transition-colors hover:bg-card-hover hover:text-text-primary"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2">
        {salas.length === 0 ? (
          <p className="px-2 py-3 text-[11px] text-text-tertiary">Ainda não existem salas.</p>
        ) : (
          salas.map((sala) => {
            const ativa = sala.id === salaAtiva;
            const pendentes = naoLidas.get(sala.id) ?? 0;
            const emChamada = naChamadaPorSala.get(sala.id) ?? 0;
            return (
              <button
                key={sala.id}
                type="button"
                onClick={() => onSelecionar(sala.id)}
                className={cn(
                  "mb-0.5 flex w-full items-center gap-2 rounded-button px-2 py-1.5 text-left transition-colors",
                  ativa ? "bg-card-hover" : "hover:bg-card-hover"
                )}
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center text-text-tertiary">
                  {sala.icone ? (
                    <span className="text-[12px]">{sala.icone}</span>
                  ) : sala.privada ? (
                    <Lock size={12} />
                  ) : (
                    <Hash size={13} />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate text-[13px]",
                      ativa
                        ? "font-medium text-accent-text"
                        : pendentes > 0
                          ? "font-medium text-text-primary"
                          : "text-text-secondary"
                    )}
                  >
                    {sala.nome}
                  </span>
                  {/* Chamada acontecendo aparece como linha de apoio, não
                      como badge colorido: é informação, não alarme. */}
                  {emChamada > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-text-tertiary">
                      <Headphones size={10} className="text-accent-text" />
                      {emChamada} em chamada
                    </span>
                  )}
                </span>

                {pendentes > 0 && !ativa && (
                  <span className="shrink-0 rounded-full bg-accent px-1.5 text-[10px] font-semibold tabular-nums leading-[18px] text-accent-contrast">
                    {pendentes > 99 ? "99+" : pendentes}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
