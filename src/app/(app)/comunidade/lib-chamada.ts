"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  LocalTrackPublication,
  Participant as LKParticipant,
  RemoteTrackPublication,
  Room,
  Track,
} from "livekit-client";

/*
  O SDK do LiveKit entra sob demanda.

  Ele pesa ~140 kB e serve pra uma coisa só: falar. Quem abre a Comunidade pra
  ler o chat — que é a maior parte do tempo — não deve baixar WebRTC inteiro
  pra isso. O import acontece no primeiro clique em "Entrar na chamada".
*/
type ModuloLiveKit = typeof import("livekit-client");
let LK: ModuloLiveKit | null = null;

async function carregarLiveKit(): Promise<ModuloLiveKit> {
  if (!LK) LK = await import("livekit-client");
  return LK;
}

/*
  A chamada da sala.

  Regra que vale pra tudo aqui: nada de mídia acontece sem clique. O microfone
  só é pedido dentro de `entrar()`, a câmera só em `alternarCamera()`, a tela
  só em `alternarTela()`. Abrir a sala não toca em nenhum dos três.

  O transporte é o LiveKit (SFU): cada pessoa manda uma cópia do próprio áudio
  pro servidor, que redistribui. Em malha ponto-a-ponto, com 8 pessoas, cada
  uma subiria 7 cópias — e é aí que a chamada começa a picotar em internet
  doméstica.

  Este hook NÃO mora na página da Comunidade: ele mora no provedor que fica no
  layout do app (ver chamada-contexto.tsx). É o que permite andar pelo resto
  do sistema — inclusive pra mostrar uma tela do próprio ENGINE — sem a
  chamada cair junto com a página.
*/

export type StatusChamada = "fora" | "entrando" | "dentro" | "reconectando";

export interface SalaDaChamada {
  id: string;
  nome: string;
}

export interface ParticipanteChamada {
  id: string;
  nome: string;
  eu: boolean;
  falando: boolean;
  micLigado: boolean;
  /** Áudio do participante. Sem ele anexado a um elemento, ninguém se ouve. */
  audio: Track | null;
  video: Track | null;
  tela: Track | null;
}

export interface Dispositivo {
  id: string;
  rotulo: string;
}

export interface Dispositivos {
  microfones: Dispositivo[];
  cameras: Dispositivo[];
  saidas: Dispositivo[];
}

const SEM_DISPOSITIVOS: Dispositivos = { microfones: [], cameras: [], saidas: [] };

/** Mensagem de erro que explica o que fazer, não o código do navegador. */
function explicar(e: unknown): string {
  const nome = e instanceof Error ? e.name : "";
  const msg = e instanceof Error ? e.message : String(e);
  if (nome === "NotAllowedError" || /permission/i.test(msg)) {
    return "O navegador bloqueou o microfone. Libere o acesso no cadeado ao lado do endereço e entre de novo.";
  }
  if (nome === "NotFoundError" || /device not found/i.test(msg)) {
    return "Nenhum microfone encontrado neste computador.";
  }
  if (nome === "NotReadableError") {
    return "O microfone está ocupado por outro programa. Feche o outro e tente de novo.";
  }
  return msg || "Não deu pra entrar na chamada.";
}

/**
 * O navegador já autorizou microfone/câmera neste site?
 *
 * Serve pra decidir se vale mostrar o nosso aviso antes: quem já liberou uma
 * vez não vê janela nenhuma do Chrome, e um aviso "vai aparecer um pedido"
 * seria mentira. A Permissions API não existe em todo navegador — quando não
 * dá pra saber, o retorno é "desconhecido" e quem chama decide.
 */
export type EstadoPermissao = "granted" | "denied" | "prompt" | "desconhecido";

export async function estadoDaPermissao(tipo: "microphone" | "camera"): Promise<EstadoPermissao> {
  try {
    const permissions = navigator.permissions;
    if (!permissions?.query) return "desconhecido";
    // O tipo do TS não conhece "microphone"/"camera" em todos os navegadores,
    // e a query joga quando o nome não é suportado — daí o try.
    const status = await permissions.query({ name: tipo as PermissionName });
    if (status.state === "granted" || status.state === "denied" || status.state === "prompt") return status.state;
    return "desconhecido";
  } catch {
    return "desconhecido";
  }
}

