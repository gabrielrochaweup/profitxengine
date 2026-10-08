"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Headphones, PhoneOff } from "@/components/ui/icones";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { usePresenca } from "./lib";
import { estadoDaPermissao, useChamada, type SalaDaChamada } from "./lib-chamada";
import { ContextoDaChamada, type ChamadaContexto } from "./chamada-contexto";
import { AudiosDaChamada } from "./components/audios-da-chamada";
import { ChamadaFlutuante } from "./components/chamada-flutuante";
import { PermissaoModal, type TipoDePermissao } from "./components/permissao-modal";

/**
 * A chamada vive acima das páginas.
 *
 * Antes ela morava dentro da tela da Comunidade — e por isso clicar em
 * qualquer item do menu desligava o microfone no meio da frase: o React
 * desmonta a página, o hook vai junto e o LiveKit desconecta. Só que a
 * chamada não pertence à página; ela pertence à sessão da pessoa. Inclusive
 * porque o caso mais comum de compartilhar tela aqui é mostrar o próprio
 * ENGINE — o que exige andar pelo sistema com a chamada em pé.
 *
 * Então o estado (e os elementos de áudio, que é o que faz som sair) mora
 * aqui, no layout do app. Sair passa a ser sempre uma decisão: o botão
 * vermelho da sala, o da barra flutuante, ou o "sim" no aviso que aparece na
 * primeira vez que se navega pra fora.
 *
 * A presença subiu junto, pelo mesmo motivo: quem está na chamada da #Geral
 * enquanto lê o Tracking continua aparecendo como "na chamada" pra quem está
 * na sala.
 */

interface PedidoDePermissao {
  tipo: TipoDePermissao;
  bloqueada: boolean;
  acao: () => void;
}

