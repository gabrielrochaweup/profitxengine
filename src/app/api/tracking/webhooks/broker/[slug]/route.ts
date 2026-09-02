import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveWebhookEndpoint } from "@/lib/tracking/webhook-auth";
import { matchLead } from "@/lib/tracking/match-lead";
import { BROKER_ADAPTERS } from "@/lib/tracking/broker-adapters";
import { logWebhookCall } from "@/lib/tracking/webhook-log";
import { webhookCorsHeaders } from "@/lib/tracking/cors";
import { fireMetaEventForProduct } from "@/lib/tracking/fire-meta-event";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: webhookCorsHeaders() });
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const headers = webhookCorsHeaders();

  const resolved = await resolveWebhookEndpoint(params.slug, "broker", request);
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
  const rawBody = raw as Record<string, unknown>;

  const adapter = BROKER_ADAPTERS[endpoint.platform ?? "generic"] ?? BROKER_ADAPTERS.generic;
  const normalized = adapter(raw);

  if (!normalized) {
    // Evento que a corretora manda mas não reconhecemos ainda (outro tipo
    // de evento, teste de conectividade, etc.) — não é erro, só ignorado.
    if (!isTest) {
      await logWebhookCall(admin, endpoint.id, rawBody, false, "Não reconhecido por esse adapter — ignorado.");
    }
    return NextResponse.json({ ok: true, ignored: true }, { headers });
  }

  // Chamada do botão "Testar" (aba Webhooks) — confirma que o adapter
  // entende o payload e o token bate, sem gravar um evento falso no banco
  // nem poluir o log de chamadas reais.
  if (isTest) {
    return NextResponse.json({ ok: true, tested: true, parsed: normalized }, { headers });
  }

  await logWebhookCall(admin, endpoint.id, rawBody, true);

  const leadId = await matchLead(admin, {
    productId: endpoint.product_id,
    ref: normalized.ref,
    email: normalized.email,
    phone: normalized.phone,
  });

  const eventRow = {
    product_id: endpoint.product_id,
    lead_id: leadId,
    event_type: normalized.eventType,
    source: endpoint.platform ?? "broker",
    email: normalized.email,
    amount_cents: normalized.amountCents,
    external_id: normalized.externalId,
    occurred_at: normalized.occurredAt || new Date().toISOString(),
    raw_payload: rawBody,
    ...(normalized.currency ? { currency: normalized.currency } : {}),
  };

  const { error } = normalized.externalId
    ? await admin.from("tracking_events").upsert(eventRow, { onConflict: "source,external_id", ignoreDuplicates: true })
    : await admin.from("tracking_events").insert(eventRow);

  if (error) {
    return NextResponse.json({ error: "Falha ao gravar evento." }, { status: 500, headers });
  }

  // Depósito é o evento que mais importa pro negócio (mais do que a compra
  // do curso) — manda pra API de Conversões da Meta como um evento
  // customizado "Deposit", pro algoritmo de anúncio otimizar pra isso, não
  // só pra quem compra o curso. Best-effort, nunca falha o webhook.
  if (normalized.eventType === "broker_deposit") {
    await fireMetaEventForProduct(admin, endpoint.product_id, {
      eventName: "Deposit",
      email: normalized.email,
      amountCents: normalized.amountCents,
      currency: normalized.currency ?? "BRL",
      externalId: normalized.externalId,
      occurredAt: eventRow.occurred_at,
    });
  }

  return NextResponse.json({ ok: true, matched: leadId !== null }, { headers });
}
