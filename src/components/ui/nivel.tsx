"use client";

import { createContext, useContext, type ReactNode } from "react";

/*
  Em que nível de superfície um componente está:

    pagina → solto no fundo do app
    painel → dentro de um painel (Section, Bloco do Tracking, Panel)

  Card, EmptyState e companhia leem isso pra se desenhar sozinhos no tom
  certo: dentro de um painel voltam à cor do fundo (nível 2); soltos na
  página mantêm a superfície de cartão de sempre. É o que deixa telas que
  ainda não foram reorganizadas (ex: Dinâmicas) exatamente como estavam.
*/
export type Nivel = "pagina" | "painel";

const NivelCtx = createContext<Nivel>("pagina");

export function useNivel(): Nivel {
  return useContext(NivelCtx);
}

/** Marca tudo que está dentro como "dentro de um painel". */
export function DentroDePainel({ children }: { children: ReactNode }) {
  return <NivelCtx.Provider value="painel">{children}</NivelCtx.Provider>;
}
