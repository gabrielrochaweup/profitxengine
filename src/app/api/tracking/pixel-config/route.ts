import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Pública (sem sessão) — o pixel.js chama isso no navegador do visitante pra
// saber quais Pixel IDs disparar, de QUALQUER site (mesmo modelo de
// /api/tracking/collect). Nunca devolve o token da API de Conversões (esse
// fica só no servidor, usado no webhook de compra).
function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: Request) {
  const headers = corsHeaders();
  const slug = new URL(request.url).searchParams.get("product");
  if (!slug) return NextResponse.json({ meta: [], google: [], link_rules: [] }, { headers });

  const admin = createAdminClient();
  const { data: product } = await admin.from("products").select("id").eq("slug", slug).maybeSingle();
  if (!product) return NextResponse.json({ meta: [], google: [], link_rules: [] }, { headers });

  const [{ data: pixels }, { data: linkRules }] = await Promise.all([
    admin.from("tracking_pixels").select("platform, pixel_id").eq("product_id", product.id).eq("active", true),
    admin.from("tracking_link_rules").select("match_url, param_name, fire_checkout").eq("product_id", product.id),
  ]);

  return NextResponse.json(
    {
      meta: (pixels ?? []).filter((p) => p.platform === "meta").map((p) => p.pixel_id),
      google: (pixels ?? []).filter((p) => p.platform === "google").map((p) => p.pixel_id),
      link_rules: linkRules ?? [],
    },
    { headers }
  );
}
