import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveWebhookEndpoint } from "@/lib/tracking/webhook-auth";
import { matchLead } from "@/lib/tracking/match-lead";
import { fireMetaEventForProduct } from "@/lib/tracking/fire-meta-event";
import { CHECKOUT_ADAPTERS } from "@/lib/tracking/checkout-adapters";
import { logWebhookCall } from "@/lib/tracking/webhook-log";
import { webhookCorsHeaders } from "@/lib/tracking/cors";
import { dispararBoasVindas, dispararPosContrato } from "@/lib/sendpulse/dispatch";

// O disparo pro SendPulse acontece dentro desta requisição e tem timeout de
// 8s. Somando cold start e as consultas ao banco, o padrão de 10s do Vercel
// mataria a função com o POST em andamento — o webhook devolveria erro e a
// plataforma reenviaria o evento. As travas impedem mensagem duplicada, mas
// o reenvio é trabalho perdido.
export const maxDuration = 30;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: webhookCorsHeaders() });
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const headers = webhookCorsHeaders();

  const resolved = await resolveWebhookEndpoint(params.slug, "checkout", request);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers });
  }
  const { endpoint } = resolved;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400, headers });
  }

  const admin = createAdminClient();
  const isTest = request.headers.get("x-profitx-test") === "1";

  const adapter = endpoint.platform ? CHECKOUT_ADAPTERS[endpoint.platform] : undefined;
  if (!adapter) {
    return NextResponse.json({ error: `Plataforma "${endpoint.platform}" sem adapter configurado.` }, { status: 500, headers });
  }

  const normalized = adapter(raw);
  if (!normalized) {
    // Evento que a plataforma manda mas não é uma compra aprovada (teste,
    // reembolso, etc.) — não é erro, só não vira tracking_event.
    if (!isTest) {
      await logWebhookCall(admin, endpoint.id, raw, false, "Não reconhecido como compra aprovada por esse adapter — ignorado.");
    }
    return NextResponse.json({ ok: true, ignored: true }, { headers });
  }

  // Chamada do botão "Testar" (aba Webhooks) — confirma que o adapter
  // entende o payload e o token bate, sem gravar um evento falso no banco
  // nem poluir o log de chamadas reais.
  if (isTest) {
    return NextResponse.json({ ok: true, tested: true, parsed: normalized }, { headers });
  }

  // Checkout em modo TESTE: recebe e confere, mas não faz nada com o pedido.
  // Não grava a venda (não entra em KPI nem em ROI), não manda Purchase pra
  // Meta, não dispara mensagem pro comprador e não escreve no lead. O que
  // sobra é o diagnóstico no log: o sck chegou? existe um lead com esse ID?
  // É o que decide se o checkout novo está pronto pra virar ativo.
  if (endpoint.modo === "teste") {
    const refRecebido = !!normalized.ref;
    const leadAchado = await matchLead(
      admin,
      { productId: endpoint.product_id, ref: normalized.ref, email: normalized.email, phone: normalized.phone },
      { somenteLeitura: true }
    );
    const valor = normalized.amountCents !== null ? `R$ ${(normalized.amountCents / 100).toFixed(2).replace(".", ",")}` : "sem valor";
    const resumo = [
      `pedido ${normalized.externalId ?? "(sem id)"}`,
      normalized.offerName ?? "sem oferta",
      valor,
      refRecebido ? "sck/ref: chegou" : "sck/ref: NÃO chegou",
      leadAchado
        ? "lead: encontrado"
        : refRecebido
          ? "lead: NÃO encontrado (o sck chegou, mas nenhum lead tem esse ID)"
          : "lead: NÃO encontrado",
    ].join(" · ");
    await logWebhookCall(
      admin,
      endpoint.id,
      raw,
      true,
      `Modo teste — nada foi gravado, enviado à Meta ou disparado. ${resumo}`
    );
    return NextResponse.json(
      { ok: true, modo: "teste", gravado: false, ref_recebido: refRecebido, lead_encontrado: leadAchado !== null },
      { headers }
    );
  }

  await logWebhookCall(admin, endpoint.id, raw, true);

  const leadId = await matchLead(admin, {
    productId: endpoint.product_id,
    ref: normalized.ref,
    email: normalized.email,
    phone: normalized.phone,
  });

  const eventRow = {
    product_id: endpoint.product_id,
    lead_id: leadId,
    event_type: "purchase" as const,
    source: endpoint.platform!,
    email: normalized.email,
    amount_cents: normalized.amountCents,
    external_id: normalized.externalId,
    offer_name: normalized.offerName,
    payment_method: normalized.paymentMethod,
    occurred_at: normalized.occurredAt || new Date().toISOString(),
    raw_payload: raw as Record<string, unknown>,
  };

  // Itens do pedido (migration 0134). Gravados à parte pra que, se a
  // migration ainda não rodou, a venda NÃO se perca: sem as colunas novas o
  // insert falha, e a gente tenta de novo com a linha de sempre (o payload
  // cru, que guarda tudo isso, fica salvo, e a migration preenche depois).
  const gravar = (linha: Record<string, unknown>) =>
    normalized.externalId
      ? admin.from("tracking_events").upsert(linha as typeof eventRow, { onConflict: "source,external_id", ignoreDuplicates: true })
      : admin.from("tracking_events").insert(linha as typeof eventRow);

  let { error } = await gravar({
    ...eventRow,
    item_tipo: normalized.itemType ?? null,
    item_nome: normalized.itemName ?? null,
    pedido_id: normalized.orderId ?? null,
    pedido_total_cents: normalized.orderTotalCents ?? null,
  });
  if (error && /item_tipo|item_nome|pedido_id|pedido_total_cents/.test(error.message)) {
    ({ error } = await gravar(eventRow));
  }

  if (error) {
    return NextResponse.json({ error: "Falha ao gravar evento." }, { status: 500, headers });
  }

  // Compra aprovada dispara os DOIS funis do plano que a pessoa acabou de
  // alcançar. O boas-vindas sempre; o pós-contrato só se ela já tiver
  // assinado antes — é o caso do upgrade, em que o contrato do Starter
  // continua valendo e não há nova assinatura para servir de gatilho.
  //
  // Em paralelo porque são independentes e cada um tem seu timeout: em
  // série, um upgrade seguraria a resposta do webhook o dobro do tempo.
  // Esperados de propósito (em serverless a função pode ser congelada
  // assim que a resposta sai) e nunca derrubam o webhook — falha fica
  // registrada em sendpulse_dispatch_log.
  //
  // Quem compra o Starter e aceita um upsell logo depois recebe as duas
  // mensagens: na hora do Starter o Elite ainda não existe, e aqui se
  // envia na hora. Quem resolve essa sobreposição é o fluxo do SendPulse,
  // removendo o contato do funil menor quando o maior começa.
  await Promise.all([
    dispararBoasVindas(admin, {
      productId: endpoint.product_id,
      email: normalized.email ?? "",
      phone: normalized.phone,
      nome: normalized.name,
      offerId: normalized.offerId,
      offerName: normalized.offerName,
    }).catch(() => null),
    dispararPosContrato(admin, {
      productId: endpoint.product_id,
      email: normalized.email ?? "",
      phone: normalized.phone,
      nome: normalized.name,
    }).catch(() => null),
  ]);

  // Purchase pra API de Conversões da Meta — só se estiver ligado em
  // Tracking > Rastreamento. Fica desligado quando o checkout tem o pixel
  // dele disparando o Purchase: sem event_id em comum, os dois juntos
  // duplicariam a conversão no Gerenciador de Anúncios.
  //
  // Order bump NÃO dispara: o dinheiro dele já está no pagamento do produto
  // principal, e disparar os dois contaria uma compra a mais na Meta (um
  // pedido de R$ 77 + dois bumps de R$ 37 virava 3 compras). O principal
  // (e o upsell/downsell, que é um pagamento próprio) vai com o valor TOTAL
  // do pagamento, não só o do item.
  if (normalized.itemType === "order_bump") {
    return NextResponse.json({ ok: true, matched: leadId !== null, item: "order_bump" }, { headers });
  }
  await fireMetaEventForProduct(admin, endpoint.product_id, "purchase", {
    email: normalized.email,
    phone: normalized.phone,
    amountCents: normalized.orderTotalCents ?? normalized.amountCents,
    currency: "BRL",
    externalId: normalized.externalId,
    occurredAt: eventRow.occurred_at,
    leadId,
  });

  return NextResponse.json({ ok: true, matched: leadId !== null }, { headers });
}
