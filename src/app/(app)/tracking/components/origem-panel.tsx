"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Megaphone } from "@/components/ui/icones";
import { LoadingState } from "@/components/ui/loading-state";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Segmentado, Vazio } from "./ui";
import { BarraProporcional, Metrica, corDaFonte, pct } from "./ranking";

/*
  De onde vêm os resultados, em cartões com barras.

  Fonte (fb/ig/…) → campanha → conjunto → anúncio, cada nível com o NOME que
  está na Meta, não o ID. O link do anúncio carrega os IDs nas UTMs
  (utm_campaign = campanha, utm_term = conjunto, utm_content = anúncio); o
  nome vem da tabela ad_entity_names, sincronizada pelo botão "Sincronizar
  gasto" em Anúncios. UTM que já chega com texto (ex: "quiz-pepe") aparece
  como está.

  A tabela completa (com gasto, ROI, contrato, Pepe…) continua a um clique:
  este painel responde "quem manda mais", ela responde "quanto custou".
*/

interface LinhaDetalhada {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  leads: number;
  checkouts: number;
  compras: number;
  receita_cents: number;
  cadastros_corretora: number;
  depositos: number;
  depositado_cents: number;
}

interface Metricas {
  leads: number;
  checkouts: number;
  compras: number;
  receita_cents: number;
  cadastros_corretora: number;
  depositos: number;
  depositado_cents: number;
}

type Nivel = "fonte" | "campanha" | "conjunto" | "anuncio";

interface No {
  id: string;
  nivel: Nivel;
  /** Valor cru da UTM (ID ou texto). Vazio = a UTM não veio. */
  chave: string;
  rotulo: string;
  /** Quando o rótulo é um nome, o ID vai embaixo; quando falta o nome, um aviso. */
  sub?: string;
  semNome?: boolean;
  m: Metricas;
  mediums?: string[];
  filhos: No[];
  cor: string;
}

const NIVEL_ROTULO: Record<Nivel, string> = {
  fonte: "Origem",
  campanha: "Campanha",
  conjunto: "Conjunto",
  anuncio: "Anúncio",
};

const METRICAS_BARRA = [
  { key: "leads", label: "Leads" },
  { key: "checkouts", label: "Checkout" },
  { key: "compras", label: "Compras" },
  { key: "depositos", label: "Depósitos" },
] as const;
type MetricaBarra = (typeof METRICAS_BARRA)[number]["key"];

const ETAPA_PARA_METRICA: Record<string, MetricaBarra> = {
  lead: "leads",
  initiate_checkout: "checkouts",
  purchase: "compras",
  broker_deposit: "depositos",
};

const ZERO: Metricas = {
  leads: 0,
  checkouts: 0,
  compras: 0,
  receita_cents: 0,
  cadastros_corretora: 0,
  depositos: 0,
  depositado_cents: 0,
};

function somar(a: Metricas, l: Metricas): Metricas {
  return {
    leads: a.leads + Number(l.leads),
    checkouts: a.checkouts + Number(l.checkouts),
    compras: a.compras + Number(l.compras),
    receita_cents: a.receita_cents + Number(l.receita_cents),
    cadastros_corretora: a.cadastros_corretora + Number(l.cadastros_corretora),
    depositos: a.depositos + Number(l.depositos),
    depositado_cents: a.depositado_cents + Number(l.depositado_cents),
  };
}

const ehId = (v: string) => /^\d{8,}$/.test(v);
const curto = (id: string) => (id.length > 10 ? `${id.slice(0, 4)}…${id.slice(-4)}` : id);

