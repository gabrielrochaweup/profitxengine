import { trackingConfig, type EtapaDoFunil } from "../tracking.config";

/*
  As contas da tela, separadas do desenho.

  Tudo aqui é função pura sobre as linhas que a RPC `tracking_relatorio`
  devolve — uma linha por (origem, campanha, etapa). A tela pivota; o banco
  não precisa saber quais etapas existem.
*/

export interface LinhaDoRelatorio {
  utm_source: string;
  utm_campaign: string;
  event_type: string;
  pessoas: number;
  eventos: number;
  valor_cents: number;
}

export interface EtapaCalculada extends EtapaDoFunil {
  /**
   * Pessoas distintas que chegaram na etapa.
   *
   * null quando existem eventos mas nenhum deles casou com um lead: não é
   * "zero pessoas", é "não dá pra saber quantas". A diferença importa
   * porque zero vira 0% na tela, e "não dá pra saber" tem que virar "—".
   */
  pessoas: number | null;
  eventos: number;
  valorCents: number;
  /** Fração de 0 a 1 sobre a etapa de entrada. */
  fracaoDaEntrada: number | null;
  /** Fração de 0 a 1 sobre a etapa anterior. */
  fracaoDaAnterior: number | null;
  rotuloAnterior: string | null;
}

const BALDES_SEM_ORIGEM = new Set(["(direto)", "(sem campanha)", "(não atribuído)"]);

export function ehBaldeSemOrigem(valor: string): boolean {
  return BALDES_SEM_ORIGEM.has(valor);
}

export const EXPLICACAO_DO_BALDE: Record<string, string> = {
  "(direto)": "Chegou sem nenhuma UTM no link.",
  "(sem campanha)": "Tem origem, mas o link não trouxe utm_campaign.",
  "(não atribuído)": "O evento chegou e não casou com nenhum lead — sem campanha possível de atribuir.",
};

export interface Filtro {
  origem: string | "todas";
  ocultarNaoAtribuido: boolean;
}

export function filtrar(linhas: LinhaDoRelatorio[], filtro: Filtro): LinhaDoRelatorio[] {
  return linhas.filter((l) => {
    if (filtro.origem !== "todas" && l.utm_source !== filtro.origem) return false;
    if (filtro.ocultarNaoAtribuido && ehBaldeSemOrigem(l.utm_source)) return false;
    return true;
  });
}

export function origensDe(linhas: LinhaDoRelatorio[]): string[] {
  return Array.from(new Set(linhas.map((l) => l.utm_source))).sort();
}

/**
 * O funil, etapa por etapa, na ordem do config.
 *
 * A base das porcentagens é a etapa marcada como "entrada" — não a primeira
 * da lista por acaso. Um funil que começa em "cadastrou" em vez de "visitou"
 * continua fazendo sentido.
 */
export function montarFunil(linhas: LinhaDoRelatorio[]): EtapaCalculada[] {
  const soma = new Map<string, { pessoas: number; eventos: number; valor: number }>();
  for (const l of linhas) {
    const atual = soma.get(l.event_type) ?? { pessoas: 0, eventos: 0, valor: 0 };
    atual.pessoas += Number(l.pessoas) || 0;
    atual.eventos += Number(l.eventos) || 0;
    atual.valor += Number(l.valor_cents) || 0;
    soma.set(l.event_type, atual);
  }

  const chaveDaEntrada = trackingConfig.etapas.find((e) => e.papel === "entrada")?.chave;
  const base = chaveDaEntrada ? (soma.get(chaveDaEntrada)?.pessoas ?? 0) : 0;

  const saida: EtapaCalculada[] = [];

  trackingConfig.etapas.forEach((etapa, i) => {
    const bruto = soma.get(etapa.chave) ?? { pessoas: 0, eventos: 0, valor: 0 };
    const pessoas = bruto.pessoas > 0 ? bruto.pessoas : bruto.eventos > 0 ? null : 0;

    const anterior = i > 0 ? saida[i - 1] : null;
    const baseAnterior = anterior?.pessoas ?? null;

    saida.push({
      ...etapa,
      pessoas,
      eventos: bruto.eventos,
      valorCents: bruto.valor,
      fracaoDaEntrada: pessoas !== null && base > 0 ? pessoas / base : null,
      fracaoDaAnterior: pessoas !== null && baseAnterior !== null && baseAnterior > 0 ? pessoas / baseAnterior : null,
      rotuloAnterior: anterior?.rotulo ?? null,
    });
  });

  return saida;
}

