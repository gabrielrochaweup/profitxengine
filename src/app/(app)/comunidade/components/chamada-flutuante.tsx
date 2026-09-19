"use client";

import Link from "next/link";
import { Headphones, Mic, MicOff, Monitor, MonitorOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { useChamadaDaComunidade } from "../chamada-contexto";
import { Controle } from "./chamada";

/**
 * A chamada quando a pessoa está em outra parte do ENGINE.
 *
 * Existe por causa do caso que motivou tudo: compartilhar a tela pra mostrar
 * o próprio sistema. Se a chamada continua de pé fora da Comunidade, ela
 * precisa de rosto — senão vira microfone aberto sem ninguém saber, que é
 * pior do que derrubar.
 *
 * Fica acima do menu inferior do celular (que ocupa a base da tela) e no
 * canto no desktop.
 */
export function ChamadaFlutuante() {
  const chamada = useChamadaDaComunidade();

  return (
    // No celular ela sobe acima do menu inferior; no desktop volta pro canto.
    <div className="fixed bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+5rem))] right-3 z-40 flex max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-panel border border-border-strong bg-card px-3 py-2 shadow-popover md:bottom-4">
      <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-button bg-accent-soft text-accent-text">
        <Headphones size={15} />
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-success" />
      </span>

      <span className="min-w-0 max-w-[9rem] sm:max-w-[14rem]">
        <span className="block truncate text-[12px] font-semibold text-text-primary">
          {chamada.sala?.nome ?? "Chamada"}
        </span>
        <span className="block truncate text-[10px] text-text-tertiary">
          {chamada.status === "reconectando"
            ? "Reconectando…"
            : chamada.telaLigada
              ? "Você está compartilhando a tela"
              : `${chamada.participantes.length} ${chamada.participantes.length === 1 ? "participante" : "participantes"}`}
        </span>
      </span>

      <span className="flex items-center gap-0.5 border-l border-border pl-2">
        <Controle
          ativo={chamada.micLigado}
          onClick={chamada.alternarMic}
          titulo={chamada.micLigado ? "Desligar microfone" : "Ligar microfone"}
        >
          {chamada.micLigado ? <Mic size={15} /> : <MicOff size={15} />}
        </Controle>
        <Controle
          ativo={chamada.cameraLigada}
          onClick={chamada.alternarCamera}
          titulo={chamada.cameraLigada ? "Desligar câmera" : "Ligar câmera"}
        >
          {chamada.cameraLigada ? <Video size={15} /> : <VideoOff size={15} />}
        </Controle>
        <Controle
          ativo={chamada.telaLigada}
          onClick={chamada.alternarTela}
          titulo={chamada.telaLigada ? "Parar de compartilhar" : "Compartilhar tela"}
        >
          {chamada.telaLigada ? <MonitorOff size={15} /> : <Monitor size={15} />}
        </Controle>
      </span>

      <Link
        href="/comunidade"
        className="hidden h-7 items-center rounded-button border border-border px-2 text-[11px] text-text-secondary transition-colors hover:bg-card-hover hover:text-text-primary sm:inline-flex"
      >
        Voltar à sala
      </Link>

      <button
        type="button"
        onClick={chamada.sair}
        title="Sair da chamada"
        className="flex h-7 items-center gap-1.5 rounded-button bg-danger-strong px-2.5 text-[11px] font-semibold text-white transition-colors hover:brightness-110"
      >
        <PhoneOff size={13} />
        Sair
      </button>
    </div>
  );
}