export function ChamadaProvider({
  meuId,
  meuNome,
  disponivel,
  children,
}: {
  meuId: string;
  meuNome: string;
  disponivel: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const chamada = useChamada(meuNome);

  const [salaVista, setSalaVista] = useState<string | null>(null);
  const [pedido, setPedido] = useState<PedidoDePermissao | null>(null);
  const [destinoPendente, setDestinoPendente] = useState<string | null>(null);

  const naChamada = chamada.status === "dentro" || chamada.status === "reconectando";
  const { presencas, conectado } = usePresenca(meuId, salaVista, chamada.sala?.id ?? null);

  const verSala = useCallback((salaId: string | null) => setSalaVista(salaId), []);

  /* ────────── permissões: o aviso do app antes do aviso do navegador ────────── */

  const pedirEntao = useCallback(
    async (tipo: TipoDePermissao, permissao: "microphone" | "camera" | null, acao: () => void) => {
      // Compartilhar tela não tem estado consultável: o navegador sempre abre
      // o seletor de janela. O aviso, aí, é sobre O QUE escolher.
      const estado = permissao ? await estadoDaPermissao(permissao) : "prompt";
      if (estado === "granted") {
        acao();
        return;
      }
      setPedido({ tipo, bloqueada: estado === "denied", acao });
    },
    []
  );

  const entrarNaChamada = chamada.entrar;
  const alternarCameraCru = chamada.alternarCamera;
  const alternarTelaCru = chamada.alternarTela;
  const cameraLigada = chamada.cameraLigada;
  const telaLigada = chamada.telaLigada;

  const entrar = useCallback(
    (sala: SalaDaChamada) => {
      pedirEntao("microfone", "microphone", () => entrarNaChamada(sala));
    },
    [pedirEntao, entrarNaChamada]
  );

  const alternarCamera = useCallback(() => {
    if (cameraLigada) {
      alternarCameraCru();
      return;
    }
    pedirEntao("camera", "camera", alternarCameraCru);
  }, [pedirEntao, cameraLigada, alternarCameraCru]);

  const alternarTela = useCallback(() => {
    if (telaLigada) {
      alternarTelaCru();
      return;
    }
    pedirEntao("tela", null, alternarTelaCru);
  }, [pedirEntao, telaLigada, alternarTelaCru]);

  /* ────────── sair da chamada é sempre uma escolha ────────── */

  // Depois de responder "não, continuo na chamada", a pessoa circula à
  // vontade: perguntar de novo a cada clique de menu seria o mesmo estorvo
  // por outro caminho. A pergunta volta na próxima chamada.
  const jaPerguntouRef = useRef(false);
  useEffect(() => {
    if (!naChamada) jaPerguntouRef.current = false;
  }, [naChamada]);

  useEffect(() => {
    if (!naChamada) return;

    function aoClicar(e: MouseEvent) {
      if (jaPerguntouRef.current || e.defaultPrevented) return;
      // Clique do meio, ctrl/cmd+clique e afins abrem outra aba: a chamada
      // desta aqui não é afetada.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const alvo = e.target as HTMLElement | null;
      const link = alvo && alvo.closest ? (alvo.closest("a[href]") as HTMLAnchorElement | null) : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;
      // Voltar pra Comunidade não é sair de nada.
      if (url.pathname === "/comunidade") return;

      // Captura + stopPropagation pra chegar antes do Link do Next: depois
      // dele, a navegação já aconteceu.
      e.preventDefault();
      e.stopPropagation();
      setDestinoPendente(url.pathname + url.search);
    }

    document.addEventListener("click", aoClicar, true);
    return () => document.removeEventListener("click", aoClicar, true);
  }, [naChamada]);

  async function sairEIr() {
    const destino = destinoPendente;
    setDestinoPendente(null);
    await chamada.sair();
    if (destino) router.push(destino);
  }

  function irMantendo() {
    const destino = destinoPendente;
    jaPerguntouRef.current = true;
    setDestinoPendente(null);
    if (destino) router.push(destino);
  }

  const valor = useMemo<ChamadaContexto>(
    () => ({
      disponivel,
      status: chamada.status,
      sala: chamada.sala,
      naChamada,
      erro: chamada.erro,
      limparErro: chamada.limparErro,
      participantes: chamada.participantes,
      telaDeAlguem: chamada.telaDeAlguem,
      micLigado: chamada.micLigado,
      cameraLigada: chamada.cameraLigada,
      telaLigada: chamada.telaLigada,
      dispositivos: chamada.dispositivos,
      entrar,
      sair: chamada.sair,
      alternarMic: chamada.alternarMic,
      alternarCamera,
      alternarTela,
      trocarDispositivo: chamada.trocarDispositivo,
      presencas,
      presencaConectada: conectado,
      verSala,
    }),
    [disponivel, chamada, naChamada, entrar, alternarCamera, alternarTela, presencas, conectado, verSala]
  );

  return (
    <ContextoDaChamada.Provider value={valor}>
      {children}

      {/* O áudio de todo mundo mora aqui, e não na página: se estes elementos
          saíssem do DOM ao navegar, a chamada seguiria conectada e muda. */}
      <AudiosDaChamada participantes={chamada.participantes} ativo={naChamada} />

      {/* Fora da Comunidade, a chamada vira uma barra: é o que mostra que ela
          continua de pé e onde se sai dela sem voltar pra sala. */}
      {naChamada && pathname !== "/comunidade" && <ChamadaFlutuante />}

      {pedido && (
        <PermissaoModal
          tipo={pedido.tipo}
          bloqueada={pedido.bloqueada}
          ocupado={chamada.status === "entrando"}
          onConfirmar={() => {
            pedido.acao();
            setPedido(null);
          }}
          onFechar={() => setPedido(null)}
        />
      )}

      {destinoPendente && (
        <Modal open onClose={() => setDestinoPendente(null)} title="Deseja sair da chamada?" className="max-w-md">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-button bg-frame-soft text-frame-text">
              <Headphones size={18} />
            </span>
            <p className="text-[13px] leading-relaxed text-text-secondary">
              Você está na chamada
              {chamada.sala ? (
                <>
                  {" "}
                  da sala <strong className="text-text-primary">{chamada.sala.nome}</strong>
                </>
              ) : null}
              . Dá pra continuar nela enquanto usa o resto do ENGINE — é assim que se mostra uma tela do próprio
              sistema pra quem está ouvindo.
            </p>
          </div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="danger" size="sm" onClick={sairEIr}>
              <PhoneOff size={13} />
              Sim, sair da chamada
            </Button>
            <Button type="button" size="sm" onClick={irMantendo}>
              Não, continuar na chamada
            </Button>
          </div>
        </Modal>
      )}
    </ContextoDaChamada.Provider>
  );
}
