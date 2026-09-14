import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlano, type Plano } from "./planos";
import { sendpulseKey } from "./config-keys";

/* ==================================================================
   SendPulse — motor único de decisão dos funis de WhatsApp.

   São dois funis independentes, cada um com sua própria trava:

     boas-vindas  · dispara na compra, uma vez por plano ALCANÇADO
                    (Starter -> Pro -> Elite gera até 3 ao longo da vida)
                  · trava: sendpulse_boasvindas_sent (product, email, plano)
                  · não depende de contrato assinado

     contrato     · dispara na assinatura, uma vez por documento
                  · trava: o próprio tracking_event do contrato (doc_token
                    em external_id), resolvida por quem chama
                  · exige a pessoa reconhecida por compra ou área de membros

   Quem manda a mensagem é o SendPulse; aqui só decidimos SE dispara, pra
   QUAL endereço de evento, e registramos o que aconteceu.
   ================================================================== */

type Admin = ReturnType<typeof createAdminClient>;

const TIMEOUT_MS = 8000;

export type TipoFunil = "boas_vindas" | "contrato";

interface ResultadoDisparo {
  ok: boolean;
  motivo?: string;
}

/* ---------------- telefone ---------------------------------------- */

/**
 * Telefone no formato que o SendPulse espera: +55 e os dígitos.
 *
 * O que chega aqui varia por origem — "(47) 99999-9999" (formulário da
 * ZapSign), "+5549998171618" (customer.cell da Onprofit), "43996103560"
 * (Cademi). Sem normalizar, o SendPulse não acha o contato do WhatsApp e a
 * mensagem não sai, sem erro nenhum.
 */
export function normalizarTelefone(value: string | null | undefined): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";

  if (digits.length >= 12 && digits.startsWith("55")) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  if (digits.length >= 11) return `+${digits}`;

  return ""; /* curto demais para ser telefone */
}

/* ---------------- para onde vai o disparo ------------------------- */

interface Destino {
  url: string;
  origem: string;
}

/**
 * Endereço do evento no SendPulse para um tipo de funil + plano.
 *
 * O endereço "geral" é reserva: cobre compra cujo plano não foi
 * identificado e plano novo que ainda não tem evento montado do outro
 * lado. Sem essa reserva, um plano novo no catálogo calaria a mensagem
 * dele sem ninguém perceber.
 *
 * Desligar o funil de um plano específico é diferente de não ter endereço:
 * se a linha do plano existe e está desligada, o disparo para ali mesmo e
 * NÃO cai no geral — cair no geral mandaria a mensagem errada pra quem foi
 * silenciado de propósito.
 */
async function enderecoDoEvento(
  admin: Admin,
  productId: string,
  tipo: TipoFunil,
  plano: Plano | null
): Promise<Destino | { desligado: true }> {
  const prefixo = tipo === "boas_vindas" ? "boasvindas" : "contrato";

  if (plano) {
    const { data: doPlano } = await admin
      .from("sendpulse_settings")
      .select("enabled, url")
      .eq("product_id", productId)
      .eq("key", sendpulseKey(prefixo, plano))
      .maybeSingle();

    if (doPlano && !doPlano.enabled) return { desligado: true };
    if (doPlano?.url?.trim()) return { url: doPlano.url.trim(), origem: plano };
  }

  const { data: geral } = await admin
    .from("sendpulse_settings")
    .select("enabled, url")
    .eq("product_id", productId)
    .eq("key", sendpulseKey(prefixo, "geral"))
    .maybeSingle();

  if (geral && !geral.enabled) return { desligado: true };
  if (geral?.url?.trim()) return { url: geral.url.trim(), origem: "geral" };

  return { url: "", origem: "" };
}

/* ---------------- registro + envio -------------------------------- */

interface EnvioInput {
  productId: string;
  tipo: TipoFunil;
  plano: Plano | null;
  email: string;
  phone: string;
  nome: string;
}

async function registrarFalha(
  admin: Admin,
  { productId, tipo, plano, email, phone }: EnvioInput,
  erro: string
): Promise<ResultadoDisparo> {
  await admin.from("sendpulse_dispatch_log").insert({
    product_id: productId,
    tipo,
    email,
    phone,
    plano: plano ?? "",
    status: "falhou",
    erro,
  });
  return { ok: false, motivo: erro };
}

