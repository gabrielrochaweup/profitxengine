import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Esse endpoint precisa aceitar qualquer origem de propósito: o script de
// tracking (src/app/api/tracking/pixel.js) é feito pra ser colado em
// QUALQUER site que gere tráfego pra um produto, não só um domínio fixo —
// mesmo modelo do Google Analytics/Pixel da Meta. A validação de negócio é
// o product_slug existir, não a origem da chamada.
function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
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
  meta_campaign_id?: string | null;
  utm_id?: string | null;
  ad_id?: string | null;
  adset_id?: string | null;
  placement?: string | null;
  site_source_name?: string | null;
  google_campaign_id?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  landing_url?: string | null;
  referrer?: string | null;
}

function ehOrigemMeta(source: string | null | undefined): boolean {
  return /^(meta|facebook|fb|instagram|ig)$/i.test((source ?? "").trim());
}

export async function POST(request: Request) {
  const headers = corsHeaders();

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
  const { error: leadError } = await admin.from("tracking_leads").upsert(
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
      // "mcid" continua mandando. Sem ele, o utm_id da UTM automática da Meta
      // (= {{campaign.id}}) é o ID da campanha — mas só quando a origem é
      // Meta, porque utm_id é um parâmetro genérico que outros canais usam
      // com outro significado.
      meta_campaign_id: body.meta_campaign_id || (ehOrigemMeta(body.utm_source) ? body.utm_id : null) || null,
      google_campaign_id: body.google_campaign_id || null,
      fbp: body.fbp || null,
      fbc: body.fbc || null,
      landing_url: body.landing_url || null,
      referrer: body.referrer || null,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  if (leadError) {
    console.error("[tracking/collect] falha ao gravar lead:", leadError.message);
    return NextResponse.json({ error: "Falha ao gravar lead." }, { status: 500, headers });
  }

  // external_id fixo por lead reaproveita a constraint única de
  // tracking_events pra não duplicar o page_view se o beacon reenviar.
  const { error: eventError } = await admin.from("tracking_events").upsert(
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

  if (eventError) {
    console.error("[tracking/collect] falha ao gravar evento:", eventError.message);
    return NextResponse.json({ error: "Falha ao gravar evento." }, { status: 500, headers });
  }

  return NextResponse.json({ ok: true }, { headers });
}
