import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveWebhookEndpoint } from "@/lib/tracking/webhook-auth";
import { matchLead } from "@/lib/tracking/match-lead";

// Contrato combinado com o time de dev da área de membros:
// { "event": "first_login", "email": "...", "ref": "<lead_id ou null>",
//   "external_id": "<id do aluno na área de membros>",
//   "occurred_at": "2026-08-26T12:00:00Z" }
interface MembersAreaPayload {
  event?: string;
  email?: string | null;
  ref?: string | null;
  external_id?: string | null;
  occurred_at?: string | null;
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const resolved = await resolveWebhookEndpoint(params.slug, "members_area", request.headers.get("authorization"));
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  const { endpoint } = resolved;

  let body: MembersAreaPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (body.event !== "first_login") {
    return NextResponse.json({ error: "event deve ser 'first_login'." }, { status: 400 });
  }

  const admin = createAdminClient();
  const leadId = await matchLead(admin, { productId: endpoint.product_id, ref: body.ref, email: body.email });

  const eventRow = {
    product_id: endpoint.product_id,
    lead_id: leadId,
    event_type: "members_access" as const,
    source: "members_area",
    email: body.email || null,
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
