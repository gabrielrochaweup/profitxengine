"use client";

import { useEffect, useRef, useState } from "react";
import {
  Headphones,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  Monitor,
  MonitorOff,
  PhoneOff,
  Settings2,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";
import { useChamadaDaComunidade } from "../chamada-contexto";
import { ligarTrack, type ParticipanteChamada } from "../lib-chamada";
import type { Pessoa } from "../lib";
import type { Track } from "livekit-client";

/**
 * A chamada dentro da sala, em três peças.
 *
 * - BarraChamada: a faixa fina do topo — quem está lá e os controles de mídia.
 * - AreaDeMidia: só existe quando alguém liga câmera ou tela.
 * - BotaoChamada: entrar/sair, embaixo, colado no campo de mensagem.
 *
 * Entrar e sair moram no rodapé de propósito: é onde a mão já está (o campo
 * de digitar) e é a ação mais consequente da tela. No topo, num botão
 * secundário de 7px de altura, ela passava despercebida.
 */

/* ───────────────────────────── faixa do topo ───────────────────────────── */

export function BarraChamada({ salaId, pessoas }: { salaId: string; pessoas: Map<string, Pessoa> }) {
  const chamada = useChamadaDaComunidade();
  const [configAberta, setConfigAberta] = useState(false);

  const aquiDentro = chamada.naChamada && chamada.sala?.id === salaId;

  // Quem está na chamada desta sala mas não sou eu vem da presença enquanto eu
  // estiver fora — é o que me deixa ver que tem gente conversando antes de
  // entrar.
  const naChamadaPelaPresenca = chamada.presencas.filter((p) => p.sala_chamada === salaId);

  return (
    <div className="shrink-0 border-b border-border">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-card-hover/40 px-4 py-2">
        <Headphones
          size={14}
          className={cn("shrink-0", aquiDentro ? "text-accent-text" : "text-text-tertiary")}
        />

        {aquiDentro ? (
          <>
            <span className="text-[12px] text-text-secondary">
              {chamada.status === "reconectando" ? (
                <span className="text-warning">Reconectando…</span>
              ) : (
                <>
                  <span className="font-semibold text-text-primary">{chamada.participantes.length}</span>{" "}
                  {chamada.participantes.length === 1 ? "participante" : "participantes"}
                </>
              )}
            </span>

            <div className="flex -space-x-1.5">
              {chamada.participantes.slice(0, 8).map((p) => (
                <span
                  key={p.id}
                  title={`${p.nome}${p.micLigado ? "" : " (mudo)"}`}
                  className={cn(
                    "relative rounded-button ring-2 ring-card transition-shadow",
                    p.falando && "ring-accent"
                  )}
                >
                  <Avatar nome={p.nome} id={p.id} tamanho={22} />
                  {!p.micLigado && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-card">
                      <MicOff size={8} className="text-text-muted" />
                    </span>
                  )}
                </span>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-1">
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
              <Controle ativo={configAberta} onClick={() => setConfigAberta((v) => !v)} titulo="Dispositivos">
                <Settings2 size={15} />
              </Controle>
            </div>
          </>
        ) : naChamadaPelaPresenca.length === 0 ? (
          <span className="text-[12px] text-text-tertiary">Ninguém está na chamada desta sala.</span>
        ) : (
          <>
            <span className="text-[12px] text-text-secondary">
              <span className="font-semibold text-text-primary">{naChamadaPelaPresenca.length}</span>{" "}
              {naChamadaPelaPresenca.length === 1 ? "pessoa na chamada" : "pessoas na chamada"}
            </span>
            <div className="flex -space-x-1.5">
              {naChamadaPelaPresenca.slice(0, 8).map((p) => (
                <span
                  key={p.user_id}
                  className="rounded-button ring-2 ring-card"
                  title={pessoas.get(p.user_id)?.nome}
                >
                  <Avatar nome={pessoas.get(p.user_id)?.nome ?? "?"} id={p.user_id} tamanho={22} />
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {chamada.erro && (
        <div className="flex items-start gap-2 border-t border-border bg-danger-soft px-4 py-2 text-[11px] text-danger">
          <span className="flex-1">{chamada.erro}</span>
          <button type="button" onClick={chamada.limparErro} aria-label="Fechar aviso" className="shrink-0">
            <X size={13} />
          </button>
        </div>
      )}

      {configAberta && aquiDentro && (
        <div className="grid grid-cols-1 gap-3 border-t border-border bg-card px-4 py-3 sm:grid-cols-3">
          <SeletorDispositivo
            titulo="Microfone"
            itens={chamada.dispositivos.microfones}
            onEscolher={(id) => chamada.trocarDispositivo("audioinput", id)}
          />
          <SeletorDispositivo
            titulo="Câmera"
            itens={chamada.dispositivos.cameras}
            onEscolher={(id) => chamada.trocarDispositivo("videoinput", id)}
          />
          <SeletorDispositivo
            titulo="Saída de áudio"
            itens={chamada.dispositivos.saidas}
            onEscolher={(id) => chamada.trocarDispositivo("audiooutput", id)}
          />
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────── botão de entrar/sair ──────────────────────────── */

/**
 * O botão de entrar/sair, no rodapé da sala.
 *
 * Alinhado à esquerda, acima do campo de mensagem: azul pra entrar, vermelho
 * pra sair, no MESMO lugar — a pessoa aprende um alvo só.
 */
export function BotaoChamada({
  salaId,
  nomeDaSala,
  onIrParaSala,
}: {
  salaId: string;
  nomeDaSala: string;
  onIrParaSala: (id: string) => void;
}) {
  const chamada = useChamadaDaComunidade();
  const aquiDentro = chamada.naChamada && chamada.sala?.id === salaId;
  const emOutraSala = chamada.naChamada && chamada.sala && chamada.sala.id !== salaId;

  if (aquiDentro) {
    return (
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={chamada.sair}
          className="inline-flex h-9 items-center gap-2 rounded-button bg-danger-strong px-4 text-[13px] font-semibold text-white transition-colors hover:brightness-110"
        >
          <PhoneOff size={15} />
          Sair da chamada
        </button>
        <span className="text-[11px] text-text-tertiary">
          {chamada.status === "reconectando"
            ? "Reconectando…"
            : "Você continua na sala e no chat depois de sair da chamada."}
        </span>
      </div>
    );
  }

  if (emOutraSala && chamada.sala) {
    const outra = chamada.sala;
    return (
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onIrParaSala(outra.id)}
          className="inline-flex h-9 items-center gap-2 rounded-button bg-accent-soft px-4 text-[13px] font-semibold text-accent-text transition-colors hover:brightness-110"
        >
          <Headphones size={15} />
          Você está na chamada de {outra.nome}
        </button>
        <span className="text-[11px] text-text-tertiary">Saia dela antes de entrar na chamada desta sala.</span>
      </div>
    );
  }

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => chamada.entrar({ id: salaId, nome: nomeDaSala })}
        disabled={!chamada.disponivel || chamada.status === "entrando"}
        className="inline-flex h-9 items-center gap-2 rounded-button bg-accent px-4 text-[13px] font-semibold text-accent-contrast transition-colors hover:bg-accent-hover disabled:pointer-events-none disabled:opacity-40"
      >
        <Headphones size={15} />
        {chamada.status === "entrando" ? "Entrando…" : "Entrar na chamada"}
      </button>
      {!chamada.disponivel && (
        <span className="text-[11px] text-text-muted">Chamadas ainda não configuradas neste ambiente.</span>
      )}
    </div>
  );
}

/* ──────────────────────────── vídeo e tela ──────────────────────────── */

/**
 * A área de mídia.
 *
 * Só existe quando alguém liga câmera ou tela. Quando existe uma tela
 * compartilhada, ela vira o conteúdo principal da página (`flex-1`) e o chat
 * encolhe pra uma faixa embaixo — ler o que está sendo mostrado é o motivo de
 * a pessoa estar ali, e a tira de 46vh do layout anterior deixava texto de
 * código ilegível.
 */
export function AreaDeMidia({ salaId }: { salaId: string }) {
  const chamada = useChamadaDaComunidade();
  const aquiDentro = chamada.naChamada && chamada.sala?.id === salaId;
  const comCamera = chamada.participantes.filter((p) => p.video);
  const tela = chamada.telaDeAlguem;

  if (!aquiDentro || (!tela && comCamera.length === 0)) return null;

  if (tela) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2 border-b border-border bg-card px-3 py-2">
        <Palco track={tela.tela} rotulo={`${tela.nome} está compartilhando a tela`} camerasEmCima={comCamera} />
      </div>
    );
  }

  return (
    <div className="shrink-0 border-b border-border bg-card px-3 py-3">
      <div
        className={cn(
          "grid gap-2",
          comCamera.length === 1
            ? "grid-cols-1 sm:max-w-md"
            : comCamera.length === 2
              ? "grid-cols-2"
              : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        )}
      >
        {comCamera.map((p) => (
          <Quadro key={p.id} participante={p} />
        ))}
      </div>
    </div>
  );
}

/** Existe alguém compartilhando tela nesta sala? Decide o formato da página. */
export function useApresentacao(salaId: string): boolean {
  const chamada = useChamadaDaComunidade();
  return chamada.naChamada && chamada.sala?.id === salaId && !!chamada.telaDeAlguem;
}

function Palco({
  track,
  rotulo,
  camerasEmCima,
}: {
  track: Track | null;
  rotulo: string;
  camerasEmCima: ParticipanteChamada[];
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const caixaRef = useRef<HTMLDivElement>(null);
  const [emTelaCheia, setEmTelaCheia] = useState(false);

  useEffect(() => ligarTrack(track, ref.current), [track]);

  useEffect(() => {
    function mudou() {
      setEmTelaCheia(document.fullscreenElement === caixaRef.current);
    }
    document.addEventListener("fullscreenchange", mudou);
    return () => document.removeEventListener("fullscreenchange", mudou);
  }, []);

  function alternarTelaCheia() {
    const caixa = caixaRef.current;
    if (!caixa) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else caixa.requestFullscreen?.();
  }

  return (
    <div ref={caixaRef} className="relative min-h-0 flex-1 overflow-hidden rounded-card bg-black">
      <video ref={ref} autoPlay playsInline className="h-full w-full object-contain" />

      {/* As câmeras acompanham a apresentação num canto: elas são contexto,
          não conteúdo. Roubar altura do que está sendo mostrado é o erro. */}
      {camerasEmCima.length > 0 && (
        <div className="absolute right-2 top-2 flex max-w-[40%] gap-1.5 overflow-x-auto">
          {camerasEmCima.map((p) => (
            <div key={p.id} className="w-24 shrink-0 sm:w-28">
              <Quadro participante={p} compacto />
            </div>
          ))}
        </div>
      )}

      <span className="absolute bottom-2 left-2 rounded-button bg-black/70 px-2 py-0.5 text-[10px] text-white">
        {rotulo}
      </span>

      <button
        type="button"
        onClick={alternarTelaCheia}
        title={emTelaCheia ? "Sair da tela cheia" : "Tela cheia"}
        aria-label={emTelaCheia ? "Sair da tela cheia" : "Tela cheia"}
        className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-button bg-black/70 text-white transition-colors hover:bg-black/90"
      >
        {emTelaCheia ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
      </button>
    </div>
  );
}

function Quadro({ participante, compacto }: { participante: ParticipanteChamada; compacto?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => ligarTrack(participante.video, ref.current), [participante.video]);
  return (
    <div
      className={cn(
        "relative aspect-video overflow-hidden rounded-card bg-black",
        participante.falando && "shadow-[0_0_0_2px_var(--accent)]"
      )}
    >
      <video ref={ref} autoPlay playsInline muted={participante.eu} className="h-full w-full object-cover" />
      <span
        className={cn(
          "absolute bottom-1 left-1 flex items-center gap-1 rounded-button bg-black/70 px-1.5 py-0.5 text-white",
          compacto ? "text-[9px]" : "text-[10px]"
        )}
      >
        {!participante.micLigado && <MicOff size={9} />}
        {participante.nome}
        {participante.eu && " (você)"}
      </span>
    </div>
  );
}

/* ──────────────────────────── peças compartilhadas ──────────────────────────── */

export function Controle({
  ativo,
  onClick,
  titulo,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={titulo}
      aria-label={titulo}
      aria-pressed={ativo}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-button transition-colors",
        ativo ? "bg-accent-soft text-accent-text" : "text-text-tertiary hover:bg-card-hover hover:text-text-primary"
      )}
    >
      {children}
    </button>
  );
}

function SeletorDispositivo({
  titulo,
  itens,
  onEscolher,
}: {
  titulo: string;
  itens: { id: string; rotulo: string }[];
  onEscolher: (id: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
        {titulo}
      </label>
      {itens.length === 0 ? (
        <p className="text-[11px] text-text-muted">Nenhum encontrado.</p>
      ) : (
        <select
          onChange={(e) => onEscolher(e.target.value)}
          className="h-8 w-full rounded-input border border-border bg-input px-2 text-[11px] text-text-primary outline-none focus:border-accent"
        >
          {itens.map((d) => (
            <option key={d.id} value={d.id}>
              {d.rotulo}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
