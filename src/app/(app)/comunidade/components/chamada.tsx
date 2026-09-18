"use client";

import { useEffect, useRef, useState } from "react";
import {
  Headphones,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Settings2,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";
import { ligarTrack, type Dispositivos, type ParticipanteChamada, type StatusChamada } from "../lib-chamada";
import type { Pessoa, Presenca } from "../lib";
import type { Track } from "livekit-client";

/**
 * A chamada da sala.
 *
 * A regra que manda: abrir a sala NÃO entra na chamada, e o chat continua
 * sendo o protagonista. Se todo mundo está só na voz, isto aqui é uma faixa
 * de uma linha — não uma tela de videoconferência. Vídeo e tela só ocupam
 * espaço quando alguém liga.
 */
export function Chamada({
  disponivel,
  salaId,
  status,
  erro,
  limparErro,
  participantes,
  telaDeAlguem,
  micLigado,
  cameraLigada,
  telaLigada,
  dispositivos,
  pessoas,
  presencas,
  onEntrar,
  onSair,
  onAlternarMic,
  onAlternarCamera,
  onAlternarTela,
  onTrocarDispositivo,
}: {
  disponivel: boolean;
  salaId: string;
  status: StatusChamada;
  erro: string | null;
  limparErro: () => void;
  participantes: ParticipanteChamada[];
  telaDeAlguem: ParticipanteChamada | null;
  micLigado: boolean;
  cameraLigada: boolean;
  telaLigada: boolean;
  dispositivos: Dispositivos;
  pessoas: Map<string, Pessoa>;
  presencas: Presenca[];
  onEntrar: () => void;
  onSair: () => void;
  onAlternarMic: () => void;
  onAlternarCamera: () => void;
  onAlternarTela: () => void;
  onTrocarDispositivo: (tipo: MediaDeviceKind, id: string) => void;
}) {
  const [configAberta, setConfigAberta] = useState(false);
  const dentro = status === "dentro" || status === "reconectando";

  // Quem está na chamada mas NÃO é eu vem da presença enquanto eu estiver
  // fora — é o que me deixa ver que tem gente conversando antes de entrar.
  const naChamadaPelaPresenca = presencas.filter((p) => p.na_chamada && p.sala_id === salaId);
  const comCamera = participantes.filter((p) => p.video);

  return (
    <div className="shrink-0 border-b border-border">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-card-hover/40 px-4 py-2">
        <Headphones size={14} className={cn("shrink-0", dentro ? "text-accent-text" : "text-text-tertiary")} />

        {dentro ? (
          <>
            <span className="text-[12px] text-text-secondary">
              {status === "reconectando" ? (
                <span className="text-warning">Reconectando…</span>
              ) : (
                <>
                  Você está na chamada ·{" "}
                  <span className="font-semibold text-text-primary">{participantes.length}</span>{" "}
                  {participantes.length === 1 ? "participante" : "participantes"}
                </>
              )}
            </span>

            <div className="flex -space-x-1.5">
              {participantes.slice(0, 8).map((p) => (
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
              <Controle ativo={micLigado} onClick={onAlternarMic} titulo={micLigado ? "Desligar microfone" : "Ligar microfone"}>
                {micLigado ? <Mic size={15} /> : <MicOff size={15} />}
              </Controle>
              <Controle ativo={cameraLigada} onClick={onAlternarCamera} titulo={cameraLigada ? "Desligar câmera" : "Ligar câmera"}>
                {cameraLigada ? <Video size={15} /> : <VideoOff size={15} />}
              </Controle>
              <Controle ativo={telaLigada} onClick={onAlternarTela} titulo={telaLigada ? "Parar de compartilhar" : "Compartilhar tela"}>
                {telaLigada ? <MonitorOff size={15} /> : <Monitor size={15} />}
              </Controle>
              <Controle ativo={configAberta} onClick={() => setConfigAberta((v) => !v)} titulo="Dispositivos">
                <Settings2 size={15} />
              </Controle>
              <button
                type="button"
                onClick={onSair}
                title="Sair da chamada (continua na sala)"
                className="ml-1 flex h-7 items-center gap-1.5 rounded-button bg-danger-soft px-2 text-[11px] font-medium text-danger transition-colors hover:brightness-110"
              >
                <PhoneOff size={13} />
                Sair
              </button>
            </div>
          </>
        ) : (
          <>
            {naChamadaPelaPresenca.length === 0 ? (
              <span className="text-[12px] text-text-tertiary">Ninguém está na chamada.</span>
            ) : (
              <>
                <span className="text-[12px] text-text-secondary">
                  <span className="font-semibold text-text-primary">{naChamadaPelaPresenca.length}</span>{" "}
                  {naChamadaPelaPresenca.length === 1 ? "participante" : "participantes"}
                </span>
                <div className="flex -space-x-1.5">
                  {naChamadaPelaPresenca.slice(0, 6).map((p) => (
                    <span key={p.user_id} className="rounded-button ring-2 ring-card" title={pessoas.get(p.user_id)?.nome}>
                      <Avatar nome={pessoas.get(p.user_id)?.nome ?? "?"} id={p.user_id} tamanho={22} />
                    </span>
                  ))}
                </div>
              </>
            )}

            <div className="ml-auto flex items-center gap-2">
              {!disponivel && (
                <span className="text-[11px] text-text-muted">Chamadas ainda não configuradas neste ambiente.</span>
              )}
              <Button size="sm" variant="secondary" onClick={onEntrar} disabled={!disponivel || status === "entrando"}>
                {status === "entrando" ? "Entrando…" : "Entrar na chamada"}
              </Button>
            </div>
          </>
        )}
      </div>

      {erro && (
        <div className="flex items-start gap-2 border-t border-border bg-danger-soft px-4 py-2 text-[11px] text-danger">
          <span className="flex-1">{erro}</span>
          <button type="button" onClick={limparErro} aria-label="Fechar aviso" className="shrink-0">
            <X size={13} />
          </button>
        </div>
      )}

      {configAberta && dentro && (
        <div className="grid grid-cols-1 gap-3 border-t border-border bg-card px-4 py-3 sm:grid-cols-3">
          <SeletorDispositivo
            titulo="Microfone"
            itens={dispositivos.microfones}
            onEscolher={(id) => onTrocarDispositivo("audioinput", id)}
          />
          <SeletorDispositivo
            titulo="Câmera"
            itens={dispositivos.cameras}
            onEscolher={(id) => onTrocarDispositivo("videoinput", id)}
          />
          <SeletorDispositivo
            titulo="Saída de áudio"
            itens={dispositivos.saidas}
            onEscolher={(id) => onTrocarDispositivo("audiooutput", id)}
          />
        </div>
      )}

      {/* Só existe área de vídeo quando alguém ligou câmera ou tela. */}
      {dentro && (telaDeAlguem || comCamera.length > 0) && (
        <div className="border-t border-border bg-card px-3 py-3">
          {telaDeAlguem ? (
            <div className="space-y-2">
              {/* Tela compartilhada vira o conteúdo principal; as câmeras
                  encolhem pro lado. O chat continua logo abaixo. */}
              <Palco track={telaDeAlguem.tela} rotulo={`${telaDeAlguem.nome} está compartilhando a tela`} />
              {comCamera.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {comCamera.map((p) => (
                    <div key={p.id} className="w-32 shrink-0">
                      <Quadro participante={p} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
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
          )}
        </div>
      )}

      {/* Áudio de todo mundo: sem elemento no DOM, ninguém se ouve. */}
      {dentro &&
        participantes
          .filter((p) => !p.eu && p.audio)
          .map((p) => <AudioRemoto key={p.id} track={p.audio} />)}
    </div>
  );
}

function Controle({
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

function Palco({ track, rotulo }: { track: Track | null; rotulo: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => ligarTrack(track, ref.current), [track]);
  return (
    <div className="relative overflow-hidden rounded-card bg-black">
      <video ref={ref} autoPlay playsInline className="max-h-[46vh] w-full object-contain" />
      <span className="absolute bottom-2 left-2 rounded-button bg-black/70 px-2 py-0.5 text-[10px] text-white">
        {rotulo}
      </span>
    </div>
  );
}

function Quadro({ participante }: { participante: ParticipanteChamada }) {
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
      <span className="absolute bottom-1 left-1 flex items-center gap-1 rounded-button bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
        {!participante.micLigado && <MicOff size={9} />}
        {participante.nome}
        {participante.eu && " (você)"}
      </span>
    </div>
  );
}

/**
 * O áudio de cada participante remoto.
 *
 * Fica num elemento por pessoa, fora da área de vídeo, porque áudio não pode
 * depender de a câmera estar ligada — numa chamada só de voz não existe
 * nenhum quadro na tela, e mesmo assim todo mundo precisa se ouvir.
 */
function AudioRemoto({ track }: { track: Track | null }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => ligarTrack(track, ref.current), [track]);
  return <audio ref={ref} autoPlay />;
}
