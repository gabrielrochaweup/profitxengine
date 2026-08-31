import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Origens autorizadas a chamar esse endpoint público (a landing page, em
// PT e no futuro qualquer outro domínio de landing do grupo). Sem sessão de
// usuário — é chamado direto do navegador de quem só está visitando o site,
// então a única defesa aqui é CORS + validação de payload, não autenticação.
const ALLOWED_ORIGINS = new Set([
  "https://escolaprofitx.com",
  "https://www.escolaprofitx.com",
]);

function corsHeaders(origin: string | null): HeadersInit {
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://escolaprofitx.com";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}

interface CollectPayload {
  lead_id?: string;
  product_slug?: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  fbclid?: string | null;
  gclid?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  landing_url?: string | null;
  referrer?: string | null;
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  let body: CollectPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400, headers });
  }

  const leadId = body.lead_id?.trim();
  const productSlug = body.product_slug?.trim();
  if (!leadId || !productSlug) {
    return NextResponse.json({ error: "lead_id e product_slug são obrigatórios." }, { status: 400, headers });
  }

  const admin = createAdminClient();

  const { data: product } = await admin.from("products").select("id").eq("slug", productSlug).maybeSingle();
  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404, headers });
  }

  // ignoreDuplicates: o primeiro clique é quem vale — se esse lead_id já
  // existe, não sobrescreve a origem original.
  await admin
    .from("tracking_leads")
    .upsert(
      {
        id: leadId,
        product_id: product.id,
        utm_source: body.utm_source || null,
        utm_medium: body.utm_medium || null,
        utm_campaign: body.utm_campaign || null,
        utm_content: body.utm_content || null,
        utm_term: body.utm_term || null,
        fbclid: body.fbclid || null,
        gclid: body.gclid || null,
        fbp: body.fbp || null,
        fbc: body.fbc || null,
        landing_url: body.landing_url || null,
        referrer: body.referrer || null,
      },
      { onConflict: "id", ignoreDuplicates: true }
    );

  // external_id fixo por lead reaproveita a constraint única de
  // tracking_events pra não duplicar o page_view se o beacon reenviar.
  await admin.from("tracking_events").upsert(
    {
      product_id: product.id,
      lead_id: leadId,
      event_type: "page_view",
      source: "landing",
      external_id: `page_view:${leadId}`,
      raw_payload: body as unknown as Record<string, unknown>,
    },
    { onConflict: "source,external_id", ignoreDuplicates: true }
  );

  return NextResponse.json({ ok: true }, { headers });
}