/**
 * Faz o POST no endereço do evento e registra o resultado.
 *
 * O corpo é o mesmo em todos os funis — quem diferencia a mensagem é o
 * evento do SendPulse que recebeu o POST, e o campo "evento" aqui dentro
 * pro fluxo poder ramificar sem depender só da URL.
 */
async function enviar(admin: Admin, input: EnvioInput, destino: Destino): Promise<ResultadoDisparo> {
  const { productId, tipo, plano, email, phone, nome } = input;

  const corpo = {
    email,
    phone,
    nome,
    plano: plano ?? "",
    evento: tipo === "boas_vindas" ? "boas_vindas" : "contrato_assinado",
  };

  const { data: registro } = await admin
    .from("sendpulse_dispatch_log")
    .insert({
      product_id: productId,
      tipo,
      email,
      phone,
      plano: plano ?? "",
      destino: destino.origem,
      status: "enviando",
      payload: corpo,
    })
    .select("id")
    .single();

  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(destino.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
      signal: controle.signal,
    });
    const texto = (await res.text().catch(() => "")).slice(0, 500);

    if (!res.ok) {
      if (registro) {
        await admin
          .from("sendpulse_dispatch_log")
          .update({ status: "falhou", erro: `HTTP ${res.status}`, response_body: texto })
          .eq("id", registro.id);
      }
      return { ok: false, motivo: `HTTP ${res.status}` };
    }

    if (registro) {
      await admin
        .from("sendpulse_dispatch_log")
        .update({ status: "enviado", response_body: texto, sent_at: new Date().toISOString() })
        .eq("id", registro.id);
    }
    return { ok: true };
  } catch (err) {
    const motivo =
      err instanceof Error && err.name === "AbortError"
        ? `Sem resposta em ${TIMEOUT_MS / 1000}s.`
        : err instanceof Error
          ? err.message.slice(0, 300)
          : "Falha ao chamar o SendPulse.";
    if (registro) {
      await admin.from("sendpulse_dispatch_log").update({ status: "falhou", erro: motivo }).eq("id", registro.id);
    }
    return { ok: false, motivo };
  } finally {
    clearTimeout(relogio);
  }
}

/* ---------------- funil 1: boas-vindas ---------------------------- */

export interface BoasVindasInput {
  productId: string;
  email: string;
  /** Telefone que veio na própria compra; se faltar, busca no lead. */
  phone: string | null;
  nome: string | null;
  offerId: string | null;
  offerName: string | null;
}

/**
 * Compra aprovada -> mensagem de boas-vindas do plano alcançado.
 *
 * Não exige contrato assinado: a mensagem de boas-vindas é justamente o
 * empurrão pra pessoa assinar e entrar.
 */
export async function dispararBoasVindas(admin: Admin, input: BoasVindasInput): Promise<ResultadoDisparo> {
  const email = input.email.trim().toLowerCase();
  if (!email) return { ok: false, motivo: "sem e-mail" };

  const plano = resolvePlano(input.offerId, input.offerName);
  const base: EnvioInput = {
    productId: input.productId,
    tipo: "boas_vindas",
    plano,
    email,
    phone: normalizarTelefone(input.phone) || (await telefoneDoLead(admin, input.productId, email)),
    nome: input.nome?.trim() || "",
  };

  const destino = await enderecoDoEvento(admin, input.productId, "boas_vindas", plano);
  if ("desligado" in destino) return { ok: false, motivo: "desligado" };
  if (!destino.url) {
    return registrarFalha(
      admin,
      base,
      plano
        ? `Nenhum endereço configurado para boas-vindas do plano ${plano}, nem endereço geral.`
        : "Compra sem plano identificado e sem endereço geral de boas-vindas configurado."
    );
  }

  if (!base.phone) {
    return registrarFalha(admin, base, "Sem telefone utilizável na compra nem no lead.");
  }

  // A trava vem só agora, depois de já sabermos que dá pra enviar: se
  // faltasse endereço ou telefone e a trava já estivesse tomada, arrumar a
  // configuração depois não faria a mensagem sair nunca mais.
  const { data: travou } = await admin
    .from("sendpulse_boasvindas_sent")
    .upsert(
      { product_id: input.productId, email, plano: plano ?? "" },
      { onConflict: "product_id,email,plano", ignoreDuplicates: true }
    )
    .select("id");

  if (!travou || travou.length === 0) return { ok: false, motivo: "boas-vindas desse plano já enviado" };

  return enviar(admin, base, destino);
}

