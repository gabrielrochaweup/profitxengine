"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { LoadingState } from "@/components/ui/loading-state";
import { createClient } from "@/lib/supabase/client";
import { ehPaginaDeTeste } from "@/lib/tracking/paginas";
import { cn } from "@/lib/utils";
import { Bloco, Cartao, Tabela, TabelaWrap, Td, Th, Tr, Vazio } from "./ui";

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

type Metricas = Pick<LinhaRelatorio, "pessoas" | "visitas" | "leads_novos" | "checkouts" | "compras" | "depositos">;

interface Pagina extends Metricas {
  pagina: string;
  /** Uma linha por origem × campanha, maior primeiro. */
  origens: LinhaRelatorio[];
  /** Pessoas por origem (utm_source), maior primeiro. */
  porFonte: { fonte: string; pessoas: number }[];
}

const ZERO: Metricas = { pessoas: 0, visitas: 0, leads_novos: 0, checkouts: 0, compras: 0, depositos: 0 };

function somar(a: Metricas, b: Metricas): Metricas {
  return {
    pessoas: a.pessoas + Number(b.pessoas),
    visitas: a.visitas + Number(b.visitas),
    leads_novos: a.leads_novos + Number(b.leads_novos),
    checkouts: a.checkouts + Number(b.checkouts),
    compras: a.compras + Number(b.compras),
    depositos: a.depositos + Number(b.depositos),
  };
}

function pct(parte: number, todo: number): string {
  if (!todo) return "—";
  return `${Math.round((parte / todo) * 100)}%`;
}

/**
 * Performance → Páginas: cada página que tem o script, separada, com de onde
 * veio o tráfego dela.
 *
 * Uma pessoa conta UMA vez por página (na primeira chegada a ela no
 * período), com a origem daquela chegada. Quem passa por duas páginas conta
 * nas duas — por isso as linhas não somam o total de leads da Visão geral.
 */
export function PaginasPanel({ productId, from, to }: { productId: string; from: Date; to: Date }) {
  const [linhas, setLinhas] = useState<LinhaRelatorio[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aberta, setAberta] = useState<string | null>(null);
  const [mostrarTeste, setMostrarTeste] = useState(false);

  const fromIso = from.toISOString();
  const toIso = to.toISOString();

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

  const { paginas, escondidas } = useMemo(() => {
    const porPagina = new Map<string, Pagina>();
    for (const l of linhas ?? []) {
      const atual = porPagina.get(l.pagina) ?? { pagina: l.pagina, ...ZERO, origens: [], porFonte: [] };
      Object.assign(atual, somar(atual, l));
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
    todas.sort((a, b) => b.pessoas - a.pessoas);
    const visiveis = mostrarTeste ? todas : todas.filter((p) => !ehPaginaDeTeste(p.pagina));
    return { paginas: visiveis, escondidas: todas.length - visiveis.length };
  }, [linhas, mostrarTeste]);

  return (
    <Bloco
      titulo="Páginas"
      dica={
        <Tooltip text="Cada página com o script, separada. Pessoas = quem chegou na página no período (uma vez por pessoa), com a origem daquela chegada. Checkout, compras e depósitos contam quem fez isso DEPOIS de passar pela página — quem passa por duas páginas conta nas duas." />
      }
      acoes={
        escondidas > 0 || mostrarTeste ? (
          <button
            type="button"
            onClick={() => setMostrarTeste((v) => !v)}
            className="text-[11px] text-text-tertiary underline-offset-2 hover:text-text-primary hover:underline"
          >
            {mostrarTeste ? "Esconder páginas de teste" : `Mostrar ${escondidas} de teste (localhost)`}
          </button>
        ) : null
      }
    >
      <Cartao>
        {linhas === null ? (
          <LoadingState message="Carregando páginas..." />
        ) : erro ? (
          <Vazio>{erro}</Vazio>
        ) : paginas.length === 0 ? (
          <Vazio>Nenhuma visita registrada no período.</Vazio>
        ) : (
          <TabelaWrap>
            <Tabela>
              <thead>
                <tr className="border-b border-border">
                  <Th>Página</Th>
                  <Th num>Pessoas</Th>
                  <Th num fraco>
                    Visitas
                  </Th>
                  <Th num fraco>
                    Leads novos
                  </Th>
                  <Th num>Checkout</Th>
                  <Th num>Compras</Th>
                  <Th num>Depósitos</Th>
                  <Th>De onde vem</Th>
                </tr>
              </thead>
              <tbody>
                {paginas.map((p) => {
                  const estaAberta = aberta === p.pagina;
                  return (
                    <Fragment key={p.pagina}>
                      <Tr>
                        <Td forte title={p.pagina}>
                          <button
                            type="button"
                            onClick={() => setAberta(estaAberta ? null : p.pagina)}
                            className="flex max-w-[22rem] items-center gap-1.5 text-left"
                            aria-expanded={estaAberta}
                          >
                            {estaAberta ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            <span className="truncate">{p.pagina}</span>
                          </button>
                        </Td>
                        <Td num forte>
                          {p.pessoas}
                        </Td>
                        <Td num fraco>
                          {p.visitas}
                        </Td>
                        <Td num fraco>
                          {p.leads_novos}
                        </Td>
                        <Td num>
                          {p.checkouts} <span className="text-text-muted">{pct(p.checkouts, p.pessoas)}</span>
                        </Td>
                        <Td num>
                          {p.compras} <span className="text-text-muted">{pct(p.compras, p.pessoas)}</span>
                        </Td>
                        <Td num>{p.depositos}</Td>
                        <Td>
                          <span className="flex gap-1.5">
                            {p.porFonte.slice(0, 3).map((f) => (
                              <span
                                key={f.fonte}
                                className="rounded-full bg-card-hover px-2 py-0.5 text-[10px] text-text-secondary"
                              >
                                {f.fonte} <span className="text-text-muted">{pct(f.pessoas, p.pessoas)}</span>
                              </span>
                            ))}
                            {p.porFonte.length > 3 && (
                              <span className="text-[10px] text-text-muted">+{p.porFonte.length - 3}</span>
                            )}
                          </span>
                        </Td>
                      </Tr>
                      {estaAberta &&
                        p.origens.map((o) => (
                          <tr
                            key={`${o.utm_source}|${o.utm_campaign}`}
                            className="border-b border-border bg-card-hover text-[11px]"
                          >
                            <td className={cn("py-1.5 pl-6 pr-2 text-text-tertiary")}>
                              <span className="text-text-secondary">{o.utm_source}</span>
                              <span className="text-text-muted"> · {o.utm_campaign}</span>
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums text-text-secondary">{o.pessoas}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums text-text-tertiary">{o.visitas}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums text-text-tertiary">{o.leads_novos}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums text-text-secondary">{o.checkouts}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums text-text-secondary">{o.compras}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums text-text-secondary">{o.depositos}</td>
                            <td />
                          </tr>
                        ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </Tabela>
          </TabelaWrap>
        )}
      </Cartao>
    </Bloco>
  );
}
