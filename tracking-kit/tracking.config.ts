/*
  O funil do SEU projeto, declarado uma vez.

  Este é o arquivo que se edita ao levar o kit pra outro produto. Tudo que
  no ENGINE estava cravado no código — as etapas do funil, o que cada uma
  significa, quais plataformas mandam webhook, em que moeda o dinheiro entra
  — mora aqui.

  O que ISSO evita, na prática: no projeto original, acrescentar uma etapa
  ("contrato assinado", "cadastro na ferramenta") exigia mexer num CHECK do
  Postgres, numa lista de rótulos no cliente, numa função de relatório e em
  três rotas de webhook. A constraint de event_type foi alterada três vezes
  em dois meses por causa disso. Aqui, etapa nova é uma linha nesta lista.
*/

export type PapelDaEtapa = "entrada" | "meio" | "conversao";

export interface EtapaDoFunil {
  /**
   * O que vai gravado em tracking_events.event_type.
   *
   * Use snake_case e trate como identificador imutável: renomear depois
   * exige UPDATE nos eventos já gravados. O rótulo é que é pra leitura.
   */
  chave: string;
  rotulo: string;
  /** Plural do que se conta ("compras", "acessos", "assinaturas"). */
  unidade: string;
  papel: PapelDaEtapa;
  /** Aparece como tooltip na etapa — use quando o número engana. */
  dica?: string;
  /**
   * A etapa carrega dinheiro? Quando sim, o relatório soma amount_cents e a
   * tela mostra receita, ticket médio e total.
   */
  valor?: { moeda: string; rotulo: string };
  /**
   * Um evento por pessoa, ou vários?
   *
   * "acesso à área de membros" acontece centenas de vezes pra mesma pessoa;
   * "compra" acontece uma ou duas. O funil conta PESSOAS distintas em toda
   * etapa, e usa isto só pra decidir se mostra a contagem de eventos ao
   * lado — sem isso, 7.870 acessos sobre 221 leads viravam "3.561% de
   * conversão" na tela.
   */
  repetePorPessoa?: boolean;
}

export interface FonteDeDados {
  /** Vai na URL do webhook: /api/tracking/webhooks/<kind>/<slug>. */
  kind: string;
  rotulo: string;
  /** Uma frase dizendo o que essa fonte manda. Aparece na tela de configuração. */
  descricao: string;
  /** Chaves do registro de adapters (lib/adapters/registro.ts). */
  plataformas: string[];
}

export interface TrackingConfig {
  /**
   * A que "espaço" os dados pertencem.
   *
   * Projeto de produto único: gere um uuid fixo e deixe aqui. Projeto
   * multi-produto (como o ENGINE): passe o id do produto ativo em runtime
   * e ignore este valor — ele só é o padrão.
   */
  workspaceIdPadrao: string;
  /** Usado em todo agrupamento por dia/hora. Relatório em UTC mente pro time. */
  fuso: string;
  moedaPadrao: string;
  etapas: EtapaDoFunil[];
  fontes: FonteDeDados[];
  /**
   * Quais etapas o script do site dispara sozinho (sem webhook).
   *
   * Tudo que está aqui é aceito pela rota pública /api/tracking/client-event,
   * e SÓ o que está aqui: é endpoint aberto, sem token, então a lista é a
   * fronteira entre "o site avisa" e "qualquer um grava o que quiser".
   */
  eventosDoPixel: string[];
}

export function definirTracking(config: TrackingConfig): TrackingConfig {
  const chaves = config.etapas.map((e) => e.chave);
  const repetidas = chaves.filter((c, i) => chaves.indexOf(c) !== i);
  if (repetidas.length > 0) {
    throw new Error(`tracking.config: etapa duplicada — ${repetidas.join(", ")}`);
  }
  for (const evento of config.eventosDoPixel) {
    if (!chaves.includes(evento)) {
      throw new Error(`tracking.config: eventosDoPixel cita "${evento}", que não é uma etapa.`);
    }
  }
  return config;
}

/* ─────────────────────────── exemplo ───────────────────────────
   Este é um funil de infoproduto com Stripe. Troque pelas suas etapas.
   Não precisa ter oito: um funil de três etapas funciona igual.
*/

export const trackingConfig = definirTracking({
  workspaceIdPadrao: "00000000-0000-0000-0000-000000000001",
  fuso: "America/Sao_Paulo",
  moedaPadrao: "BRL",

  etapas: [
    {
      chave: "page_view",
      rotulo: "Leads",
      unidade: "leads",
      papel: "entrada",
      dica: "Visitantes únicos identificados pelo script na landing.",
    },
    {
      chave: "initiate_checkout",
      rotulo: "Iniciou checkout",
      unidade: "aberturas",
      papel: "meio",
    },
    {
      chave: "purchase",
      rotulo: "Compra",
      unidade: "compras",
      papel: "conversao",
      valor: { moeda: "BRL", rotulo: "Receita" },
    },
    {
      chave: "members_access",
      rotulo: "Acessou o produto",
      unidade: "acessos",
      papel: "meio",
      repetePorPessoa: true,
      dica: "Cada entrada conta um acesso, e a mesma pessoa entra muitas vezes.",
    },
    {
      chave: "subscription_renewed",
      rotulo: "Renovou",
      unidade: "renovações",
      papel: "conversao",
      valor: { moeda: "BRL", rotulo: "Receita recorrente" },
    },
    {
      chave: "refund",
      rotulo: "Reembolso",
      unidade: "reembolsos",
      papel: "meio",
      valor: { moeda: "BRL", rotulo: "Devolvido" },
    },
  ],

  fontes: [
    {
      kind: "checkout",
      rotulo: "Checkout",
      descricao: "Onde o dinheiro entra: compra aprovada, renovação, reembolso.",
      plataformas: ["stripe", "hotmart", "onprofit", "generico"],
    },
    {
      kind: "produto",
      rotulo: "Área do produto",
      descricao: "Acesso do cliente ao que ele comprou.",
      plataformas: ["cademi", "generico"],
    },
    {
      kind: "externo",
      rotulo: "Sistema externo",
      descricao: "Qualquer outro sistema que precise marcar uma etapa do funil.",
      plataformas: ["generico"],
    },
  ],

  eventosDoPixel: ["initiate_checkout"],
});

/* ─────────────────────────── derivados ─────────────────────────── */

export function etapa(chave: string): EtapaDoFunil | undefined {
  return trackingConfig.etapas.find((e) => e.chave === chave);
}

export function rotuloDaEtapa(chave: string): string {
  return etapa(chave)?.rotulo ?? chave;
}

export function chavesDeEtapa(): string[] {
  return trackingConfig.etapas.map((e) => e.chave);
}

/** As etapas que somam dinheiro — o relatório financeiro é montado a partir delas. */
export function etapasComValor(): EtapaDoFunil[] {
  return trackingConfig.etapas.filter((e) => !!e.valor);
}

export function ehEtapaConhecida(chave: unknown): chave is string {
  return typeof chave === "string" && chavesDeEtapa().includes(chave);
}
