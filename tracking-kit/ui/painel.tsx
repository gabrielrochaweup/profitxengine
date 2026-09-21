"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { trackingConfig } from "../tracking.config";
import {
  dinheiro,
  filtrar,
  janelaDeDias,
  montarFunil,
  montarPorOrigem,
  origensDe,
  type LinhaDoRelatorio,
} from "./dados";
import { Funil } from "./funil";
import { MatrizDeOrigem } from "./origem";
import { Bloco, Cartao, Segmentado, Vazio } from "./primitivos";

/*
  A tela pronta.

  Recebe um cliente Supabase JÁ AUTENTICADO (o do seu projeto) e o workspace
  — o kit não sabe como você faz login, e não deveria saber.

    <PainelDeTracking supabase={createClient()} />

  Tudo que ela desenha sai de uma chamada só (`tracking_relatorio`), pivotada
  no cliente. Foi a troca que tornou o kit genérico: enquanto o relatório
  tinha uma coluna por etapa, cada etapa nova era uma migration.
*/

const PERIODOS = [
  { chave: "hoje", rotulo: "Hoje", dias: 0 },
  { chave: "7d", rotulo: "7 dias", dias: 7 },
  { chave: "30d", rotulo: "30 dias", dias: 30 },
  { chave: "90d", rotulo: "90 dias", dias: 90 },
  { chave: "tudo", rotulo: "Tudo", dias: null },
] as const;

type Periodo = (typeof PERIODOS)[number]["chave"];

export function PainelDeTracking({
  supabase,
  workspaceId = trackingConfig.workspaceIdPadrao,
}: {
  supabase: SupabaseClient;
  workspaceId?: string;
}) {
  const [periodo, setPeriodo] = useState<Periodo>("30d");
  const [origem, setOrigem] = useState<string>("todas");
  const [ocultarNaoAtribuido, setOcultarNaoAtribuido] = useState(false);
  const [linhas, setLinhas] = useState<LinhaDoRelatorio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [etapaSelecionada, setEtapaSelecionada] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    setCarregando(true);
    setErro(null);

    // `?? 30` aqui seria um bug silencioso: "Tudo" tem dias = null, e o
    // operador transformaria "tudo" em "30 dias" sem nada na tela mudar.
    const escolhido = PERIODOS.find((p) => p.chave === periodo);
    const { de, ate } = janelaDeDias(escolhido ? escolhido.dias : 30);

    supabase
      .rpc("tracking_relatorio", { p_workspace_id: workspaceId, p_from: de, p_to: ate })
      .then(({ data, error }) => {
        if (!vivo) return;
        // O erro aparece na tela em vez de virar lista vazia: "sem dados" e
        // "a função não existe / sem permissão" são coisas diferentes, e a
        // segunda some em silêncio se a tela tratar as duas igual.
        if (error) setErro(error.message);
        setLinhas((data as LinhaDoRelatorio[] | null) ?? []);
        setCarregando(false);
      });

    return () => {
      vivo = false;
    };
  }, [supabase, workspaceId, periodo]);

  const filtradas = useMemo(
    () => filtrar(linhas, { origem, ocultarNaoAtribuido }),
    [linhas, origem, ocultarNaoAtribuido]
  );
  const etapas = useMemo(() => montarFunil(filtradas), [filtradas]);
  const porOrigem = useMemo(() => montarPorOrigem(filtradas), [filtradas]);
  const origens = useMemo(() => origensDe(linhas), [linhas]);

  const comValor = etapas.filter((e) => e.valor && e.valorCents !== 0);

  return (
    <div>
      {/* ── filtros ── */}
      <div className="tk-bloco-topo" style={{ borderBottom: "1px solid var(--tk-borda)", paddingBottom: 12 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
          <Segmentado opcoes={PERIODOS} ativo={periodo} onChange={setPeriodo} />

          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--tk-texto-2)" }}>
            Origem
            <select
              value={origem}
              onChange={(e) => setOrigem(e.target.value)}
              style={{
                height: 30,
                background: "var(--tk-superficie-2)",
                color: "var(--tk-texto)",
                border: "1px solid var(--tk-borda)",
                borderRadius: 8,
                padding: "0 8px",
                fontSize: 12,
              }}
            >
              <option value="todas">Qualquer</option>
              {origens.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--tk-texto-2)" }}>
            <input
              type="checkbox"
              checked={ocultarNaoAtribuido}
              onChange={(e) => setOcultarNaoAtribuido(e.target.checked)}
            />
            Ocultar não atribuído
          </label>
        </div>
      </div>

      {erro && (
        <Cartao>
          <p style={{ padding: 16, fontSize: 12, color: "var(--tk-erro)" }}>
            Não deu pra carregar o relatório: {erro}
          </p>
        </Cartao>
      )}

      {carregando ? (
        <Vazio>Carregando…</Vazio>
      ) : (
        <div style={{ marginTop: 24 }}>
          {comValor.length > 0 && (
            <Bloco titulo="Resultado no período">
              <Cartao>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 32, padding: 16 }}>
                  {comValor.map((e) => (
                    <div key={e.chave}>
                      <p style={{ margin: 0, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--tk-texto-3)" }}>
                        {e.valor!.rotulo}
                      </p>
                      <p style={{ margin: "8px 0 0", fontSize: 28, fontWeight: 700, lineHeight: 1, color: "var(--tk-texto)" }}>
                        {dinheiro(e.valorCents, e.valor!.moeda)}
                      </p>
                      <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--tk-texto-3)" }}>
                        {e.eventos} {e.unidade}
                        {e.eventos > 0 && ` · ${dinheiro(Math.round(e.valorCents / e.eventos), e.valor!.moeda)} cada`}
                      </p>
                    </div>
                  ))}
                </div>
              </Cartao>
            </Bloco>
          )}

          <Bloco
            titulo="Funil"
            acoes={
              etapaSelecionada ? (
                <button
                  type="button"
                  onClick={() => setEtapaSelecionada(null)}
                  style={{ background: "none", border: 0, color: "var(--tk-accent-texto)", cursor: "pointer", font: "inherit" }}
                >
                  Limpar seleção
                </button>
              ) : (
                <span>Clique numa etapa pra destacá-la na tabela</span>
              )
            }
          >
            <Funil etapas={etapas} selecionada={etapaSelecionada} onSelecionar={setEtapaSelecionada} />
          </Bloco>

          <Bloco titulo="De onde vêm os resultados">
            <Cartao>
              <div style={{ padding: 12 }}>
                <MatrizDeOrigem origens={porOrigem} linhas={filtradas} etapaDestacada={etapaSelecionada} />
              </div>
            </Cartao>
          </Bloco>

          <p style={{ marginTop: 16, fontSize: 10, color: "var(--tk-texto-fraco)" }}>
            Conversões calculadas sobre a etapa de entrada (
            {trackingConfig.etapas.find((e) => e.papel === "entrada")?.rotulo ?? "—"}).
          </p>
        </div>
      )}
    </div>
  );
}
