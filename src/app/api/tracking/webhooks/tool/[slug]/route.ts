import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveWebhookEndpoint } from "@/lib/tracking/webhook-auth";
import { matchLead } from "@/lib/tracking/match-lead";
import { TOOL_ADAPTERS } from "@/lib/tracking/tool-adapters";
import { logWebhookCall } from "@/lib/tracking/webhook-log";
import { webhookCorsHeaders } from "@/lib/tracking/cors";

function ehPingDeTeste(body: Record<string, unknown>): boolean {
  const evento = typeof body.event === "string" ? body.event.trim().toLowerCase() : "";
  const data = body.data && typeof body.data === "object" ? (body.data as Record<string, unknown>) : null;
  return evento === "teste" || evento === "test" || data?.teste === true || data?.test === true;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: webhookCorsHeaders() });
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const headers = webhookCorsHeaders();

  const resolved = await resolveWebhookEndpoint(params.slug, "tool", request);
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

  const adapter = endpoint.platform ? TOOL_ADAPTERS[endpoint.platform] : undefined;
  if (!adapter) {
    return NextResponse.json({ error: `Ferramenta "${endpoint.platform}" sem adapter configurado.` }, { status: 500, headers });
  }

  // Ping de teste da própria ferramenta (o "Testar" do painel dela manda
  // { "event": "teste", "data": { "teste": true } }). Não é cadastro nem
  // acesso e não pode virar evento, mas também não é uma chamada rejeitada:
  // é a prova de que a URL e o token estão certos. Aceita, anota no log e
  // marca a conexão como testada.
  if (ehPingDeTeste(rawBody)) {
    if (!isTest) {
      await logWebhookCall(admin, endpoint.id, rawBody, true, "Teste enviado pela própria ferramenta — conexão ok. Nada foi gravado.");
      await admin
        .from("tracking_webhook_endpoints")
        .update({ last_test_at: new Date().toISOString(), last_test_ok: true })
        .eq("id", endpoint.id);
    }
    return NextResponse.json({ ok: true, tested: true, gravado: false }, { headers });
  }

  const normalized = adapter(raw);
  if (!normalized) {
    // Evento que a ferramenta manda mas não é cadastro nem primeiro acesso
    // (mudança de status, acesso recorrente, teste) — não é erro, só não
    // vira tracking_event.
    if (!isTest) {
      await logWebhookCall(admin, endpoint.id, rawBody, false, "Não reconhecido como cadastro ou primeiro acesso por esse adapter — ignorado.");
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
    event_type: normalized.kind,
    source: endpoint.platform!,
    email: normalized.email,
    external_id: normalized.externalId,
    occurred_at: normalized.occurredAt || new Date().toISOString(),
    raw_payload: rawBody,
  };

  // O id do evento vindo da ferramenta é único por webhook, então reenvio
  // não vira um segundo cadastro na contagem.
  const { error } = normalized.externalId
    ? await admin.from("tracking_events").upsert(eventRow, { onConflict: "source,external_id", ignoreDuplicates: true })
    : await admin.from("tracking_events").insert(eventRow);

  if (error) {
    return NextResponse.json({ error: "Falha ao gravar evento." }, { status: 500, headers });
  }

  return NextResponse.json({ ok: true, matched: leadId !== null }, { headers });
}
