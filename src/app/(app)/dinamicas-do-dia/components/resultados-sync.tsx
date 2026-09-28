"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useActiveProduct } from "@/components/layout/active-product-context";

interface UltimoResultado {
  data: string;
  texto: string | null;
  origem: "webhook" | "botao";
  aplicado: boolean;
  motivo: string | null;
  recebido_em: string;
}

type Retorno =
  | { ok: true; resultado: { data: string; aplicado: boolean; motivo: string | null; texto: string | null }; voltouDias: number }
  | { ok: false; erro: string };

function diaMes(data: string): string {
  const [, m, d] = data.split("-");
  return `${d}/${m}`;
}

function hora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Barra de resultados da Vortex na tela da dinâmica: de qual dia são os
 * números que as mensagens estão usando, e o botão pra buscar de novo.
 *
 * O normal é nem precisar do botão — a Vortex manda sozinha quando a equipe
 * salva o placar. Ele existe pra quando o envio automático falhar ou pra
 * conferir antes de postar.
 */
export function ResultadosSync({ onAtualizado }: { onAtualizado: () => void }) {
  const { activeProductId } = useActiveProduct();
  const [ultimo, setUltimo] = useState<UltimoResultado | null>(null);
  const [carregado, setCarregado] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState<{ tom: "ok" | "erro"; texto: string } | null>(null);

  const carregarUltimo = useCallback(async () => {
    if (!activeProductId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("resultados_do_dia")
      .select("data, texto, origem, aplicado, motivo, recebido_em")
      .eq("product_id", activeProductId)
      .eq("aplicado", true)
      .order("data", { ascending: false })
      .limit(1)
      .maybeSingle();
    setUltimo(data ?? null);
    setCarregado(true);
  }, [activeProductId]);

  useEffect(() => {
    carregarUltimo();
  }, [carregarUltimo]);

  async function atualizar() {
    setBuscando(true);
    setAviso(null);
    const res = await fetch("/api/dinamicas/resultados", { method: "POST" });
    const json = (await res.json().catch(() => null)) as Retorno | null;
    setBuscando(false);

    if (!json || !json.ok) {
      setAviso({ tom: "erro", texto: json && !json.ok ? json.erro : "Falha ao falar com o servidor." });
      return;
    }

    const { resultado, voltouDias } = json;
    const partes = [
      resultado.aplicado
        ? `Resultados de ${diaMes(resultado.data)} aplicados nas mensagens.`
        : `Resultados de ${diaMes(resultado.data)} recebidos, mas não aplicados.`,
      voltouDias > 0 ? "Hoje ainda não foi lançado na Vortex, então valeu o último dia lançado." : null,
      resultado.motivo,
    ].filter(Boolean);
    setAviso({ tom: resultado.aplicado ? "ok" : "erro", texto: partes.join(" ") });

    await carregarUltimo();
    if (resultado.aplicado) onAtualizado();
  }

  return (
    <div className="rounded-input border border-border bg-card-hover px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-text-secondary">
          {!carregado ? (
            "Resultados…"
          ) : ultimo ? (
            <>
              Resultados de <strong className="text-text-primary">{diaMes(ultimo.data)}</strong>
              <span className="text-text-muted">
                {" "}
                · {ultimo.origem === "webhook" ? "chegou da Vortex" : "buscado na Vortex"} em {hora(ultimo.recebido_em)}
              </span>
            </>
          ) : (
            <span className="text-text-muted">
              Nenhum resultado recebido da Vortex ainda — as mensagens usam o que está em Configurações.
            </span>
          )}
        </span>
        <Button type="button" variant="secondary" size="sm" className="ml-auto" onClick={atualizar} disabled={buscando}>
          <RefreshCw size={13} className={buscando ? "animate-spin" : undefined} />
          {buscando ? "Buscando…" : "Atualizar resultados"}
        </Button>
      </div>

      {aviso && (
        <p className={`mt-1.5 text-[12px] ${aviso.tom === "ok" ? "text-success" : "text-danger"}`}>{aviso.texto}</p>
      )}

      {ultimo?.texto && (
        <details className="mt-1.5">
          <summary className="cursor-pointer text-[11px] text-text-muted hover:text-text-secondary">
            Ver o texto que a Vortex mandou
          </summary>
          <pre className="mt-1 whitespace-pre-wrap rounded-input bg-card px-3 py-2 font-sans text-[12px] text-text-secondary">
            {ultimo.texto}
          </pre>
        </details>
      )}
    </div>
  );
}