/** Onde mais gente sumiu — a resposta de "qual é o gargalo". */
export function maiorQueda(etapas: EtapaCalculada[]): EtapaCalculada | null {
  let pior: EtapaCalculada | null = null;
  for (const e of etapas) {
    if (e.fracaoDaAnterior === null) continue;
    if (!pior || e.fracaoDaAnterior < (pior.fracaoDaAnterior ?? 1)) pior = e;
  }
  return pior;
}

export interface LinhaDeOrigem {
  origem: string;
  campanhas: string[];
  /** etapa → { pessoas, eventos, valorCents } */
  porEtapa: Record<string, { pessoas: number; eventos: number; valorCents: number }>;
}

/** A matriz: uma linha por origem, com a progressão até a última etapa. */
export function montarPorOrigem(linhas: LinhaDoRelatorio[]): LinhaDeOrigem[] {
  const mapa = new Map<string, LinhaDeOrigem>();

  for (const l of linhas) {
    const atual = mapa.get(l.utm_source) ?? { origem: l.utm_source, campanhas: [], porEtapa: {} };
    if (!atual.campanhas.includes(l.utm_campaign)) atual.campanhas.push(l.utm_campaign);

    const etapa = atual.porEtapa[l.event_type] ?? { pessoas: 0, eventos: 0, valorCents: 0 };
    etapa.pessoas += Number(l.pessoas) || 0;
    etapa.eventos += Number(l.eventos) || 0;
    etapa.valorCents += Number(l.valor_cents) || 0;
    atual.porEtapa[l.event_type] = etapa;

    mapa.set(l.utm_source, atual);
  }

  // Ordem: quem trouxe mais dinheiro primeiro; sem dinheiro, quem trouxe
  // mais gente na entrada.
  const chavesComValor = trackingConfig.etapas.filter((e) => e.valor).map((e) => e.chave);
  const chaveDaEntrada = trackingConfig.etapas.find((e) => e.papel === "entrada")?.chave;

  const dinheiro = (l: LinhaDeOrigem) =>
    chavesComValor.reduce((acc, c) => acc + (l.porEtapa[c]?.valorCents ?? 0), 0);

  return Array.from(mapa.values()).sort(
    (a, b) =>
      dinheiro(b) - dinheiro(a) ||
      (chaveDaEntrada ? (b.porEtapa[chaveDaEntrada]?.pessoas ?? 0) - (a.porEtapa[chaveDaEntrada]?.pessoas ?? 0) : 0)
  );
}

/* ─────────────────────────── formatação ─────────────────────────── */

export function dinheiro(cents: number, moeda = trackingConfig.moedaPadrao): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: moeda,
    maximumFractionDigits: 0,
  });
}

/**
 * Porcentagem legível.
 *
 * Abaixo de 10% ganha uma casa decimal: entre "0%" e "0,4%" existe a
 * diferença de ter começado a acontecer. Acima disso a casa só polui.
 */
export function porcentagem(fracao: number): string {
  const v = fracao * 100;
  return `${v >= 10 || v === 0 ? v.toFixed(0) : v.toFixed(1).replace(".", ",")}%`;
}

/** A janela de um dia no fuso do config — relatório em UTC mente pro time. */
export function janelaDeDias(dias: number | null) {
  const agora = new Date();
  if (dias === null) {
    return { de: new Date("2000-01-01T00:00:00Z").toISOString(), ate: agora.toISOString() };
  }
  if (dias === 0) {
    const hoje = agora.toLocaleDateString("en-CA", { timeZone: trackingConfig.fuso });
    // O deslocamento fixo vale pra fusos sem horário de verão (o Brasil não
    // tem desde 2019). Em fuso com DST, troque por uma lib de datas.
    return { de: new Date(`${hoje}T00:00:00-03:00`).toISOString(), ate: agora.toISOString() };
  }
  const de = new Date(agora);
  de.setDate(de.getDate() - dias);
  return { de: de.toISOString(), ate: agora.toISOString() };
}
