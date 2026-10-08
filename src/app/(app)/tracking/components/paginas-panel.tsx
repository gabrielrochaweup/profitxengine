"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, FileText } from "@/components/ui/icones";
import { Tooltip } from "@/components/ui/tooltip";
import { LoadingState } from "@/components/ui/loading-state";
import { createClient } from "@/lib/supabase/client";
import { ehPaginaDeTeste, tipoDaPagina, TIPO_DE_PAGINA_ROTULO, type TipoDePagina } from "@/lib/tracking/paginas";
import { Bloco, Segmentado, Vazio } from "./ui";
import { BarraEmFatias, BarraProporcional, Metrica, corDaFonte, pct } from "./ranking";

interface LinhaRelatorio {
  pagina: string;
  utm_source: string;
  utm_campaign: string;
  pessoas: number;
  visitas: number;
  leads_novos: number;
  checkouts: number;
  compras: number;
  depositos: number;
}

interface Pagina {
  pagina: string;
  tipo: TipoDePagina;
  pessoas: number;
  visitas: number;
  leads_novos: number;
  checkouts: number;
  compras: number;
  depositos: number;
  origens: LinhaRelatorio[];
  porFonte: { fonte: string; pessoas: number }[];
}

const ORDENS = [
  { key: "pessoas", label: "Pessoas" },
  { key: "leads_novos", label: "Leads novos" },
  { key: "checkouts", label: "Checkout" },
  { key: "compras", label: "Compras" },
] as const;
type Ordem = (typeof ORDENS)[number]["key"];

type FiltroTipo = "todas" | TipoDePagina;

function separar(pagina: string): { dominio: string; caminho: string } {
  const i = pagina.indexOf("/");
  return i < 0 ? { dominio: pagina, caminho: "" } : { dominio: pagina.slice(0, i), caminho: pagina.slice(i) };
}

/**
 * Páginas em ranking.
 *
 * A barra é a resposta a "qual página está mandando mais gente"; a faixa
 * colorida embaixo diz DE ONDE vem o tráfego dela. Uma pessoa conta UMA vez
 * por página (na primeira chegada a ela no período) — quem passa por duas
 * páginas conta nas duas, por isso as linhas não somam o Leads da Visão geral.
 */
