"use client";

import { createContext, useContext } from "react";
import type { Presenca } from "./lib";
import type { Dispositivos, ParticipanteChamada, SalaDaChamada, StatusChamada } from "./lib-chamada";

/**
 * O contrato da chamada, separado de quem o implementa.
 *
 * Este arquivo só declara o contexto. O provedor (chamada-provider.tsx) monta
 * os componentes da chamada, e esses componentes leem daqui — se o contexto
 * morasse junto do provedor, cada um deles importaria o provedor que importa
 * eles de volta, e a gente teria um ciclo de módulos.
 */
export interface ChamadaContexto {
  disponivel: boolean;
  status: StatusChamada;
  sala: SalaDaChamada | null;
  naChamada: boolean;
  erro: string | null;
  limparErro: () => void;
  participantes: ParticipanteChamada[];
  telaDeAlguem: ParticipanteChamada | null;
  micLigado: boolean;
  cameraLigada: boolean;
  telaLigada: boolean;
  dispositivos: Dispositivos;
  entrar: (sala: SalaDaChamada) => void;
  sair: () => Promise<void>;
  alternarMic: () => void;
  alternarCamera: () => void;
  alternarTela: () => void;
  trocarDispositivo: (tipo: MediaDeviceKind, id: string) => void;
  presencas: Presenca[];
  presencaConectada: boolean;
  /** A Comunidade avisa qual sala está aberta na tela (null ao sair dela). */
  verSala: (salaId: string | null) => void;
}

export const ContextoDaChamada = createContext<ChamadaContexto | null>(null);

export function useChamadaDaComunidade(): ChamadaContexto {
  const ctx = useContext(ContextoDaChamada);
  if (!ctx) throw new Error("useChamadaDaComunidade precisa estar dentro de <ChamadaProvider>");
  return ctx;
}
