"use client";

import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/*
  O funil, do jeito que o negócio acontece.

  Duas decisões mandam neste arquivo:

  1. PESSOA NÃO É EVENTO. O relatório de campanha conta ocorrências em todas
     as etapas menos "leads" — e está certo pra responder "quantas compras
     aconteceram". Num funil, porém, ler evento como pessoa produz besteira:
     7.870 acessos à área de membros sobre 221 leads dariam "3.561% de
     conversão". Então o número grande do card é PESSOA (leads distintos que
     chegaram ali) e a contagem de eventos aparece do lado, dizendo o que é.
     Quando nenhuma pessoa pôde ser identificada, a conversão vira "—" com a
     explicação — nunca uma porcentagem inventada.

  2. A ETAPA É UM ALVO, NÃO UM ENFEITE. Clicar numa etapa foca o resto da
     página nela. Por isso cada card é um botão e o estado de seleção mora
     fora daqui: quem usa decide o que fazer com a escolha.
*/

export interface LinhaFunil {
  utm_source: string;
  etapa: string;
  pessoas: number;
  eventos: number;
}

export interface EtapaDoFunil {
  chave: string;
  rotulo: string;
  /** Nome curto da unidade de evento desta etapa ("acessos", "assinaturas"…). */
  unidade: string;
  dica?: string;
}

/**
 * As oito etapas oficiais, na ordem da jornada.
 *
 * Exportada porque a tabela de origem usa as mesmas chaves pra destacar a
 * coluna da etapa escolhida — duas listas seriam duas verdades.
 */
export const ETAPAS_FUNIL: EtapaDoFunil[] = [
  {
    chave: "lead",
    rotulo: "Leads",
    unidade: "leads",
    dica: "Leads únicos identificados no período (primeira visita registrada).",
  },
  { chave: "initiate_checkout", rotulo: "Iniciou checkout", unidade: "aberturas" },
  { chave: "purchase", rotulo: "Compra do curso", unidade: "compras" },
  {
    chave: "members_access",
    rotulo: "Área de membros",
    unidade: "acessos",
    dica: "Cada entrada na área conta um acesso, e a mesma pessoa entra muitas vezes. Por isso o número grande é de pessoas e o de acessos aparece do lado.",
  },
  { chave: "contract_signed", rotulo: "Contrato assinado", unidade: "assinaturas" },
  { chave: "tool_signup", rotulo: "Cadastro no Pepe", unidade: "cadastros" },
  { chave: "broker_signup", rotulo: "Cadastro na corretora", unidade: "cadastros" },
  { chave: "broker_deposit", rotulo: "Depósito", unidade: "depósitos" },
];

export interface EtapaCalculada extends EtapaDoFunil {
  /** null quando existem eventos mas nenhum deles pôde ser ligado a uma pessoa. */
  pessoas: number | null;
  eventos: number;
  /** Fração de 0 a 1 sobre os leads do período, ou null quando não dá pra saber. */
  fracaoDeLeads: number | null;
  /** Fração de 0 a 1 sobre a etapa anterior, ou null quando não dá pra saber. */
  fracaoDaAnterior: number | null;
  rotuloAnterior: string | null;
}

/**
 * Soma as linhas da RPC nas oito etapas e calcula o que pode ser calculado.
 *
 * Fora do componente porque é conta, não desenho — e porque a página usa o
 * resultado em dois lugares (o funil e o resumo de maior queda).
 */
export function montarEtapasDoFunil(linhas: LinhaFunil[]): EtapaCalculada[] {
  const soma = new Map<string, { pessoas: number; eventos: number }>();
  for (const l of linhas) {
    const atual = soma.get(l.etapa) ?? { pessoas: 0, eventos: 0 };
    atual.pessoas += Number(l.pessoas) || 0;
    atual.eventos += Number(l.eventos) || 0;
    soma.set(l.etapa, atual);
  }

  const leads = soma.get("lead")?.pessoas ?? 0;
  const saida: EtapaCalculada[] = [];

  ETAPAS_FUNIL.forEach((etapa, i) => {
    const bruto = soma.get(etapa.chave) ?? { pessoas: 0, eventos: 0 };
    // Zero pessoa com evento acontecendo não é "zero pessoas": é "não dá pra
    // saber quantas", porque o evento chegou sem lead ligado.
    const pessoas = bruto.pessoas > 0 ? bruto.pessoas : bruto.eventos > 0 ? null : 0;

    const anterior = i > 0 ? saida[i - 1] : null;
    const baseAnterior = anterior?.pessoas ?? null;

    saida.push({
      ...etapa,
      pessoas,
      eventos: bruto.eventos,
      fracaoDeLeads: pessoas !== null && leads > 0 ? pessoas / leads : null,
      fracaoDaAnterior:
        pessoas !== null && baseAnterior !== null && baseAnterior > 0 ? pessoas / baseAnterior : null,
      rotuloAnterior: anterior?.rotulo ?? null,
    });
  });

  return saida;
}

/** A etapa onde mais gente sumiu — a resposta de "onde está a maior perda". */
export function maiorQueda(etapas: EtapaCalculada[]): EtapaCalculada | null {
  let pior: EtapaCalculada | null = null;
  for (const e of etapas) {
    if (e.fracaoDaAnterior === null) continue;
    if (!pior || e.fracaoDaAnterior < (pior.fracaoDaAnterior ?? 1)) pior = e;
  }
  return pior;
}