/* ---------------- funil 2: pós-contrato --------------------------- */

export interface PosContratoInput {
  productId: string;
  email: string;
  /** Telefone que veio na assinatura; se faltar, busca no lead. */
  phone: string | null;
  nome: string | null;
}

/**
 * Contrato assinado -> funil do plano em que a pessoa está.
 *
 * Exige reconhecimento: assinatura sozinha não basta. Qualquer um com o
 * link do contrato consegue assinar, e a ZapSign entrega telefone de quem
 * assina tenha ele comprado ou não — sem essa trava, quem nunca comprou
 * receberia o funil de aluno.
 *
 * A trava de "uma vez por contrato" fica com quem chama: o tracking_event
 * do contrato usa o doc_token como external_id, então reenvio da ZapSign
 * não chega até aqui.
 */
export async function dispararPosContrato(admin: Admin, input: PosContratoInput): Promise<ResultadoDisparo> {
  const email = input.email.trim().toLowerCase();
  if (!email) return { ok: false, motivo: "sem e-mail" };

  const { data: compras } = await admin
    .from("tracking_events")
    .select("offer_name, raw_payload, event_type")
    .eq("product_id", input.productId)
    .eq("email", email)
    .in("event_type", ["purchase", "members_access"])
    .order("occurred_at", { ascending: false })
    .limit(20);

  const reconhecido = (compras ?? []).length > 0;
  const compra = (compras ?? []).find((e) => e.event_type === "purchase") ?? null;

  const plano = compra
    ? resolvePlano(offerIdDoPayload(compra.raw_payload), compra.offer_name)
    : null;

  const base: EnvioInput = {
    productId: input.productId,
    tipo: "contrato",
    plano,
    email,
    phone: normalizarTelefone(input.phone) || (await telefoneDoLead(admin, input.productId, email)),
    nome: input.nome?.trim() || "",
  };

  if (!reconhecido) {
    return registrarFalha(
      admin,
      base,
      "E-mail sem compra na Onprofit e sem acesso em área de membros — assinatura sozinha não autoriza o disparo."
    );
  }

  const destino = await enderecoDoEvento(admin, input.productId, "contrato", plano);
  if ("desligado" in destino) return { ok: false, motivo: "desligado" };
  if (!destino.url) {
    return registrarFalha(
      admin,
      base,
      plano
        ? `Nenhum endereço configurado para o pós-contrato do plano ${plano}, nem endereço geral.`
        : "Assinatura sem plano identificado e sem endereço geral de pós-contrato configurado."
    );
  }

  if (!base.phone) {
    return registrarFalha(admin, base, "Sem telefone utilizável na assinatura nem no lead.");
  }

  return enviar(admin, base, destino);
}

/* ---------------- apoio ------------------------------------------- */

// O lead é a memória de contato do app: o matchLead dos webhooks já grava
// nele o telefone que apareceu em qualquer etapa da jornada, então ele
// cobre o evento que chegou sem telefone.
async function telefoneDoLead(admin: Admin, productId: string, email: string): Promise<string> {
  const { data } = await admin
    .from("tracking_leads")
    .select("phone")
    .eq("product_id", productId)
    .eq("email", email)
    .not("phone", "is", null)
    .order("first_seen_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return normalizarTelefone(data?.phone ?? null);
}

function offerIdDoPayload(payload: Record<string, unknown> | null): string | null {
  if (!payload) return null;
  const produto = payload.product;
  if (typeof produto === "object" && produto !== null) {
    const id = (produto as Record<string, unknown>).id;
    if (typeof id === "number" || (typeof id === "string" && id)) return String(id);
  }
  const direto = payload.product_id;
  if (typeof direto === "number" || (typeof direto === "string" && direto)) return String(direto);
  return null;
}
