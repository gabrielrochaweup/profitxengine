import { ehRegistro, normalizarEmail, numero, texto, type Adapter } from "../tipos";

/*
  Plataformas brasileiras já mapeadas no projeto de origem.

  Vêm juntas num arquivo só porque são variações do mesmo tema (checkout de
  infoproduto) e porque o valor delas está nos comentários: cada um desses
  caminhos de payload custou um teste com dado real. Apagar o adapter é
  fácil; redescobrir que a Onprofit manda centavos e a Hotmart manda reais,
  não.

  A etapa que cada uma emite está numa constante no topo — troque pela
  chave do seu config se você chamou de outra coisa.
*/

const ETAPA_DE_COMPRA = "purchase";
const ETAPA_DE_ACESSO = "members_access";

/* ─────────────────────────────── Hotmart ─────────────────────────────── */

/*
  Formato público do webhook 2.0.0 pra "Compra aprovada".

  ATENÇÃO: a Hotmart deixa cada produtor escolher quais campos manda, e já
  mudou esse formato antes. Antes de ligar em produção, use "Enviar teste"
  no painel (Ferramentas > Webhook) e compare com o que está aqui. O payload
  cru fica salvo inteiro em tracking_events mesmo quando um campo não bate,
  então dá pra corrigir o adapter depois sem perder o evento.

  PREÇO EM REAIS, diferente do Stripe e da Onprofit: `price.value` 97.0 é
  R$ 97,00, por isso o × 100.
*/
export const hotmartAdapter: Adapter = (raw) => {
  if (!ehRegistro(raw)) return null;
  if (raw.event !== "PURCHASE_APPROVED" && raw.event !== "PURCHASE_COMPLETE") return null;

  const data = ehRegistro(raw.data) ? raw.data : null;
  const comprador = data && ehRegistro(data.buyer) ? data.buyer : null;
  const compra = data && ehRegistro(data.purchase) ? data.purchase : null;
  const preco = compra && ehRegistro(compra.price) ? compra.price : null;
  const origem = compra && ehRegistro(compra.origin) ? compra.origin : null;
  const produto = data && ehRegistro(data.product) ? data.product : null;

  const valor = preco ? numero(preco.value) : null;

  // Telefone: formato público documentado (código do país e número
  // separados). Ainda não confirmado com payload real.
  const ddi = comprador ? (texto(comprador.checkout_phone_code) ?? "") : "";
  const numeroDoTelefone = comprador ? texto(comprador.checkout_phone) : null;

  return {
    tipo: ETAPA_DE_COMPRA,
    email: normalizarEmail(comprador?.email),
    phone: numeroDoTelefone ? `${ddi}${numeroDoTelefone}` : null,
    name: texto(comprador?.name),
    // O parâmetro de rastreio da Hotmart é o "sck" — é nele que o link do
    // checkout carrega o nosso lead_id.
    ref: origem ? texto(origem.sck) : null,
    amountCents: valor === null ? null : Math.round(valor * 100),
    currency: preco ? (texto(preco.currency_value)?.toUpperCase() ?? null) : null,
    offerId: produto ? idDe(produto.id) : null,
    offerName: produto ? texto(produto.name) : null,
    paymentMethod: null,
    externalId: compra ? texto(compra.transaction) : null,
    occurredAt: compra && typeof compra.approved_date === "number" ? new Date(compra.approved_date).toISOString() : null,
  };
};

/* ─────────────────────────────── Onprofit ────────────────────────────── */

/*
  Baseado em payloads reais (evento "order", pedido pago).

  PREÇO JÁ EM CENTAVOS: `offer_price` 9700 é R$ 97,00 — confirmado
  multiplicando por 100 de novo e dando R$ 9.700. Nada de × 100 aqui.

  Só o status "PAID" vira evento. Os outros (pendente, recusado, reembolso)
  nunca foram vistos num payload real, então são ignorados em vez de
  adivinhados.
*/
const METODO_ONPROFIT: Record<string, string> = {
  cc: "Cartão de crédito",
  pix: "Pix",
  boleto: "Boleto",
};

