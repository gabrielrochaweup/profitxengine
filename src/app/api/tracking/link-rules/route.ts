import { NextResponse } from "next/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Registra qual URL deve ser tratada como link de rastreio — é isso que
// permite colar o link PURO (sem código, sem classe CSS) em qualquer botão
// de qualquer builder: o pixel.js busca essa lista e reconhece o clique
// sozinho. Ver src/app/api/tracking/pixel-config/route.ts (devolve a lista
// pro script) e src/app/api/tracking/pixel.js/route.ts (usa a lista).
function normalizeMatchUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    return u.origin + u.pathname;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "editor")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const productSlug = new URL(request.url).searchParams.get("product_slug");
  if (!productSlug) return NextResponse.json({ error: "product_slug é obrigatório." }, { status: 400 });

  const admin = createAdminClient();
  const { data: product } = await admin.from("products").select("id").eq("slug", productSlug).maybeSingle();
  if (!product) return NextResponse.json({ rules: [] });

  const { data } = await admin
    .from("tracking_link_rules")
    .select("id, raw_url, param_name, fire_checkout, created_at")
    .eq("product_id", product.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ rules: data ?? [] });
}

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "editor")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const productSlug: string | undefined = body?.product_slug;
  const url: string | undefined = body?.url;
  const paramName = body?.param_name === "sck" ? "sck" : "ref";
  const fireCheckout = body?.fire_checkout === true;

  if (!productSlug || !url) {
    return NextResponse.json({ error: "product_slug e url são obrigatórios." }, { status: 400 });
  }
  const matchUrl = normalizeMatchUrl(url);
  if (!matchUrl) {
    return NextResponse.json({ error: "URL inválida." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: product } = await admin.from("products").select("id").eq("slug", productSlug).maybeSingle();
  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }

  const { error } = await admin.from("tracking_link_rules").upsert(
    {
      product_id: product.id,
      match_url: matchUrl,
      raw_url: url.trim(),
      param_name: paramName,
      fire_checkout: fireCheckout,
      created_by: profile.userId,
    },
    { onConflict: "product_id,match_url" }
  );

  if (error) {
    return NextResponse.json({ error: "Falha ao registrar link." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
