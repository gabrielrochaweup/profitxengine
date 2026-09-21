import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { trackingConfig } from "../tracking.config";
import type { EventoNormalizado } from "./tipos";

/*
  Do evento normalizado até a linha no banco.

  Duas responsabilidades, e as duas existem por um erro real do projeto de
  origem:

  1. CASAR O EVENTO COM UMA PESSOA. Um webhook chega dizendo "fulano
     comprou". Saber de qual anúncio esse fulano veio é o produto inteiro.

  2. NÃO DUPLICAR. Plataforma reenvia webhook quando a resposta demora — e
     sem o índice de deduplicação, uma venda vira três no relatório.
*/

interface DadosDoLead {
  id: string;
  email: string | null;
  phone: string | null;
}

/**
 * Telefone como CHAVE DE COMPARAÇÃO — não como telefone pra discar.
 *
 * O DDI sai fora de propósito: é o que faz "+55 11 98765-4321",
 * "11987654321" e "5511987654321" virarem a mesma string. Se o seu projeto
 * também DISCA ou manda mensagem pra esse número, guarde o formato completo
 * em outro lugar e não reaproveite esta função — foi exatamente essa
 * unificação, no projeto de origem, que quebrou o envio de WhatsApp.
 *
 * Ajuste o DDI se o seu público não for majoritariamente brasileiro.
 */
const DDI_LOCAL = "55";

export function chaveDeTelefone(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const digitos = valor.replace(/\D/g, "");
  if (!digitos) return null;
  return digitos.length > 11 && digitos.startsWith(DDI_LOCAL) ? digitos.slice(DDI_LOCAL.length) : digitos;
}

/**
 * A qual lead este evento pertence.
 *
 * Ordem: `ref` (o lead_id que o site carimbou — preciso), depois e-mail,
 * depois telefone. As duas últimas camadas existem porque a pessoa usa
 * e-mails diferentes em etapas diferentes, e o telefone às vezes é a única
 * coisa que se repete.
 *
 * E quando o evento traz um e-mail ou telefone que o lead ainda não tinha,
 * grava no lead. É esse preenchimento que permite casar os PRÓXIMOS eventos
 * daquela pessoa, mesmo os que não conseguirem propagar o ref.
 */
export async function casarLead(
  db: SupabaseClient,
  workspaceId: string,
  evento: Pick<EventoNormalizado, "ref" | "email" | "phone">
): Promise<string | null> {
  const email = evento.email?.trim().toLowerCase() || null;
  const telefone = chaveDeTelefone(evento.phone);

  let lead: DadosDoLead | null = null;

  if (evento.ref) {
    const { data } = await db
      .from("tracking_leads")
      .select("id, email, phone")
      .eq("id", evento.ref)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    lead = data as DadosDoLead | null;
  }

  if (!lead && email) {
    const { data } = await db
      .from("tracking_leads")
      .select("id, email, phone")
      .eq("workspace_id", workspaceId)
      .eq("email", email)
      .order("first_seen_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    lead = data as DadosDoLead | null;
  }

  if (!lead && telefone) {
    const { data } = await db
      .from("tracking_leads")
      .select("id, email, phone")
      .eq("workspace_id", workspaceId)
      .eq("phone", telefone)
      .order("first_seen_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    lead = data as DadosDoLead | null;
  }

  if (!lead) return null;

  const completar: Record<string, string> = {};
  if (email && !lead.email) completar.email = email;
  if (telefone && !lead.phone) completar.phone = telefone;
  if (Object.keys(completar).length > 0) {
    await db.from("tracking_leads").update(completar).eq("id", lead.id);
  }

  return lead.id;
}

export interface ResultadoDaGravacao {
  gravados: number;
  casados: number;
  erro: string | null;
}

/**
 * Grava os eventos de um webhook.
 *
 * `source` é a plataforma ("stripe", "hotmart"): ela entra na chave de
 * deduplicação junto com o external_id, então duas plataformas com ids
 * numéricos coincidentes não se atropelam.
 */
export async function gravarEventos(
  db: SupabaseClient,
  workspaceId: string,
  source: string,
  eventos: EventoNormalizado[],
  /**
   * O payload cru da origem, guardado junto.
   *
   * Vale o espaço: é a única forma de responder "a plataforma mandou mesmo
   * esse campo?" meses depois, e foi com ele que todo adapter deste kit foi
   * corrigido sem pedir print pro suporte do fornecedor.
   */
  rawPayload?: unknown
): Promise<ResultadoDaGravacao> {
  let gravados = 0;
  let casados = 0;

  for (const evento of eventos) {
    const leadId = await casarLead(db, workspaceId, evento);
    if (leadId) casados += 1;

    const linha = {
      workspace_id: workspaceId,
      lead_id: leadId,
      event_type: evento.tipo,
      source,
      email: evento.email,
      phone: evento.phone,
      name: evento.name,
      amount_cents: evento.amountCents,
      currency: evento.currency ?? trackingConfig.moedaPadrao,
      offer_id: evento.offerId,
      offer_name: evento.offerName,
      payment_method: evento.paymentMethod,
      external_id: evento.externalId,
      occurred_at: evento.occurredAt || new Date().toISOString(),
      raw_payload: (rawPayload ?? null) as Record<string, unknown> | null,
    };

    // Com external_id, a reentrega é ignorada pelo índice único. Sem ele,
    // não há como distinguir reentrega de evento novo — então insere, e o
    // risco de duplicar fica documentado pra quem configurar a origem.
    const { error } = evento.externalId
      ? await db.from("tracking_events").upsert(linha, { onConflict: "source,external_id", ignoreDuplicates: true })
      : await db.from("tracking_events").insert(linha);

    if (error) return { gravados, casados, erro: error.message };
    gravados += 1;
  }

  return { gravados, casados, erro: null };
}
