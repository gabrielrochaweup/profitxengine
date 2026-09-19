"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { isSpecialBucket, SPECIAL_BUCKET_HELP } from "./baldes";
import { Tabela, TabelaWrap, Td, Th, Tr, Vazio } from "./ui";

/*
  De onde vêm os resultados, numa tabela só.

  Antes a mesma pergunta estava espalhada em quatro lugares: "leads por
  fonte", "depósitos por fonte", "depósitos por campanha" e a tabela de
  campanhas. Cada um mostrava um pedaço da linha e nenhum mostrava a
  progressão — que é justamente o que se quer ver: entrou por onde, e até
  onde foi.

  Uma linha por fonte, e a campanha sai por baixo quando se pede. O
  drill-down é clique na linha em vez de uma quinta tabela.
*/

export interface LinhaDeCampanha {
  utm_source: string;
  utm_campaign: string;
  leads: number;
  initiate_checkouts: number;
  purchases: number;
  purchase_revenue_cents: number;
  contracts_signed: number;
  members_access: number;
  tool_signups: number;
  broker_signups: number;
  deposits: number;
  deposits_total_cents: number;
  spend_cents: number;
}

/** Qual coluna da tabela corresponde a cada etapa do funil. */
const COLUNA_DA_ETAPA: Record<string, string> = {
  lead: "leads",
  initiate_checkout: "initiate_checkouts",
  purchase: "purchases",
  members_access: "members_access",
  contract_signed: "contracts_signed",
  tool_signup: "tool_signups",
  broker_signup: "broker_signups",
  broker_deposit: "deposits",
};

interface Coluna {
  chave: keyof LinhaDeCampanha;
  titulo: string;
  fraco?: boolean;
  dinheiro?: "brl" | "usd";
}

const COLUNAS: Coluna[] = [
  { chave: "leads", titulo: "Leads" },
  { chave: "initiate_checkouts", titulo: "Checkout" },
  { chave: "purchases", titulo: "Compras" },
  { chave: "purchase_revenue_cents", titulo: "Receita", dinheiro: "brl" },
  { chave: "members_access", titulo: "Membros", fraco: true },
  { chave: "contracts_signed", titulo: "Contrato", fraco: true },
  { chave: "tool_signups", titulo: "Pepe", fraco: true },
  { chave: "broker_signups", titulo: "Corretora" },
  { chave: "deposits", titulo: "Depósitos" },
  { chave: "deposits_total_cents", titulo: "Depositado", dinheiro: "usd" },
];

function somar(linhas: LinhaDeCampanha[], chave: keyof LinhaDeCampanha): number {
  return linhas.reduce((acc, l) => acc + (Number(l[chave]) || 0), 0);
}

