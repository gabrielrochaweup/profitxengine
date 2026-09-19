"use client";

import { useEffect, useRef } from "react";
import { ligarTrack, type ParticipanteChamada } from "../lib-chamada";
import type { Track } from "livekit-client";

/**
 * O áudio de cada participante remoto.
 *
 * Um elemento por pessoa, fora de qualquer área de vídeo, porque áudio não
 * pode depender de câmera ligada — numa chamada só de voz não existe nenhum
 * quadro na tela e todo mundo precisa se ouvir.
 *
 * Fica montado no layout do app (ver chamada-provider.tsx) justamente pra
 * sobreviver à navegação: elemento fora do DOM não toca som.
 */
export function AudiosDaChamada({
  participantes,
  ativo,
}: {
  participantes: ParticipanteChamada[];
  ativo: boolean;
}) {
  if (!ativo) return null;
  return (
    <>
      {participantes
        .filter((p) => !p.eu && p.audio)
        .map((p) => (
          <AudioRemoto key={p.id} track={p.audio} />
        ))}
    </>
  );
}

function AudioRemoto({ track }: { track: Track | null }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => ligarTrack(track, ref.current), [track]);
  return <audio ref={ref} autoPlay />;
}
