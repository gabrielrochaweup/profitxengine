// Quais eventos vão pra Meta — escolhidos em Tracking > Ferramentas >
// Rastreamento e gravados em tracking_script_config (migration 0124).
//
// Cada evento sai de UM lugar só. Os do navegador saem do pixel.js; os do
// servidor, da API de Conversões, quando o webhook chega. Ligar aqui um
// evento que outra ferramenta (o checkout, o construtor da página) também
// dispara duplica a conversão no Gerenciador de Anúncios.

export type ModoInitiateCheckout = "desligado" | "clique" | "pagina";

export interface EventosMeta {
  pageview: boolean;
  lead: boolean;
  initiateCheckout: ModoInitiateCheckout;
  purchase: boolean;
  deposit: boolean;
}

/** O que valia antes desta configuração existir — e o que vale sem linha no banco. */
export const EVENTOS_META_PADRAO: EventosMeta = {
  pageview: true,
  lead: false,
  initiateCheckout: "desligado",
  purchase: false,
  deposit: true,
};

const MODOS: ModoInitiateCheckout[] = ["desligado", "clique", "pagina"];

/** Lê o jsonb do banco (snake_case) sem confiar no formato; campo ausente cai no padrão. */
export function lerEventosMeta(raw: unknown): EventosMeta {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const bool = (v: unknown, padrao: boolean) => (typeof v === "boolean" ? v : padrao);
  const modo = o.initiate_checkout;
  return {
    pageview: bool(o.pageview, EVENTOS_META_PADRAO.pageview),
    lead: bool(o.lead, EVENTOS_META_PADRAO.lead),
    initiateCheckout: MODOS.includes(modo as ModoInitiateCheckout)
      ? (modo as ModoInitiateCheckout)
      : EVENTOS_META_PADRAO.initiateCheckout,
    purchase: bool(o.purchase, EVENTOS_META_PADRAO.purchase),
    deposit: bool(o.deposit, EVENTOS_META_PADRAO.deposit),
  };
}

export function eventosMetaParaBanco(e: EventosMeta) {
  return {
    pageview: e.pageview,
    lead: e.lead,
    initiate_checkout: e.initiateCheckout,
    purchase: e.purchase,
    deposit: e.deposit,
  };
}

/** Limpa a lista de endereços de checkout: sem protocolo, sem vazios, sem repetidos. */
export function limparPaginasCheckout(lista: unknown): string[] {
  if (!Array.isArray(lista)) return [];
  const limpas = lista
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "").toLowerCase())
    .filter((v) => v.length >= 3);
  return Array.from(new Set(limpas)).slice(0, 20);
}
