import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveWebhookEndpoint } from "@/lib/tracking/webhook-auth";
import { matchLead } from "@/lib/tracking/match-lead";
import { CHECKOUT_ADAPTERS } from "@/lib/tracking/checkout-adapters";
import { sendMetaPurchaseEvent } from "@/lib/tracking/meta-capi";
import { decryptSecret } from "@/lib/crypto";
import { logWebhookCall } from "@/lib/tracking/webhook-log";

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const resolved = await resolveWebhookEndpoint(params.slug, "checkout", request);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  const { endpoint } = resolved;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const admin = createAdminClient();
  const isTest = request.headers.get("x-profitx-test") === "1";

  const adapter = endpoint.platform ? CHECKOUT_ADAPTERS[endpoint.platform] : undefined;
  if (!adapter) {
    return NextResponse.json({ error: `Plataforma "${endpoint.platform}" sem adapter configurado.` }, { status: 500 });
  }

  const normalized = adapter(raw);
  if (!normalized) {
    // Evento que a plataforma manda mas não é uma compra aprovada (teste,
    // reembolso, etc.) — não é erro, só não vira tracking_event.
    if (!isTest) {
      await logWebhookCall(admin, endpoint.id, raw, false, "Não reconhecido como compra aprovada por esse adapter — ignorado.");
    }
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Chamada do botão "Testar" (aba Webhooks) — confirma que o adapter
  // entende o payload e o token bate, sem gravar um evento falso no banco
  // nem poluir o log de chamadas reais.
  if (isTest) {
    return NextResponse.json({ ok: true, tested: true, parsed: normalized });
  }

  await logWebhookCall(admin, endpoint.id, raw, true);

  const leadId = await matchLead(admin, { productId: endpoint.product_id, ref: normalized.ref, email: normalized.email });

  const eventRow = {
    product_id: endpoint.product_id,
    lead_id: leadId,
    event_type: "purchase" as const,
    source: endpoint.platform!,
    email: normalized.email,
    amount_cents: normalized.amountCents,
    external_id: normalized.externalId,
    occurred_at: normalized.occurredAt || new Date().toISOString(),
    raw_payload: raw as Record<string, unknown>,
  };

  const { error } = normalized.externalId
    ? await admin.from("tracking_events").upsert(eventRow, { onConflict: "source,external_id", ignoreDuplicates: true })
    : await admin.from("tracking_events").insert(eventRow);

  if (error) {
    return NextResponse.json({ error: "Falha ao gravar evento." }, { status: 500 });
  }

  // Dispara Purchase pra API de Conversões da Meta — best-effort, nunca
  // falha o webhook se isso der errado (a compra já foi gravada acima).
  const { data: metaPixels } = await admin
    .from("tracking_pixels")
    .select("pixel_id, encrypted_capi_token")
    .eq("product_id", endpoint.product_id)
    .eq("platform", "meta")
    .eq("active", true)
    .not("encrypted_capi_token", "is", null);

  for (const pixel of metaPixels ?? []) {
    if (!pixel.encrypted_capi_token) continue;
    try {
      await sendMetaPurchaseEvent({
        pixelId: pixel.pixel_id,
        accessToken: decryptSecret(pixel.encrypted_capi_token),
        email: normalized.email,
        amountCents: normalized.amountCents,
        currency: "BRL",
        externalId: normalized.externalId,
        occurredAt: eventRow.occurred_at,
      });
    } catch {
      // best-effort — não interrompe a resposta do webhook
    }
  }

  return NextResponse.json({ ok: true, matched: leadId !== null });
}
