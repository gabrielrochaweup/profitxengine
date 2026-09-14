import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlano, planoMaior, type Plano } from "./planos";
import { sendpulseKey } from "./config-keys";

/* ==================================================================
   SendPulse — motor único de decisão dos funis de WhatsApp.

   São dois funis independentes, e os dois travam por PLANO ALCANÇADO:

     boas-vindas  · dispara na compra
                  · não depende de contrato assinado

     contrato     · dispara na assinatura E também no upgrade
                  · exige contrato já assinado alguma vez, e a pessoa
                    reconhecida por compra ou área de membros

   O contrato do Método TRIAD é um só para os três planos: quem assina no
   Starter e depois sobe para o Pro não assina de novo. Por isso o funil
   pós-contrato não pode ficar preso ao documento — ele acompanha o plano
   atual, usando a assinatura antiga como autorização. Um upgrade dispara
   os dois funis do plano novo.

   A trava dos dois é a mesma tabela (sendpulse_funil_enviado), por
   (tipo, email, plano): Starter -> Pro -> Elite rende até 3 mensagens de
   cada funil ao longo da vida do aluno, e nenhuma repetida.

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
  /** Disparo pelo botão de teste do painel — vai marcado no log. */
  teste?: boolean;
}

async function registrarFalha(
  admin: Admin,
  { productId, tipo, plano, email, phone, teste }: EnvioInput,
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
    teste: teste === true,
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
  const { productId, tipo, plano, email, phone, nome, teste } = input;

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
      teste: teste === true,
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
 * Compra aprovada -> agenda a mensagem de boas-vindas do plano alcançado.
 *
 * Não exige contrato assinado: a mensagem de boas-vindas é justamente o
 * empurrão pra pessoa assinar e entrar.
 */
export async function dispararBoasVindas(admin: Admin, input: BoasVindasInput): Promise<ResultadoDisparo> {
  const email = input.email.trim().toLowerCase();
  if (!email) return { ok: false, motivo: "sem e-mail" };

  return agendar(admin, {
    productId: input.productId,
    tipo: "boas_vindas",
    email,
    plano: resolvePlano(input.offerId, input.offerName),
    phone: normalizarTelefone(input.phone),
    nome: input.nome?.trim() || "",
  });
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
 * Funil pós-contrato do plano ATUAL da pessoa.
 *
 * Chamado nos dois gatilhos: quando a assinatura chega e quando uma compra
 * muda o plano. O contrato é um só para os três planos — quem assinou no
 * Starter e subiu para o Pro não assina de novo —, então a assinatura
 * antiga autoriza o funil do plano novo.
 *
 * Duas condições, e cada uma protege de uma coisa diferente:
 *
 *  - assinou alguma vez: é o que este funil comunica. Sem contrato, quem
 *    só comprou recebe boas-vindas e mais nada.
 *  - reconhecido por compra ou área de membros: qualquer um com o link do
 *    contrato consegue assinar, e a ZapSign entrega o telefone de quem
 *    assina tenha ele comprado ou não.
 */
export async function dispararPosContrato(admin: Admin, input: PosContratoInput): Promise<ResultadoDisparo> {
  const email = input.email.trim().toLowerCase();
  if (!email) return { ok: false, motivo: "sem e-mail" };

  const { data: eventos } = await admin
    .from("tracking_events")
    .select("offer_name, raw_payload, event_type")
    .eq("product_id", input.productId)
    .eq("email", email)
    .in("event_type", ["purchase", "members_access", "contract_signed"])
    .order("occurred_at", { ascending: false })
    .limit(30);

  const assinou = (eventos ?? []).some((e) => e.event_type === "contract_signed");
  const reconhecido = (eventos ?? []).some(
    (e) => e.event_type === "purchase" || e.event_type === "members_access"
  );
  const compra = (eventos ?? []).find((e) => e.event_type === "purchase") ?? null;

  // Sem contrato não é erro nem falha: é o caso normal de quem acabou de
  // comprar e ainda não assinou. Sai quieto, sem sujar o log — o funil
  // dele vai sair quando a assinatura chegar.
  if (!assinou) return { ok: false, motivo: "ainda sem contrato assinado" };

  const plano = compra
    ? resolvePlano(offerIdDoPayload(compra.raw_payload), compra.offer_name)
    : null;

  if (!reconhecido) {
    return registrarFalha(
      admin,
      {
        productId: input.productId,
        tipo: "contrato",
        plano,
        email,
        phone: normalizarTelefone(input.phone),
        nome: input.nome?.trim() || "",
      },
      "E-mail sem compra na Onprofit e sem acesso em área de membros — assinatura sozinha não autoriza o disparo."
    );
  }

  return agendar(admin, {
    productId: input.productId,
    tipo: "contrato",
    email,
    plano,
    phone: normalizarTelefone(input.phone),
    nome: input.nome?.trim() || "",
  });
}

/* ---------------- carência (fila) --------------------------------- */

/**
 * Quanto a mensagem espera antes de sair.
 *
 * Existe por causa do upsell: quem compra o Starter e aceita o Elite dois
 * minutos depois receberia duas boas-vindas seguidas, porque na hora do
 * Starter o Elite ainda não existe. Esperando um pouco, a segunda compra
 * alcança o agendamento e só sai a mensagem do maior plano.
 *
 * Cinco minutos cobre o upsell (que acontece no mesmo checkout) sem
 * segurar demais quem comprou e não vai comprar mais nada.
 */
const CARENCIA_MIN = 5;

interface AgendarInput {
  productId: string;
  tipo: TipoFunil;
  email: string;
  plano: Plano | null;
  phone: string;
  nome: string;
}

/**
 * Coloca o funil na fila, ou promove o plano de um agendamento que já
 * existe.
 *
 * A chave única é (produto, tipo, e-mail) — sem o plano —, então a segunda
 * compra cai no mesmo agendamento em vez de criar outro. O prazo original
 * é mantido na promoção: renovar a cada compra empurraria a mensagem pra
 * frente enquanto a pessoa continuasse comprando.
 */
async function agendar(admin: Admin, input: AgendarInput): Promise<ResultadoDisparo> {
  const enviarEm = new Date(Date.now() + CARENCIA_MIN * 60_000).toISOString();

  const { data: inserido } = await admin
    .from("sendpulse_pendente")
    .upsert(
      {
        product_id: input.productId,
        tipo: input.tipo,
        email: input.email,
        plano: input.plano ?? "",
        phone: input.phone,
        nome: input.nome,
        enviar_em: enviarEm,
      },
      { onConflict: "product_id,tipo,email", ignoreDuplicates: true }
    )
    .select("id");

  if ((inserido?.length ?? 0) > 0) {
    return { ok: true, motivo: `agendado para daqui a ${CARENCIA_MIN} min` };
  }

  // Já havia agendamento: só interessa se este plano for maior.
  const { data: atual } = await admin
    .from("sendpulse_pendente")
    .select("id, plano, phone, nome")
    .eq("product_id", input.productId)
    .eq("tipo", input.tipo)
    .eq("email", input.email)
    .maybeSingle();

  if (!atual) return { ok: false, motivo: "não foi possível agendar" };

  const maior = planoMaior((atual.plano || null) as Plano | null, input.plano);
  if (maior === atual.plano) {
    // Mantém o que já estava, mas aproveita para preencher o que faltava:
    // a compra costuma trazer telefone que a assinatura não tinha.
    const faltando: { phone?: string; nome?: string } = {};
    if (!atual.phone && input.phone) faltando.phone = input.phone;
    if (!atual.nome && input.nome) faltando.nome = input.nome;
    if (faltando.phone !== undefined || faltando.nome !== undefined) {
      await admin.from("sendpulse_pendente").update(faltando).eq("id", atual.id);
    }
    return { ok: true, motivo: "já agendado, plano mantido" };
  }

  await admin
    .from("sendpulse_pendente")
    .update({
      plano: maior ?? "",
      phone: input.phone || atual.phone,
      nome: input.nome || atual.nome,
    })
    .eq("id", atual.id);

  return { ok: true, motivo: `agendamento promovido para ${maior}` };
}

/**
 * Manda o que já venceu a carência. Chamado pelo cron e também no começo
 * dos webhooks — assim, mesmo que o cron falhe, o movimento normal da
 * operação vai escoando a fila.
 */
export async function processarPendentes(admin: Admin, limite = 50): Promise<{ processados: number }> {
  const { data: vencidos } = await admin
    .from("sendpulse_pendente")
    .select("id, product_id, tipo, email, plano, phone, nome")
    .lte("enviar_em", new Date().toISOString())
    .limit(limite);

  if (!vencidos || vencidos.length === 0) return { processados: 0 };

  for (const item of vencidos) {
    // Sai da fila antes de tentar enviar: se a linha continuasse aqui e o
    // envio demorasse, a execução seguinte do cron pegaria o mesmo item e
    // mandaria duas vezes. A trava por plano ainda protege, mas é melhor
    // não depender dela para isso.
    await admin.from("sendpulse_pendente").delete().eq("id", item.id);

    const plano = (item.plano || null) as Plano | null;
    const base: EnvioInput = {
      productId: item.product_id,
      tipo: item.tipo,
      plano,
      email: item.email,
      phone: item.phone || (await telefoneDoLead(admin, item.product_id, item.email)),
      nome: item.nome,
    };

    const destino = await enderecoDoEvento(admin, item.product_id, item.tipo, plano);
    if ("desligado" in destino) continue;

    if (!destino.url) {
      const funil = item.tipo === "boas_vindas" ? "boas-vindas" : "pós-contrato";
      await registrarFalha(
        admin,
        base,
        plano
          ? `Nenhum endereço configurado para ${funil} do plano ${plano}, nem endereço geral.`
          : `Sem plano identificado e sem endereço geral de ${funil} configurado.`
      );
      continue;
    }

    if (!base.phone) {
      await registrarFalha(admin, base, "Sem telefone utilizável na compra, na assinatura nem no lead.");
      continue;
    }

    // A trava só é tomada aqui, quando o envio vai mesmo acontecer: se
    // faltasse endereço ou telefone e ela já estivesse tomada, arrumar a
    // configuração depois não faria a mensagem sair nunca mais.
    if (!(await travar(admin, item.product_id, item.tipo, item.email, plano))) continue;

    await enviar(admin, base, destino);
  }

  return { processados: vencidos.length };
}

/* ---------------- teste manual ------------------------------------ */

export interface TesteInput {
  productId: string;
  tipo: TipoFunil;
  /** null = descobrir pela última compra desse e-mail. */
  plano: Plano | null;
  email: string;
  phone: string | null;
  nome: string | null;
}

/**
 * Dispara de verdade, pelo botão do painel, para conferir a ligação com o
 * SendPulse sem precisar comprar o curso de novo.
 *
 * Passa por cima das duas travas de propósito, e é por isso que ele existe
 * separado em vez de reaproveitar os disparos normais:
 *
 *  - O reconhecimento (compra/acesso) ficaria no caminho de um e-mail
 *    inventado só para o teste.
 *  - A trava do boas-vindas é por (e-mail, plano) e vale uma vez na vida.
 *    Se o teste passasse por ela, testar com o e-mail de um aluno real
 *    queimaria a mensagem de verdade dele, e testar duas vezes seguidas
 *    não funcionaria.
 *
 * Em troca, fica marcado como teste no log — some dos contadores e não
 * deixa ninguém em dúvida depois se aquele envio foi real.
 */
export async function dispararTeste(admin: Admin, input: TesteInput): Promise<ResultadoDisparo> {
  const email = input.email.trim().toLowerCase();
  if (!email) return { ok: false, motivo: "Informe um e-mail." };

  let plano = input.plano;
  if (!plano) {
    const { data: compra } = await admin
      .from("tracking_events")
      .select("offer_name, raw_payload")
      .eq("product_id", input.productId)
      .eq("email", email)
      .eq("event_type", "purchase")
      .order("occurred_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    plano = compra ? resolvePlano(offerIdDoPayload(compra.raw_payload), compra.offer_name) : null;
  }

  const base: EnvioInput = {
    productId: input.productId,
    tipo: input.tipo,
    plano,
    email,
    phone: normalizarTelefone(input.phone) || (await telefoneDoLead(admin, input.productId, email)),
    nome: input.nome?.trim() || "",
    teste: true,
  };

  const destino = await enderecoDoEvento(admin, input.productId, input.tipo, plano);
  if ("desligado" in destino) {
    return registrarFalha(admin, base, "A linha desse plano está desligada no painel.");
  }
  if (!destino.url) {
    return registrarFalha(
      admin,
      base,
      plano
        ? `Nenhum endereço configurado para esse funil no plano ${plano}, nem endereço geral.`
        : "Plano não identificado e sem endereço geral configurado para esse funil."
    );
  }
  if (!base.phone) {
    return registrarFalha(
      admin,
      base,
      "Sem telefone: informe um no teste ou use um e-mail que já tenha telefone registrado."
    );
  }

  return enviar(admin, base, destino);
}

/* ---------------- apoio ------------------------------------------- */

/**
 * Pega o direito de mandar este funil para este plano, uma vez só.
 *
 * O INSERT é a trava: quem conseguir gravar a linha dispara, quem esbarrar
 * na chave única não. Isso vale tanto para reenvio da plataforma quanto
 * para dois eventos chegando ao mesmo tempo — o banco resolve.
 */
async function travar(
  admin: Admin,
  productId: string,
  tipo: TipoFunil,
  email: string,
  plano: Plano | null
): Promise<boolean> {
  const { data } = await admin
    .from("sendpulse_funil_enviado")
    .upsert(
      { product_id: productId, tipo, email, plano: plano ?? "" },
      { onConflict: "product_id,tipo,email,plano", ignoreDuplicates: true }
    )
    .select("id");

  return (data?.length ?? 0) > 0;
}

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
