"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle } from "@/components/ui/icones";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { LoadingState } from "@/components/ui/loading-state";
import { EVENTOS_META_PADRAO, type EventosMeta, type ModoInitiateCheckout } from "@/lib/tracking/eventos-meta";
import { Bloco, Cartao, Interruptor, Segmentado } from "./ui";

interface PixelMeta {
  pixelId: string;
  temToken: boolean;
}

const MODOS_IC: { key: ModoInitiateCheckout; label: string }[] = [
  { key: "desligado", label: "Desligado" },
  { key: "clique", label: "No clique" },
  { key: "pagina", label: "Ao abrir o checkout" },
];

/**
 * Quais eventos o NOSSO rastreamento manda pra Meta.
 *
 * A regra que esta tela existe pra proteger: cada evento sai de um lugar
 * só. Se o checkout ou o construtor da página também tiver o pixel
 * disparando o mesmo evento, ligar aqui duplica a conversão.
 */
export function EventosMetaPanel({ productId }: { productId: string }) {
  const toast = useToast();
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [eventos, setEventos] = useState<EventosMeta>(EVENTOS_META_PADRAO);
  const [paginas, setPaginas] = useState("");
  const [salvo, setSalvo] = useState<{ eventos: EventosMeta; paginas: string } | null>(null);
  const [pixels, setPixels] = useState<PixelMeta[]>([]);

  useEffect(() => {
    let vivo = true;
    fetch(`/api/tracking/script-config?product_id=${productId}`)
      .then((r) => r.json())
      .then((json) => {
        if (!vivo) return;
        // Sem resposta válida, compara contra o padrão — senão o "Salvar"
        // ficaria travado sem nunca perceber a alteração.
        if (json.error) {
          setSalvo({ eventos: EVENTOS_META_PADRAO, paginas: "" });
          return;
        }
        const textoPaginas = (json.paginasCheckout ?? []).join("\n");
        setEventos(json.eventos);
        setPaginas(textoPaginas);
        setSalvo({ eventos: json.eventos, paginas: textoPaginas });
        setPixels(json.pixelsMeta ?? []);
      })
      .catch(() => null)
      .finally(() => {
        if (vivo) setCarregando(false);
      });
    return () => {
      vivo = false;
    };
  }, [productId]);

  const alterado = useMemo(
    () => !!salvo && (JSON.stringify(salvo.eventos) !== JSON.stringify(eventos) || salvo.paginas !== paginas),
    [salvo, eventos, paginas]
  );

  const temPixel = pixels.length > 0;
  const temToken = pixels.some((p) => p.temToken);

  // O que a Meta recebe, em uma linha — é a pergunta que a pessoa vem
  // responder nesta tela.
  const resumo = [
    eventos.pageview && "PageView",
    eventos.lead && "Lead",
    eventos.initiateCheckout === "clique" && "InitiateCheckout (no clique)",
    eventos.initiateCheckout === "pagina" && "InitiateCheckout (ao abrir o checkout)",
    eventos.purchase && "Purchase (servidor)",
    eventos.deposit && "Deposit (servidor)",
  ].filter(Boolean) as string[];

  function alternar(chave: "pageview" | "lead" | "purchase" | "deposit") {
    setEventos((e) => ({ ...e, [chave]: !e[chave] }));
  }

  async function salvar() {
    setSalvando(true);
    const paginasCheckout = paginas
      .split(/[\n,]/)
      .map((p) => p.trim())
      .filter(Boolean);
    const res = await fetch("/api/tracking/script-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, eventos, paginasCheckout }),
    });
    const json = await res.json().catch(() => ({}));
    setSalvando(false);
    if (!res.ok) {
      toast.error(json.error ?? "Falha ao salvar.");
      return;
    }
    const textoPaginas = (json.paginasCheckout ?? []).join("\n");
    setEventos(json.eventos);
    setPaginas(textoPaginas);
    setSalvo({ eventos: json.eventos, paginas: textoPaginas });
    toast.success("Eventos salvos. Já valem na próxima visita.");
  }

  return (
    <Bloco
      titulo="Eventos enviados pra Meta"
      dica={
        <Tooltip text="Cada evento deve sair de UM lugar só. Se o checkout ou o construtor da página também tiver o pixel da Meta disparando o mesmo evento, deixe desligado aqui, senão a conversão conta duas vezes." />
      }
      acoes={
        <Button size="sm" onClick={salvar} disabled={!alterado || salvando || carregando}>
          {salvando ? "Salvando..." : "Salvar eventos"}
        </Button>
      }
    >
      {carregando ? (
        <Cartao>
          <LoadingState message="Carregando eventos..." />
        </Cartao>
      ) : (
        <Cartao className="divide-y divide-border p-0">
          {!temPixel && (
            <Aviso>Nenhum pixel da Meta ativo neste produto. Cadastre em Configurações &gt; Pixels pra algo sair.</Aviso>
          )}

          <Grupo titulo="Pelo navegador" sub="o script da página manda na hora">
            <Linha
              nome="PageView"
              quando="Toda vez que uma página com o script abre (landing, quiz, checkout)."
              controle={<Interruptor checked={eventos.pageview} onChange={() => alternar("pageview")} label="PageView" />}
            />
            <Linha
              nome="Lead"
              quando="Na primeira visita de cada pessoa. Abrir a página não é preencher nada: use só se for isso que a campanha deve otimizar."
              controle={<Interruptor checked={eventos.lead} onChange={() => alternar("lead")} label="Lead" />}
            />
            <Linha
              nome="InitiateCheckout"
              quando={
                eventos.initiateCheckout === "pagina"
                  ? "Quando a página de checkout abre. O script precisa estar instalado no checkout."
                  : eventos.initiateCheckout === "clique"
                    ? "Quando a pessoa clica num link de checkout feito no Gerador de link (marcado como checkout)."
                    : "Não sai pelo nosso rastreamento."
              }
              controle={
                <Segmentado
                  opcoes={MODOS_IC}
                  ativo={eventos.initiateCheckout}
                  onChange={(modo) => setEventos((e) => ({ ...e, initiateCheckout: modo }))}
                />
              }
            >
              {eventos.initiateCheckout === "pagina" && (
                <div className="mt-2 max-w-md space-y-1">
                  <label className="text-[11px] text-text-secondary">
                    Endereço da página de checkout (um por linha; basta um pedaço do link)
                  </label>
                  <textarea
                    value={paginas}
                    onChange={(e) => setPaginas(e.target.value)}
                    rows={2}
                    placeholder="pay.onprofit.com.br"
                    className="w-full rounded-input border border-border bg-input px-3 py-2 font-mono text-[11px] text-text-primary outline-none focus:border-accent"
                  />
                </div>
              )}
            </Linha>
          </Grupo>

          <Grupo titulo="Pelo servidor" sub="API de Conversões, quando o webhook chega">
            <Linha
              nome="Purchase"
              quando="Compra aprovada no checkout (webhook da plataforma), com o valor."
              aviso={eventos.purchase && temPixel && !temToken ? "Nenhum pixel com token da API de Conversões: não sai." : null}
              controle={<Interruptor checked={eventos.purchase} onChange={() => alternar("purchase")} label="Purchase" />}
            />
            <Linha
              nome="Deposit"
              quando="Depósito confirmado pela corretora (webhook), com o valor. Evento customizado."
              aviso={eventos.deposit && temPixel && !temToken ? "Nenhum pixel com token da API de Conversões: não sai." : null}
              controle={<Interruptor checked={eventos.deposit} onChange={() => alternar("deposit")} label="Deposit" />}
            />
          </Grupo>

          <div className="px-4 py-3 text-[12px]">
            <span className="text-text-tertiary">{alterado ? "Depois de salvar, a Meta recebe: " : "Hoje a Meta recebe: "}</span>
            <span className="font-medium text-text-primary">{resumo.length ? resumo.join(" · ") : "nada"}</span>
          </div>
        </Cartao>
      )}
    </Bloco>
  );
}

function Grupo({ titulo, sub, children }: { titulo: string; sub: string; children: ReactNode }) {
  return (
    <div className="px-4 py-3">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
        {titulo} <span className="font-normal normal-case tracking-normal text-text-muted">· {sub}</span>
      </p>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function Linha({
  nome,
  quando,
  controle,
  aviso,
  children,
}: {
  nome: string;
  quando: string;
  controle: ReactNode;
  aviso?: string | null;
  children?: ReactNode;
}) {
  return (
    <div className="py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="min-w-[16rem] flex-1">
          <code className="font-mono text-[12px] font-semibold text-text-primary">{nome}</code>
          <p className="text-[11px] text-text-tertiary">{quando}</p>
          {aviso && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-warning">
              <AlertTriangle size={11} /> {aviso}
            </p>
          )}
        </div>
        {controle}
      </div>
      {children}
    </div>
  );
}

function Aviso({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 px-4 py-2.5 text-[11px] text-warning">
      <AlertTriangle size={12} /> {children}
    </p>
  );
}