export function PaginasPanel({
  productId,
  from,
  to,
  semTitulo,
}: {
  productId: string;
  from: Date;
  to: Date;
  /** Dentro de outro painel (Visão geral): sem moldura/título próprios. */
  semTitulo?: boolean;
}) {
  const [linhas, setLinhas] = useState<LinhaRelatorio[] | null>(null);
  const [nomes, setNomes] = useState<Map<string, string>>(new Map());
  const [erro, setErro] = useState<string | null>(null);
  const [aberta, setAberta] = useState<string | null>(null);
  const [mostrarTeste, setMostrarTeste] = useState(false);
  const [ordem, setOrdem] = useState<Ordem>("pessoas");
  const [tipo, setTipo] = useState<FiltroTipo>("todas");

  const fromIso = from.toISOString();
  const toIso = to.toISOString();

  // Nomes de campanha/conjunto/anúncio (migration 0126) — a campanha de cada
  // origem aparece pelo nome; sem a tabela ou sem sincronizar, fica o ID.
  useEffect(() => {
    let vivo = true;
    createClient()
      .from("ad_entity_names")
      .select("entity_id, name")
      .eq("product_id", productId)
      .then(({ data }) => {
        if (vivo && data) setNomes(new Map(data.map((n) => [n.entity_id, n.name])));
      });
    return () => {
      vivo = false;
    };
  }, [productId]);

  useEffect(() => {
    let vivo = true;
    setLinhas(null);
    setErro(null);
    createClient()
      .rpc("tracking_paginas_report", { p_product_id: productId, p_from: fromIso, p_to: toIso })
      .then(({ data, error }) => {
        if (!vivo) return;
        if (error) {
          setErro(
            /tracking_paginas_report/.test(error.message)
              ? "Falta rodar a migration 0125 no banco."
              : "Não deu pra carregar as páginas."
          );
          setLinhas([]);
          return;
        }
        setLinhas((data ?? []) as LinhaRelatorio[]);
      });
    return () => {
      vivo = false;
    };
  }, [productId, fromIso, toIso]);

  const { paginas, escondidas, contagemPorTipo } = useMemo(() => {
    const porPagina = new Map<string, Pagina>();
    for (const l of linhas ?? []) {
      const atual: Pagina = porPagina.get(l.pagina) ?? {
        pagina: l.pagina,
        tipo: tipoDaPagina(l.pagina),
        pessoas: 0,
        visitas: 0,
        leads_novos: 0,
        checkouts: 0,
        compras: 0,
        depositos: 0,
        origens: [],
        porFonte: [],
      };
      atual.pessoas += Number(l.pessoas);
      atual.visitas += Number(l.visitas);
      atual.leads_novos += Number(l.leads_novos);
      atual.checkouts += Number(l.checkouts);
      atual.compras += Number(l.compras);
      atual.depositos += Number(l.depositos);
      atual.origens.push(l);
      porPagina.set(l.pagina, atual);
    }
    const todas = Array.from(porPagina.values()).map((p) => {
      const fontes = new Map<string, number>();
      for (const o of p.origens) fontes.set(o.utm_source, (fontes.get(o.utm_source) ?? 0) + Number(o.pessoas));
      return {
        ...p,
        origens: [...p.origens].sort((a, b) => b.pessoas - a.pessoas),
        porFonte: Array.from(fontes, ([fonte, pessoas]) => ({ fonte, pessoas })).sort((a, b) => b.pessoas - a.pessoas),
      };
    });
    const visiveisTeste = mostrarTeste ? todas : todas.filter((p) => !ehPaginaDeTeste(p.pagina));
    const contagem: Record<string, number> = { todas: visiveisTeste.length };
    for (const p of visiveisTeste) contagem[p.tipo] = (contagem[p.tipo] ?? 0) + 1;
    const filtradas = tipo === "todas" ? visiveisTeste : visiveisTeste.filter((p) => p.tipo === tipo);
    filtradas.sort((a, b) => b[ordem] - a[ordem] || b.pessoas - a.pessoas);
    return { paginas: filtradas, escondidas: todas.length - visiveisTeste.length, contagemPorTipo: contagem };
  }, [linhas, mostrarTeste, ordem, tipo]);

  const maximo = paginas.reduce((m, p) => Math.max(m, p[ordem]), 0);
  const totalDaOrdem = paginas.reduce((s, p) => s + p[ordem], 0);

  const opcoesTipo: { key: FiltroTipo; label: string }[] = [
    { key: "todas", label: `Todas ${contagemPorTipo.todas ?? 0}` },
    ...(["quiz", "checkout", "plataforma", "site"] as TipoDePagina[])
      .filter((t) => contagemPorTipo[t])
      .map((t) => ({ key: t as FiltroTipo, label: `${TIPO_DE_PAGINA_ROTULO[t]} ${contagemPorTipo[t]}` })),
  ];

  const conteudo = (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Segmentado opcoes={opcoesTipo} ativo={tipo} onChange={setTipo} />
        <label className="flex items-center gap-2 text-[11px] text-text-tertiary">
          Ordenar por
          <Segmentado opcoes={ORDENS} ativo={ordem} onChange={setOrdem} />
        </label>
        {(escondidas > 0 || mostrarTeste) && (
          <button
            type="button"
            onClick={() => setMostrarTeste((v) => !v)}
            className="ml-auto text-[11px] text-text-tertiary underline-offset-2 hover:text-text-primary hover:underline"
          >
            {mostrarTeste ? "Esconder páginas de teste" : `Mostrar ${escondidas} de teste (localhost)`}
          </button>
        )}
      </div>

      {linhas === null ? (
        <LoadingState message="Carregando páginas..." />
      ) : erro ? (
        <Vazio icone={FileText}>{erro}</Vazio>
      ) : paginas.length === 0 ? (
        <Vazio icone={FileText}>Nenhuma visita registrada nesse período e tipo de página.</Vazio>
      ) : (
        <ul className="space-y-2">
          {paginas.map((p, i) => {
            const estaAberta = aberta === p.pagina;
            const { dominio, caminho } = separar(p.pagina);
            return (
              <li key={p.pagina} className="rounded-xl border border-border bg-app">
                <button
                  type="button"
                  onClick={() => setAberta(estaAberta ? null : p.pagina)}
                  aria-expanded={estaAberta}
                  className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2.5 px-3.5 py-3 text-left lg:grid-cols-[auto_minmax(0,1.1fr)_minmax(0,1.5fr)_auto]"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-input text-[11px] font-semibold tabular-nums text-text-tertiary">
                    {i + 1}
                  </span>

                  <span className="min-w-0">
                    <span className="flex min-w-0 items-center gap-1.5">
                      {estaAberta ? (
                        <ChevronDown size={13} className="shrink-0 text-text-tertiary" />
                      ) : (
                        <ChevronRight size={13} className="shrink-0 text-text-tertiary" />
                      )}
                      <span className="truncate text-[13px] font-semibold text-text-primary" title={p.pagina}>
                        {dominio}
                        {caminho && <span className="font-normal text-text-tertiary">{caminho}</span>}
                      </span>
                    </span>
                    <span className="mt-1 inline-flex items-center gap-1.5 pl-[19px]">
                      <span className="rounded-md bg-input px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
                        {TIPO_DE_PAGINA_ROTULO[p.tipo]}
                      </span>
                    </span>
                  </span>

                  <span className="col-span-2 lg:col-span-1">
                    <span className="flex items-center gap-3">
                      <BarraProporcional valor={p[ordem]} max={maximo} cor="var(--series-1)" className="flex-1" />
                      <span className="w-24 shrink-0 text-right">
                        <span className="text-[15px] font-semibold tabular-nums text-text-primary">{p[ordem]}</span>
                        <span className="ml-1 text-[11px] tabular-nums text-text-muted">{pct(p[ordem], totalDaOrdem)}</span>
                      </span>
                    </span>
                    <BarraEmFatias
                      className="mt-1.5 !h-1.5"
                      fatias={p.porFonte.map((f) => ({ rotulo: f.fonte, valor: f.pessoas, cor: corDaFonte(f.fonte) }))}
                    />
                  </span>

                  <span className="col-span-2 grid grid-cols-4 gap-x-4 lg:col-span-1 lg:flex">
                    <Metrica rotulo="Visitas" valor={p.visitas} className="lg:w-14" />
                    <Metrica
                      rotulo="Checkout"
                      valor={p.checkouts}
                      extra={p.checkouts ? pct(p.checkouts, p.pessoas) : undefined}
                      className="lg:w-20"
                    />
                    <Metrica
                      rotulo="Compras"
                      valor={p.compras}
                      extra={p.compras ? pct(p.compras, p.pessoas) : undefined}
                      className="lg:w-20"
                    />
                    <Metrica rotulo="Depósitos" valor={p.depositos} destaque={p.depositos > 0} className="lg:w-16" />
                  </span>
                </button>

                {estaAberta && (
                  <div className="border-t border-border px-3.5 py-3">
                    {/* Colunas fixas pros números: a barra encolheu pra dar lugar
                        a "entraram" e "foram ao checkout", que são o que se lê. */}
                    <div className="mb-1.5 grid grid-cols-[minmax(0,1fr)_3.5rem_5.5rem] items-end gap-x-3 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,0.7fr)_5rem_9rem]">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                        De onde vem o tráfego desta página
                      </p>
                      <span className="hidden sm:block" />
                      <p className="text-right text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">Entraram</p>
                      <p className="whitespace-nowrap text-right text-[10px] font-semibold uppercase tracking-wide text-text-tertiary"><span className="sm:hidden">Checkout</span><span className="hidden sm:inline">Foram ao checkout</span></p>
                    </div>
                    <div className="divide-y divide-border">
                      {p.origens.map((o) => {
                        const entraram = Number(o.pessoas);
                        const checkout = Number(o.checkouts);
                        return (
                          <div
                            key={`${o.utm_source}|${o.utm_campaign}`}
                            className="grid grid-cols-[minmax(0,1fr)_3.5rem_5.5rem] items-center gap-x-3 gap-y-1.5 py-2 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,0.7fr)_5rem_9rem]"
                          >
                            <span className="col-span-3 flex min-w-0 items-center gap-2 text-[12px] sm:col-span-1">
                              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: corDaFonte(o.utm_source) }} />
                              <span className="shrink-0 font-semibold text-text-primary">{o.utm_source}</span>
                              <span className="truncate text-text-tertiary" title={o.utm_campaign}>
                                {nomes.get(o.utm_campaign) ?? o.utm_campaign}
                              </span>
                            </span>
                            <BarraProporcional
                              valor={entraram}
                              max={p.origens[0] ? Number(p.origens[0].pessoas) : 0}
                              cor={corDaFonte(o.utm_source)}
                            />
                            <span className="text-right text-[16px] font-semibold leading-none tabular-nums text-text-primary">
                              {entraram}
                            </span>
                            <span className="text-right leading-none">
                              <span
                                className={
                                  checkout > 0
                                    ? "text-[16px] font-semibold tabular-nums text-ok"
                                    : "text-[16px] tabular-nums text-text-muted"
                                }
                              >
                                {checkout}
                              </span>
                              {checkout > 0 && (
                                <span className="ml-1.5 text-[11px] tabular-nums text-text-tertiary">{pct(checkout, entraram)}</span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );

  if (semTitulo) return <div>{conteudo}</div>;

  return (
    <Bloco
      titulo="Páginas"
      dica={
        <Tooltip text="Cada página com o script, em ranking. Pessoas = quem chegou na página no período (uma vez por pessoa), com a origem daquela chegada. Checkout, compras e depósitos contam quem fez isso DEPOIS de passar pela página — quem passa por duas páginas conta nas duas." />
      }
      descricao="A barra mostra qual página recebe mais gente; a faixa colorida embaixo, de onde vem o tráfego dela."
    >
      {conteudo}
    </Bloco>
  );
}