/**
 * Fração em porcentagem legível.
 *
 * Abaixo de 10% com uma casa decimal: entre "0%" e "0,4%" existe a diferença
 * de ter começado a acontecer. Acima disso a casa decimal só polui.
 */
export function porcentagem(fracao: number): string {
  const v = fracao * 100;
  return `${v >= 10 || v === 0 ? v.toFixed(0) : v.toFixed(1).replace(".", ",")}%`;
}

const SEM_CONVERSAO = "Conversão indisponível para esta etapa com os dados atuais.";

export function Funil({
  etapas,
  selecionada,
  onSelecionar,
}: {
  etapas: EtapaCalculada[];
  selecionada: string | null;
  onSelecionar: (chave: string | null) => void;
}) {
  const pior = maiorQueda(etapas);

  return (
    <div>
      {/* Cada etapa é um bloco no tom do fundo, dentro do painel do funil:
          o contraste entre os níveis separa uma da outra sem fio nem sombra. */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {etapas.map((e, i) => {
          const ativa = selecionada === e.chave;
          const ehPior = pior?.chave === e.chave;
          const valor = e.pessoas ?? e.eventos;
          const mostraEventos = e.chave !== "lead" && e.eventos !== e.pessoas;

          return (
            // div com papel de botão, não <button>: o ícone de ajuda (ⓘ) dentro
            // da etapa já é um botão, e botão dentro de botão é HTML inválido —
            // quebrava a hidratação da página.
            <div
              key={e.chave}
              role="button"
              tabIndex={0}
              onClick={() => onSelecionar(ativa ? null : e.chave)}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") {
                  ev.preventDefault();
                  onSelecionar(ativa ? null : e.chave);
                }
              }}
              aria-pressed={ativa}
              className={cn(
                "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
                "group min-w-0 rounded-xl border px-3 py-3 text-left transition-colors duration-150",
                ativa
                  ? "border-accent bg-accent-soft"
                  : ehPior
                    ? "border-danger bg-app hover:bg-card-hover"
                    : "border-border bg-app hover:border-border-strong hover:bg-card-hover"
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-input text-[10px] font-semibold tabular-nums text-text-tertiary">
                  {i + 1}
                </span>
                <span className="truncate text-[11px] font-medium text-text-secondary">{e.rotulo}</span>
                {e.dica && <Tooltip text={e.dica} />}
              </div>

              <p className="mt-2 text-[22px] font-bold leading-none tabular-nums text-text-primary">
                {valor.toLocaleString("pt-BR")}
              </p>
              <p className="mt-1 text-[10px] text-text-tertiary">
                {e.pessoas !== null ? (
                  <>
                    {e.pessoas === 1 ? "pessoa" : "pessoas"}
                    {mostraEventos && (
                      <span className="text-text-muted">
                        {" · "}
                        {e.eventos.toLocaleString("pt-BR")} {e.unidade}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    {e.unidade} — sem pessoa identificada
                    <Tooltip text="Os eventos desta etapa chegaram sem ligação com um lead nosso, então não dá pra contar quantas pessoas são." />
                  </span>
                )}
              </p>

              {/* A barra é a leitura de relance: o quanto desta etapa sobrou
                  em relação aos leads. */}
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-input">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-300"
                  style={{
                    width: e.fracaoDeLeads !== null ? `${Math.max(2, e.fracaoDeLeads * 100)}%` : "0%",
                    // A tinta esvazia junto com o funil: etapa que perdeu
                    // muita gente chega apagada, e isso se lê antes do texto.
                    opacity: e.fracaoDeLeads !== null ? Math.max(0.35, e.fracaoDeLeads) : 0,
                  }}
                />
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px]">
                <span className="tabular-nums text-text-tertiary">
                  {e.fracaoDeLeads !== null ? (
                    `${porcentagem(e.fracaoDeLeads)} dos leads`
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      — dos leads
                      <Tooltip text={SEM_CONVERSAO} />
                    </span>
                  )}
                </span>

                {i > 0 && (
                  <span
                    className={cn(
                      "tabular-nums",
                      e.fracaoDaAnterior === null
                        ? "text-text-muted"
                        : ehPior
                          ? "text-danger"
                          : "text-text-muted"
                    )}
                    title={e.rotuloAnterior ? `Em relação a "${e.rotuloAnterior}"` : undefined}
                  >
                    {e.fracaoDaAnterior !== null ? `↳ ${porcentagem(e.fracaoDaAnterior)} da anterior` : "↳ —"}
                  </span>
                )}

                {ehPior && (
                  <span className="rounded-md bg-danger px-1.5 py-0.5 font-semibold text-white">maior queda</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-2.5 text-[10px] leading-relaxed text-text-muted">
        O número grande é de <span className="text-text-tertiary">pessoas</span> — leads distintos que chegaram na
        etapa. Do lado, quando os dois diferem, vem a contagem de{" "}
        <span className="text-text-tertiary">eventos</span> registrados. Etapa cujos eventos não têm lead ligado não
        entra em conversão: aparece “—”, nunca uma porcentagem estimada.
      </p>
    </div>
  );
}
