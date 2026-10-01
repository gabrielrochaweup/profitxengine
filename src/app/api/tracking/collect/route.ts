import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ehRobo } from "@/lib/tracking/robos";
import { normalizarPagina } from "@/lib/tracking/paginas";

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
  /** Segunda chamada, depois do pixel carregar: só completa fbp/fbc do lead. */
  completar_ids_meta?: boolean;
}

// IP de quem chamou, atrás do proxy (VPS/Vercel). Só o primeiro da lista:
// os seguintes são os proxies do caminho.
function ipDoCliente(request: Request): string | null {
  const encaminhado = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return encaminhado || request.headers.get("x-real-ip")?.trim() || null;
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

  // Robô (ex: a Meta conferindo a página do anúncio) não vira lead nem
  // visita. Responde 200 pra ele não ficar tentando de novo.
  if (ehRobo(request.headers.get("user-agent"))) {
    return NextResponse.json({ ok: true, ignored: "robo" }, { headers });
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

  // O pixel da Meta só cria os cookies _fbp/_fbc quando termina de carregar,
  // DEPOIS da primeira chamada daqui — na 1ª visita eles chegam vazios. O
  // script volta com eles; aqui só PREENCHE o que está vazio, nunca troca um
  // valor que já existe.
  if (body.completar_ids_meta) {
    if (body.fbp) {
      await admin.from("tracking_leads").update({ fbp: body.fbp }).eq("id", leadId).eq("product_id", product.id).is("fbp", null);
    }
    if (body.fbc) {
      await admin.from("tracking_leads").update({ fbc: body.fbc }).eq("id", leadId).eq("product_id", product.id).is("fbc", null);
    }
    return NextResponse.json({ ok: true }, { headers });
  }

  // ignoreDuplicates: o primeiro clique é quem vale — se esse lead_id já
  // existe, não sobrescreve a origem original.
  const lead = {
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
    // Pra API de Conversões mandar Purchase/Deposit como evento "website"
    // (ver lib/tracking/meta-capi.ts).
    client_user_agent: request.headers.get("user-agent")?.slice(0, 500) || null,
    client_ip: ipDoCliente(request),
  };
  let { error: leadError } = await admin
    .from("tracking_leads")
    .upsert(lead, { onConflict: "id", ignoreDuplicates: true });

  // Antes da migration 0124 essas duas colunas não existem: grava o lead sem
  // elas em vez de perder a visita.
  if (leadError && /client_user_agent|client_ip/.test(leadError.message)) {
    const semNavegador: Partial<typeof lead> = { ...lead };
    delete semNavegador.client_user_agent;
    delete semNavegador.client_ip;
    ({ error: leadError } = await admin
      .from("tracking_leads")
      .upsert(semNavegador as typeof lead, { onConflict: "id", ignoreDuplicates: true }));
  }

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

  // Visita por página (Performance → Páginas). O script chama o collect a
  // TODA abertura: o lead e o page_view acima só existem uma vez (os upserts
  // ignoram repetição), mas aqui cada página ganha a própria linha por
  // pessoa, com a origem daquela chegada, e as aberturas seguintes somam.
  // Best-effort: antes da migration 0125 a função não existe, e isso não
  // pode derrubar o registro do lead.
  const pagina = normalizarPagina(body.landing_url);
  if (pagina) {
    const { error: visitaError } = await admin.rpc("tracking_registrar_visita", {
      p_product_id: product.id,
      p_lead_id: leadId,
      p_pagina: pagina,
      p_utm_source: body.utm_source || null,
      p_utm_medium: body.utm_medium || null,
      p_utm_campaign: body.utm_campaign || null,
      p_utm_content: body.utm_content || null,
      p_referrer: body.referrer || null,
    });
    if (visitaError && !/tracking_registrar_visita/.test(visitaError.message)) {
      console.error("[tracking/collect] falha ao gravar visita:", visitaError.message);
    }
  }

  return NextResponse.json({ ok: true }, { headers });
}
