import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveWebhookEndpoint } from "@/lib/tracking/webhook-auth";
import { matchLead } from "@/lib/tracking/match-lead";
import { CONTRACT_ADAPTERS } from "@/lib/tracking/contract-adapters";
import { logWebhookCall } from "@/lib/tracking/webhook-log";
import { webhookCorsHeaders } from "@/lib/tracking/cors";
import { dispararPosContrato, processarPendentes } from "@/lib/sendpulse/dispatch";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: webhookCorsHeaders() });
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const headers = webhookCorsHeaders();

  const resolved = await resolveWebhookEndpoint(params.slug, "contract", request);
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

  const adapter = endpoint.platform ? CONTRACT_ADAPTERS[endpoint.platform] : undefined;
  if (!adapter) {
    return NextResponse.json({ error: `Origem "${endpoint.platform}" sem adapter configurado.` }, { status: 500, headers });
  }

  const normalized = adapter(raw);
  if (!normalized) {
    // Evento que a origem manda mas não é "contrato assinado" (documento
    // ainda pendente, teste, etc.) — não é erro, só não vira tracking_event.
    if (!isTest) {
      await logWebhookCall(admin, endpoint.id, rawBody, false, "Não reconhecido como contrato assinado por esse adapter — ignorado.");
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
    event_type: "contract_signed" as const,
    source: endpoint.platform!,
    email: normalized.email,
    external_id: normalized.externalId,
    occurred_at: normalized.occurredAt || new Date().toISOString(),
    raw_payload: rawBody,
  };

  // A ZapSign reenvia o mesmo evento quando não recebe confirmação, e o
  // Vortex repassa cada um deles — o doc_token em external_id é o que faz
  // o reenvio virar no-op em vez de um segundo contrato assinado.
  const { error } = normalized.externalId
    ? await admin.from("tracking_events").upsert(eventRow, { onConflict: "source,external_id", ignoreDuplicates: true })
    : await admin.from("tracking_events").insert(eventRow);

  if (error) {
    return NextResponse.json({ error: "Falha ao gravar evento." }, { status: 500, headers });
  }

  // Agenda sempre, sem olhar se a gravação acima era inédita: quem trava a
  // repetição é a trava por (funil, e-mail, plano), tomada só na hora do
  // envio. Se a primeira tentativa falhar por configuração — endereço
  // ainda não colado no painel, por exemplo —, o reenvio da ZapSign vira
  // uma segunda chance em vez de bater numa porta fechada.
  //
  // Passa pela carência como a compra: quem assina e aceita um upsell logo
  // depois recebe um pós-contrato só, já do plano maior.
  //
  // Nunca derruba o webhook — falha fica em sendpulse_dispatch_log.
  await Promise.all([
    dispararPosContrato(admin, {
      productId: endpoint.product_id,
      email: normalized.email!,
      phone: normalized.phone,
      nome: normalized.name,
    }).catch(() => null),
    processarPendentes(admin).catch(() => null),
  ]);

  return NextResponse.json({ ok: true, matched: leadId !== null }, { headers });
}