export function useChamada(meuNome: string) {
  const [status, setStatus] = useState<StatusChamada>("fora");
  const [sala, setSala] = useState<SalaDaChamada | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [participantes, setParticipantes] = useState<ParticipanteChamada[]>([]);
  const [micLigado, setMicLigado] = useState(false);
  const [cameraLigada, setCameraLigada] = useState(false);
  const [telaLigada, setTelaLigada] = useState(false);
  const [dispositivos, setDispositivos] = useState<Dispositivos>(SEM_DISPOSITIVOS);

  const roomRef = useRef<Room | null>(null);

  const sincronizar = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;

    const lk = LK;
    if (!lk) return;

    // Arrow e não declaração: função declarada é içada pro topo, e aí o
    // TypeScript perde a garantia de que `lk` já foi carregado.
    const ler = (p: LKParticipant, eu: boolean): ParticipanteChamada => {
      return {
        id: p.identity,
        nome: p.name || (eu ? meuNome : "Sem nome"),
        eu,
        falando: p.isSpeaking,
        micLigado: p.isMicrophoneEnabled,
        // O próprio áudio nunca é tocado de volta: isso é microfonia.
        audio: eu ? null : (p.getTrackPublication(lk.Track.Source.Microphone)?.track ?? null),
        video: p.getTrackPublication(lk.Track.Source.Camera)?.track ?? null,
        tela: p.getTrackPublication(lk.Track.Source.ScreenShare)?.track ?? null,
      };
    };

    const lista: ParticipanteChamada[] = [ler(room.localParticipant, true)];
    room.remoteParticipants.forEach((p) => lista.push(ler(p, false)));
    setParticipantes(lista);

    setMicLigado(room.localParticipant.isMicrophoneEnabled);
    setCameraLigada(room.localParticipant.isCameraEnabled);
    setTelaLigada(room.localParticipant.isScreenShareEnabled);
  }, [meuNome]);

  const carregarDispositivos = useCallback(async () => {
    try {
      const lk = await carregarLiveKit();
      const [microfones, cameras, saidas] = await Promise.all([
        lk.Room.getLocalDevices("audioinput"),
        lk.Room.getLocalDevices("videoinput"),
        lk.Room.getLocalDevices("audiooutput"),
      ]);
      const mapear = (ds: MediaDeviceInfo[], prefixo: string): Dispositivo[] =>
        ds.map((d, i) => ({ id: d.deviceId, rotulo: d.label || `${prefixo} ${i + 1}` }));
      setDispositivos({
        microfones: mapear(microfones, "Microfone"),
        cameras: mapear(cameras, "Câmera"),
        saidas: mapear(saidas, "Saída"),
      });
    } catch {
      setDispositivos(SEM_DISPOSITIVOS);
    }
  }, []);

  const sair = useCallback(async () => {
    const room = roomRef.current;
    roomRef.current = null;
    setStatus("fora");
    setSala(null);
    setParticipantes([]);
    setMicLigado(false);
    setCameraLigada(false);
    setTelaLigada(false);
    if (room) await room.disconnect();
  }, []);

  const entrar = useCallback(
    async (alvo: SalaDaChamada) => {
      if (!alvo.id || roomRef.current) return;
      setErro(null);
      setSala(alvo);
      setStatus("entrando");

      try {
        // O token vem do nosso servidor, que é quem confere se esta pessoa pode
        // entrar nesta sala. O navegador nunca decide isso.
        const res = await fetch("/api/comunidade/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sala_id: alvo.id }),
        });
        const corpo = await res.json();
        if (!res.ok) throw new Error(corpo.error ?? "Não deu pra entrar na chamada.");

        const lk = await carregarLiveKit();
        const room = new lk.Room({
          // Manda só a qualidade que cabe na tela de quem assiste, e para de
          // enviar o que ninguém está olhando.
          adaptiveStream: true,
          dynacast: true,
        });
        roomRef.current = room;

        room
          .on(lk.RoomEvent.ParticipantConnected, sincronizar)
          .on(lk.RoomEvent.ParticipantDisconnected, sincronizar)
          .on(lk.RoomEvent.TrackSubscribed, sincronizar)
          .on(lk.RoomEvent.TrackUnsubscribed, sincronizar)
          .on(lk.RoomEvent.TrackMuted, sincronizar)
          .on(lk.RoomEvent.TrackUnmuted, sincronizar)
          .on(lk.RoomEvent.LocalTrackPublished, sincronizar)
          .on(lk.RoomEvent.LocalTrackUnpublished, sincronizar)
          .on(lk.RoomEvent.ActiveSpeakersChanged, sincronizar)
          .on(lk.RoomEvent.ConnectionStateChanged, (estado) => {
            if (estado === lk.ConnectionState.Reconnecting) setStatus("reconectando");
            if (estado === lk.ConnectionState.Connected) setStatus("dentro");
          })
          .on(lk.RoomEvent.Disconnected, () => {
            // Queda de verdade (servidor caiu, rede morreu): a sala continua
            // aberta, só a chamada acabou.
            roomRef.current = null;
            setStatus("fora");
            setSala(null);
            setParticipantes([]);
          })
          .on(lk.RoomEvent.MediaDevicesError, (e: unknown) => setErro(explicar(e)));

        await room.connect(corpo.url, corpo.token);

        // Só agora o navegador pede o microfone — e só o microfone. A câmera
        // continua desligada até alguém pedir por ela.
        await room.localParticipant.setMicrophoneEnabled(true);

        setStatus("dentro");
        sincronizar();
        carregarDispositivos();
      } catch (e) {
        setErro(explicar(e));
        await sair();
      }
    },
    [sincronizar, carregarDispositivos, sair]
  );

  const alternarMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    try {
      await room.localParticipant.setMicrophoneEnabled(!room.localParticipant.isMicrophoneEnabled);
      sincronizar();
    } catch (e) {
      setErro(explicar(e));
    }
  }, [sincronizar]);

  const alternarCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    try {
      await room.localParticipant.setCameraEnabled(!room.localParticipant.isCameraEnabled);
      sincronizar();
      carregarDispositivos();
    } catch (e) {
      setErro(explicar(e));
    }
  }, [sincronizar, carregarDispositivos]);

  const alternarTela = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    try {
      // Quem cancela a janela de escolha do navegador não é erro: é alguém
      // mudando de ideia.
      await room.localParticipant.setScreenShareEnabled(!room.localParticipant.isScreenShareEnabled, {
        audio: true,
      });
      sincronizar();
    } catch (e) {
      const nome = e instanceof Error ? e.name : "";
      if (nome !== "NotAllowedError") setErro(explicar(e));
    }
  }, [sincronizar]);

  const trocarDispositivo = useCallback(
    async (tipo: MediaDeviceKind, id: string) => {
      const room = roomRef.current;
      if (!room) return;
      try {
        await room.switchActiveDevice(tipo, id);
      } catch (e) {
        setErro(explicar(e));
      }
    },
    []
  );

  // Fechar a aba no meio da chamada não pode deixar o participante pendurado
  // do lado do servidor.
  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, []);

  const telaDeAlguem = participantes.find((p) => p.tela) ?? null;

  return {
    status,
    sala,
    erro,
    limparErro: () => setErro(null),
    participantes,
    telaDeAlguem,
    micLigado,
    cameraLigada,
    telaLigada,
    dispositivos,
    entrar,
    sair,
    alternarMic,
    alternarCamera,
    alternarTela,
    trocarDispositivo,
  };
}

/** Liga um track de mídia a um elemento — o LiveKit cuida do resto. */
export function ligarTrack(track: Track | null, el: HTMLMediaElement | null) {
  if (!track || !el) return;
  track.attach(el);
  return () => {
    track.detach(el);
  };
}

export type { LocalTrackPublication, RemoteTrackPublication };