export function OrigemPanel({
  productId,
  from,
  to,
  etapaSelecionada,
  fmtBRL,
  fmtUSD,
  tabelaCompleta,
  onIrParaAnuncios,
}: {
  productId: string;
  from: Date;
  to: Date;
  etapaSelecionada: string | null;
  fmtBRL: (cents: number) => string;
  fmtUSD: (cents: number) => string;
  /** A tabela de sempre (gasto, ROI, contrato, Pepe…), pra quem quer todas as colunas. */
  tabelaCompleta: ReactNode;
  onIrParaAnuncios?: () => void;
}) {
  const [linhas, setLinhas] = useState<LinhaDetalhada[] | null>(null);
  const [nomes, setNomes] = useState<Map<string, string>>(new Map());
  const [erro, setErro] = useState<string | null>(null);
  const [visao, setVisao] = useState<"cartoes" | "tabela">("cartoes");
  const [metrica, setMetrica] = useState<MetricaBarra>(
    (etapaSelecionada && ETAPA_PARA_METRICA[etapaSelecionada]) || "leads"
  );
  const [abertos, setAbertos] = useState<Set<string>>(new Set());

  const fromIso = from.toISOString();
  const toIso = to.toISOString();

  // Etapa escolhida no funil troca a métrica da barra.
  useEffect(() => {
    if (etapaSelecionada && ETAPA_PARA_METRICA[etapaSelecionada]) setMetrica(ETAPA_PARA_METRICA[etapaSelecionada]);
  }, [etapaSelecionada]);

  useEffect(() => {
    let vivo = true;
    setLinhas(null);
    setErro(null);
    const supabase = createClient();
    Promise.all([
      supabase.rpc("tracking_origem_detalhada", { p_product_id: productId, p_from: fromIso, p_to: toIso }),
      // Antes da migration 0126 a tabela não existe: sem nomes, mostra o ID.
      supabase.from("ad_entity_names").select("entity_id, name").eq("product_id", productId),
    ]).then(([rpc, nomesRes]) => {
      if (!vivo) return;
      if (rpc.error) {
        setErro(
          /tracking_origem_detalhada/.test(rpc.error.message)
            ? "Falta rodar a migration 0126 no banco."
            : "Não deu pra carregar as origens."
        );
        setLinhas([]);
        return;
      }
      setLinhas((rpc.data ?? []) as LinhaDetalhada[]);
      setNomes(new Map((nomesRes.data ?? []).map((n) => [n.entity_id, n.name])));
    });
    return () => {
      vivo = false;
    };
  }, [productId, fromIso, toIso]);

  const { arvore, idsSemNome } = useMemo(() => {
    let semNome = 0;

    function rotular(chave: string, nivel: Nivel): Pick<No, "rotulo" | "sub" | "semNome"> {
      if (!chave) {
        return {
          rotulo: nivel === "campanha" ? "(sem campanha)" : nivel === "conjunto" ? "(sem conjunto)" : "(sem anúncio)",
        };
      }
      const nome = nomes.get(chave);
      if (nome) return { rotulo: nome, sub: chave };
      if (ehId(chave)) {
        semNome++;
        return { rotulo: `${NIVEL_ROTULO[nivel]} ${curto(chave)}`, sub: chave, semNome: true };
      }
      return { rotulo: chave };
    }

    const fontes = new Map<string, No>();
    for (const l of linhas ?? []) {
      const fonteNo =
        fontes.get(l.utm_source) ??
        ({
          id: `f:${l.utm_source}`,
          nivel: "fonte",
          chave: l.utm_source,
          rotulo: l.utm_source,
          m: { ...ZERO },
          mediums: [],
          filhos: [],
          cor: corDaFonte(l.utm_source),
        } as No);
      fonteNo.m = somar(fonteNo.m, l);
      if (l.utm_medium && !fonteNo.mediums!.includes(l.utm_medium)) fonteNo.mediums!.push(l.utm_medium);
      fontes.set(l.utm_source, fonteNo);

      const caminho: [Nivel, string][] = [
        ["campanha", l.utm_campaign],
        ["conjunto", l.utm_term],
        ["anuncio", l.utm_content],
      ];
      let pai = fonteNo;
      let idAcumulado = fonteNo.id;
      for (const [nivel, chave] of caminho) {
        idAcumulado += `|${nivel}:${chave}`;
        let no = pai.filhos.find((f) => f.id === idAcumulado);
        if (!no) {
          no = { id: idAcumulado, nivel, chave, ...rotular(chave, nivel), m: { ...ZERO }, filhos: [], cor: fonteNo.cor };
          pai.filhos.push(no);
        }
        no.m = somar(no.m, l);
        pai = no;
      }
    }

    // Nível sem informação não vira degrau: se o único filho de um nó é
    // "(sem …)", o conteúdo dele sobe — senão todo anúncio ficaria atrás de
    // um "(sem conjunto)" que não diz nada.
    function compactar(no: No): No {
      no.filhos = no.filhos.map(compactar);
      if (no.filhos.length === 1 && !no.filhos[0].chave) no.filhos = no.filhos[0].filhos;
      return no;
    }
    return { arvore: Array.from(fontes.values()).map(compactar), idsSemNome: semNome };
  }, [linhas, nomes]);


  function alternar(id: string) {
    setAbertos((prev) => {
      const prox = new Set(prev);
      if (prox.has(id)) prox.delete(id);
      else prox.add(id);
      return prox;
    });
  }

  function renderNo(no: No, irmaos: No[], profundidade: number): ReactNode {
    const ordenados = irmaos;
    const max = ordenados.reduce((m, n) => Math.max(m, n.m[metrica]), 0);
    const total = ordenados.reduce((s, n) => s + n.m[metrica], 0);
    const temFilhos = no.filhos.length > 0;
    const aberto = abertos.has(no.id);
    const raiz = profundidade === 0;
    const filhosOrdenados = [...no.filhos].sort((a, b) => b.m[metrica] - a.m[metrica] || b.m.leads - a.m.leads);

    return (
      <li
        key={no.id}
        className={cn(raiz ? "rounded-xl border border-border bg-app" : "border-l border-border-strong pl-3")}
      >
        <button
          type="button"
          onClick={() => temFilhos && alternar(no.id)}
          disabled={!temFilhos}
          aria-expanded={temFilhos ? aberto : undefined}
          className={cn(
            "grid w-full items-center gap-x-3 gap-y-2 text-left",
            "grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.3fr)_auto]",
            raiz ? "px-3.5 py-3" : "py-2.5",
            temFilhos ? "cursor-pointer" : "cursor-default"
          )}
        >
          <span className="min-w-0">
            <span className="flex min-w-0 items-center gap-1.5">
              {temFilhos ? (
                aberto ? (
                  <ChevronDown size={13} className="shrink-0 text-text-tertiary" />
                ) : (
                  <ChevronRight size={13} className="shrink-0 text-text-tertiary" />
                )
              ) : (
                <span className="w-[13px] shrink-0" />
              )}
              {raiz && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: no.cor }} />}
              <span
                className={cn(
                  "truncate",
                  raiz ? "text-[14px] font-semibold text-text-primary" : "text-[13px] font-medium text-text-primary",
                  no.semNome && "text-text-secondary"
                )}
                title={no.rotulo}
              >
                {no.rotulo}
              </span>
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-1.5 pl-[19px]">
              {!raiz && (
                <span className="rounded-md bg-input px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
                  {NIVEL_ROTULO[no.nivel]}
                </span>
              )}
              {raiz &&
                no.mediums?.map((md) => (
                  <span key={md} className="rounded-md bg-input px-1.5 py-0.5 text-[10px] text-text-tertiary">
                    {md}
                  </span>
                ))}
              {raiz && temFilhos && (
                <span className="text-[10px] text-text-muted">
                  {no.filhos.length} {no.filhos.length === 1 ? "campanha" : "campanhas"}
                </span>
              )}
              {no.sub && (
                <span className="truncate font-mono text-[10px] text-text-muted" title={no.sub}>
                  {no.semNome ? "sem nome — sincronize em Anúncios" : `ID ${curto(no.sub)}`}
                </span>
              )}
            </span>
          </span>

          <span className="flex items-center gap-3">
            <BarraProporcional valor={no.m[metrica]} max={max} cor={no.cor} className="flex-1" />
            <span className="w-20 shrink-0 text-right">
              <span className="text-[14px] font-semibold tabular-nums text-text-primary">{no.m[metrica]}</span>
              <span className="ml-1 text-[11px] tabular-nums text-text-muted">{pct(no.m[metrica], total)}</span>
            </span>
          </span>

          <span className="grid grid-cols-4 gap-x-4 lg:flex">
            <Metrica rotulo="Leads" valor={no.m.leads} className="lg:w-12" />
            <Metrica rotulo="Checkout" valor={no.m.checkouts} className="lg:w-16" />
            <Metrica
              rotulo="Compras"
              valor={no.m.compras}
              extra={no.m.receita_cents > 0 ? fmtBRL(no.m.receita_cents) : undefined}
              className="lg:w-20"
            />
            <Metrica
              rotulo="Depósitos"
              valor={no.m.depositos}
              extra={no.m.depositado_cents > 0 ? fmtUSD(no.m.depositado_cents) : undefined}
              destaque={no.m.depositos > 0}
              className="lg:w-24"
            />
          </span>
        </button>

        {temFilhos && aberto && (
          <ul className={cn("space-y-0", raiz ? "border-t border-border px-3.5 pb-2 pl-6" : "ml-2")}>
            {filhosOrdenados.map((f) => renderNo(f, filhosOrdenados, profundidade + 1))}
          </ul>
        )}
      </li>
    );
  }

  const ordenadasRaiz = [...arvore].sort((a, b) => b.m[metrica] - a.m[metrica] || b.m.leads - a.m.leads);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Segmentado
          opcoes={[
            { key: "cartoes", label: "Ranking" },
            { key: "tabela", label: "Tabela completa" },
          ]}
          ativo={visao}
          onChange={setVisao}
        />
        {visao === "cartoes" && (
          <label className="flex items-center gap-2 text-[11px] text-text-tertiary">
            Barra mostra
            <Segmentado opcoes={METRICAS_BARRA} ativo={metrica} onChange={setMetrica} />
          </label>
        )}
        {visao === "cartoes" && ordenadasRaiz.length > 0 && (
          <p className="ml-auto text-[11px] text-text-muted">Clique numa origem pra abrir campanha, conjunto e anúncio.</p>
        )}
      </div>

      {visao === "tabela" ? (
        tabelaCompleta
      ) : linhas === null ? (
        <LoadingState message="Carregando origens..." />
      ) : erro ? (
        <Vazio icone={Megaphone}>{erro}</Vazio>
      ) : ordenadasRaiz.length === 0 ? (
        <Vazio icone={Megaphone}>Sem dados suficientes nesse período.</Vazio>
      ) : (
        <>
          {idsSemNome > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-warning-soft px-3 py-2 text-[12px] text-text-secondary">
              <span>
                {idsSemNome} {idsSemNome === 1 ? "ID ainda aparece" : "IDs ainda aparecem"} sem o nome da Meta.
              </span>
              {onIrParaAnuncios && (
                <button type="button" onClick={onIrParaAnuncios} className="font-medium text-accent-text hover:underline">
                  Sincronizar em Anúncios →
                </button>
              )}
            </div>
          )}
          <ul className="space-y-2">{ordenadasRaiz.map((f) => renderNo(f, ordenadasRaiz, 0))}</ul>
        </>
      )}
    </div>
  );
}