export const onprofitAdapter: Adapter = (raw) => {
  if (!ehRegistro(raw)) return null;
  if (raw.object !== "order" || raw.status !== "PAID") return null;

  const cliente = ehRegistro(raw.customer) ? raw.customer : null;
  const produto = ehRegistro(raw.product) ? raw.product : null;
  const preco = numero(raw.price) ?? numero(raw.offer_price);
  const quando = texto(raw.confirmation_purchase_date) ?? texto(raw.purchase_date);

  // "cell" vem no padrão internacional (com DDI) e normaliza melhor;
  // "phone" é o formatado, sem DDI garantido.
  const telefone = cliente ? (texto(cliente.cell) ?? texto(cliente.phone)) : null;
  const nome = cliente
    ? [texto(cliente.name), texto(cliente.lastname)].filter(Boolean).join(" ").trim() || null
    : null;

  return {
    tipo: ETAPA_DE_COMPRA,
    email: normalizarEmail(cliente?.email),
    phone: telefone,
    name: nome,
    // A Onprofit não tem campo livre de rastreio: o link do checkout leva o
    // lead_id em "sck", mesma convenção da Hotmart.
    ref: texto(raw.sck) ?? texto(raw.src),
    amountCents: preco === null ? null : Math.round(preco),
    currency: null,
    // product.id é o PLANO (estável); offer_id é uma oferta daquele plano
    // (promoção, preço diferente) e muda sem o plano mudar.
    offerId: idDe(produto?.id) ?? idDe(raw.product_id),
    offerName: texto(raw.offer_name),
    paymentMethod: metodoOnprofit(raw.payment_type),
    externalId: idDe(raw.id),
    occurredAt: dataBr(quando),
  };
};

function metodoOnprofit(valor: unknown): string | null {
  const t = texto(valor);
  if (!t) return null;
  return METODO_ONPROFIT[t.toLowerCase()] ?? t;
}

/** "2026-08-18 11:04:14" sem fuso — a plataforma opera em Brasília. */
function dataBr(valor: string | null): string | null {
  if (!valor) return null;
  const data = new Date(`${valor.replace(" ", "T")}-03:00`);
  return Number.isNaN(data.getTime()) ? null : data.toISOString();
}

/* ──────────────────────────────── Cademi ─────────────────────────────── */

/*
  Área de membros. A Cademi manda DOIS formatos diferentes pro mesmo evento
  de "usuário criado", aparentemente conforme a versão configurada do lado
  deles — os dois foram vistos em produção no mesmo mês.

  Nenhum dos dois carrega campo de rastreio, então o casamento do lead cai
  pra e-mail (ou telefone, quando vem preenchido).
*/
export const cademiAdapter: Adapter = (raw) => {
  if (!ehRegistro(raw)) return null;

  // Formato "V2 - Stable".
  if (raw.event === "user.created") {
    const payload = ehRegistro(raw.payload) ? raw.payload : null;
    const usuario = payload && ehRegistro(payload.user) ? payload.user : null;
    if (!usuario) return null;

    const criado = ehRegistro(usuario.created) ? usuario.created : null;
    const em = criado && ehRegistro(criado.at) ? criado.at : null;

    return {
      tipo: ETAPA_DE_ACESSO,
      email: normalizarEmail(usuario.email),
      phone: texto(usuario.phone),
      name: texto(usuario.name),
      ref: null,
      amountCents: null,
      currency: null,
      offerId: null,
      offerName: null,
      paymentMethod: null,
      externalId: idDe(usuario.id),
      occurredAt: em ? texto(em.iso) : null,
    };
  }

  // Formato antigo, em português.
  if (raw.event_type === "usuario.criado") {
    const evento = ehRegistro(raw.event) ? raw.event : null;
    const usuario = evento && ehRegistro(evento.usuario) ? evento.usuario : null;
    if (!usuario) return null;

    return {
      tipo: ETAPA_DE_ACESSO,
      email: normalizarEmail(usuario.email),
      phone: texto(usuario.celular),
      name: texto(usuario.nome),
      ref: null,
      amountCents: null,
      currency: null,
      offerId: null,
      offerName: null,
      paymentMethod: null,
      externalId: idDe(usuario.id),
      occurredAt: texto(usuario.criado_em),
    };
  }

  return null;
};

function idDe(valor: unknown): string | null {
  if (typeof valor === "number") return String(valor);
  return texto(valor);
}
