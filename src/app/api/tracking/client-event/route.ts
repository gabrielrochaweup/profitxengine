import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ehRobo } from "@/lib/tracking/robos";

// Pública, aberta pra qualquer origem — o script de rastreamento (mesmo
// modelo de /api/tracking/collect) dispara isso via navigator.sendBeacon()
// no clique de um link de checkout, de QUALQUER site que tenha o pixel
// instalado. Só aceita "initiate_checkout" por enquanto — cada novo tipo
// de evento client-side precisa ser adicionado aqui de propósito, não é
// um endpoint genérico de "grava qualquer coisa".
//
// IMPORTANTE: diferente de /collect (fetch comum), sendBeacon() manda
// cookies (credentials: include) em chamada entre origens diferentes —
// e a Fetch/CORS spec proíbe "Access-Control-Allow-Origin: *" quando tem
// credenciais (o navegador bloqueia a resposta inteira). Por isso aqui o
// header ecoa a origem exata que chamou, em vez de usar "*" fixo, e soma
// "Access-Control-Allow-Credentials: true" — não reduz segurança porque
// esse endpoint não usa cookie/sessão pra nada, só responde igual pra
// qualquer origem.
function corsHeaders(request: Request): HeadersInit {
  return {
    "Access-Control-Allow-Origin": request.headers.get("origin") ?? "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

interface ClientEventPayload {
  lead_id?: string;
  product_slug?: string;
  event_type?: string;
}

export async function POST(request: Request) {
  const headers = corsHeaders(request);

  // Robô não inicia checkout (ver lib/tracking/robos.ts).
  if (ehRobo(request.headers.get("user-agent"))) {
    return NextResponse.json({ ok: true, ignored: "robo" }, { headers });
  }

  let body: ClientEventPayload;
  try {
    // sendBeacon manda o corpo como Blob "application/json" — mesmo POST
    // JSON de sempre, só chega sem alguns headers que um fetch normal teria.
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400, headers });
  }

  const leadId = body.lead_id?.trim();
  const productSlug = body.product_slug?.trim();

  if (!leadId || !productSlug || body.event_type !== "initiate_checkout") {
    return NextResponse.json({ error: "lead_id, product_slug e event_type válido são obrigatórios." }, { status: 400, headers });
  }

  const admin = createAdminClient();

  const { data: product } = await admin.from("products").select("id").eq("slug", productSlug).maybeSingle();
  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404, headers });
  }

  // Um por lead, idempotente — clicar duas vezes no link de checkout não
  // conta duas vezes no funil.
  const { error } = await admin.from("tracking_events").upsert(
    {
      product_id: product.id,
      lead_id: leadId,
      event_type: "initiate_checkout" as const,
      source: "landing",
      external_id: `initiate_checkout:${leadId}`,
    },
    { onConflict: "source,external_id", ignoreDuplicates: true }
  );

  if (error) {
    return NextResponse.json({ error: "Falha ao gravar evento." }, { status: 500, headers });
  }

  return NextResponse.json({ ok: true }, { headers });
}
