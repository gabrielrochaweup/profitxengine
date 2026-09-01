import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveWebhookEndpoint } from "@/lib/tracking/webhook-auth";
import { matchLead } from "@/lib/tracking/match-lead";

// Contrato combinado com o time de dev da corretora:
// { "event": "account_created" | "deposit", "email": "...",
//   "ref": "<lead_id ou null>", "external_id": "<id da conta ou do depósito>",
//   "amount_cents": 45000, "occurred_at": "2026-08-26T12:00:00Z" }
interface BrokerPayload {
  event?: string;
  email?: string | null;
  ref?: string | null;
  external_id?: string | null;
  amount_cents?: number | null;
  occurred_at?: string | null;
}

const EVENT_MAP: Record<string, "broker_signup" | "broker_deposit"> = {
  account_created: "broker_signup",
  deposit: "broker_deposit",
};

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const resolved = await resolveWebhookEndpoint(params.slug, "broker", request);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  const { endpoint } = resolved;

  let body: BrokerPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const eventType = body.event ? EVENT_MAP[body.event] : undefined;
  if (!eventType) {
    return NextResponse.json({ error: "event deve ser 'account_created' ou 'deposit'." }, { status: 400 });
  }

  // Chamada do botão "Testar" (aba Webhooks) — confirma que o formato e o
  // token batem, sem gravar um evento falso no banco.
  if (request.headers.get("x-profitx-test") === "1") {
    return NextResponse.json({ ok: true, tested: true });
  }

  const admin = createAdminClient();
  const leadId = await matchLead(admin, { productId: endpoint.product_id, ref: body.ref, email: body.email });

  const eventRow = {
    product_id: endpoint.product_id,
    lead_id: leadId,
    event_type: eventType,
    source: "broker",
    email: body.email || null,
    amount_cents: typeof body.amount_cents === "number" ? body.amount_cents : null,
    external_id: body.external_id || null,
    occurred_at: body.occurred_at || new Date().toISOString(),
    raw_payload: body as unknown as Record<string, unknown>,
  };

  const { error } = body.external_id
    ? await admin.from("tracking_events").upsert(eventRow, { onConflict: "source,external_id", ignoreDuplicates: true })
    : await admin.from("tracking_events").insert(eventRow);

  if (error) {
    return NextResponse.json({ error: "Falha ao gravar evento." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, matched: leadId !== null });
}