export function MatrizDeOrigem({
  linhas,
  etapaSelecionada,
  fmtBRL,
  fmtUSD,
}: {
  linhas: LinhaDeCampanha[];
  /** Etapa escolhida no funil — destaca e ordena por ela. */
  etapaSelecionada: string | null;
  fmtBRL: (cents: number) => string;
  fmtUSD: (cents: number) => string;
}) {
  const [aberta, setAberta] = useState<string | null>(null);

  const temGasto = useMemo(() => linhas.some((l) => l.spend_cents > 0), [linhas]);
  const colunaDestacada = etapaSelecionada ? COLUNA_DA_ETAPA[etapaSelecionada] : null;

  const fontes = useMemo(() => {
    const porFonte = new Map<string, LinhaDeCampanha[]>();
    for (const l of linhas) {
      porFonte.set(l.utm_source, [...(porFonte.get(l.utm_source) ?? []), l]);
    }

    const lista = Array.from(porFonte.entries()).map(([fonte, campanhas]) => ({
      fonte,
      campanhas: campanhas
        .slice()
        .sort((a, b) => b.deposits_total_cents - a.deposits_total_cents || b.leads - a.leads),
      total: COLUNAS.reduce(
        (acc, c) => ({ ...acc, [c.chave]: somar(campanhas, c.chave) }),
        {} as Record<string, number>
      ),
      gasto: somar(campanhas, "spend_cents"),
    }));

    // A ordem responde à pergunta da vez: com uma etapa escolhida no funil,
    // manda quem mais entregou NAQUELA etapa; sem escolha, manda o dinheiro
    // que voltou.
    return lista.sort((a, b) => {
      if (colunaDestacada) return (b.total[colunaDestacada] ?? 0) - (a.total[colunaDestacada] ?? 0);
      return (
        b.total.deposits_total_cents - a.total.deposits_total_cents ||
        b.total.purchase_revenue_cents - a.total.purchase_revenue_cents ||
        b.total.leads - a.total.leads
      );
    });
  }, [linhas, colunaDestacada]);

  if (fontes.length === 0) {
    return <Vazio>Sem dados suficientes nesse período.</Vazio>;
  }

  function celula(valor: number, coluna: Coluna, forte?: boolean) {
    const texto =
      coluna.dinheiro === "brl" ? fmtBRL(valor) : coluna.dinheiro === "usd" ? fmtUSD(valor) : String(valor);
    const zero = valor === 0;
    return (
      <Td
        key={coluna.chave}
        num
        forte={forte && !coluna.fraco && !zero}
        fraco={coluna.fraco && !forte}
        className={cn(
          // Metade desta tabela é zero. Zero apagado é o que faz o número
          // que existe saltar — antes todos tinham o mesmo peso e a tabela
          // virava textura.
          zero && "text-text-muted/50",
          // O depósito é o fim da linha: quando ele existe, ganha a cor de
          // resultado. É a única cor da tabela, e significa uma coisa só.
          !zero && coluna.chave === "deposits_total_cents" && "text-success",
          colunaDestacada === coluna.chave && "bg-accent-soft/50 text-text-primary"
        )}
      >
        {texto}
      </Td>
    );
  }

  return (
    <TabelaWrap>
      <Tabela>
        <thead>
          <tr className="border-b border-border">
            <Th>Origem</Th>
            {temGasto && <Th num>Gasto</Th>}
            {COLUNAS.map((c) => (
              <Th
                key={c.chave}
                num
                fraco={c.fraco}
                className={cn(colunaDestacada === c.chave && "bg-accent-soft/50 text-accent-text")}
              >
                {c.titulo}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fontes.map((f, i) => {
            const expandida = aberta === f.fonte;
            const soUma = f.campanhas.length === 1;
            return (
              <Fragment key={f.fonte}>
                {/* Faixa alternada + marca na primeira linha: a de cima é a
                    que mais entregou no critério da vez, e ela precisa se
                    anunciar sem virar outro cartão. */}
                <Tr
                  className={cn(
                    i % 2 === 1 && "bg-card-hover/25",
                    expandida && "bg-card-hover",
                    i === 0 && "shadow-[inset_2px_0_0_var(--accent)]"
                  )}
                >
                  <Td>
                    <button
                      type="button"
                      onClick={() => setAberta(expandida ? null : f.fonte)}
                      disabled={soUma}
                      className={cn(
                        "flex max-w-[220px] items-center gap-1 text-left",
                        soUma ? "cursor-default" : "hover:text-text-primary"
                      )}
                      title={soUma ? undefined : expandida ? "Recolher campanhas" : "Ver campanhas desta origem"}
                    >
                      {soUma ? (
                        <span className="w-3.5 shrink-0" />
                      ) : expandida ? (
                        <ChevronDown size={13} className="shrink-0 text-text-tertiary" />
                      ) : (
                        <ChevronRight size={13} className="shrink-0 text-text-tertiary" />
                      )}
                      <span className="truncate font-medium text-text-primary">{f.fonte}</span>
                      {isSpecialBucket(f.fonte) && <Tooltip text={SPECIAL_BUCKET_HELP[f.fonte]} />}
                      {!soUma && (
                        <span className="shrink-0 text-[10px] text-text-muted">{f.campanhas.length} camp.</span>
                      )}
                    </button>
                  </Td>
                  {temGasto && <Td num>{f.gasto > 0 ? fmtBRL(f.gasto) : "—"}</Td>}
                  {COLUNAS.map((c) => celula(f.total[c.chave] ?? 0, c, true))}
                </Tr>

                {expandida &&
                  f.campanhas.map((c) => (
                    <Tr key={`${f.fonte}-${c.utm_campaign}`} className="bg-card-hover/40">
                      <Td className="max-w-[220px] pl-5">
                        <span className="flex items-center gap-1 truncate text-text-secondary" title={c.utm_campaign}>
                          <span className="truncate">{c.utm_campaign}</span>
                          {isSpecialBucket(c.utm_campaign) && <Tooltip text={SPECIAL_BUCKET_HELP[c.utm_campaign]} />}
                        </span>
                      </Td>
                      {temGasto && <Td num>{c.spend_cents > 0 ? fmtBRL(c.spend_cents) : "—"}</Td>}
                      {COLUNAS.map((col) => celula(Number(c[col.chave]) || 0, col))}
                    </Tr>
                  ))}
              </Fragment>
            );
          })}
        </tbody>
      </Tabela>
    </TabelaWrap>
  );
}
