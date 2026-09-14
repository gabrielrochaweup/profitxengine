import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveWebhookEndpoint } from "@/lib/tracking/webhook-auth";
import { matchLead } from "@/lib/tracking/match-lead";
import { CHECKOUT_ADAPTERS } from "@/lib/tracking/checkout-adapters";
import { logWebhookCall } from "@/lib/tracking/webhook-log";
import { webhookCorsHeaders } from "@/lib/tracking/cors";
import { dispararBoasVindas, dispararPosContrato } from "@/lib/sendpulse/dispatch";

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

  const { error } = normalized.externalId
    ? await admin.from("tracking_events").upsert(eventRow, { onConflict: "source,external_id", ignoreDuplicates: true })
    : await admin.from("tracking_events").insert(eventRow);

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

  // Não reenvia Purchase pra API de Conversões da Meta aqui: a própria
  // plataforma de checkout (Onprofit etc.) já tem o pixel dela configurada
  // e manda esse evento direto, sem event_id em comum com o nosso — se
  // mandássemos de novo, duplicaria a conversão no Ads Manager. Só o
  // Deposit (webhooks/broker) é enviado por nós, pois a corretora não tem
  // pixel de anúncio nenhum.

  return NextResponse.json({ ok: true, matched: leadId !== null }, { headers });
}
