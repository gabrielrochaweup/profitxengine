import { NextResponse } from "next/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Os checkouts em uso, pra montar UTM sem caçar link em outra aba.
// Admin only, igual ao resto da configuração do Tracking.

const CAMPOS = "id, plano, checkout, url, position, created_at";

export async function GET(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const productId = new URL(request.url).searchParams.get("product_id");
  if (!productId) return NextResponse.json({ error: "product_id é obrigatório." }, { status: 400 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("tracking_checkout_links")
    .select(CAMPOS)
    .eq("product_id", productId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  return NextResponse.json({ links: data ?? [] });
}

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const productId: string | undefined = body?.product_id;
  const plano: string = typeof body?.plano === "string" ? body.plano.trim() : "";
  const checkout: string = typeof body?.checkout === "string" ? body.checkout.trim() : "";
  const url: string = typeof body?.url === "string" ? body.url.trim() : "";

  if (!productId || !plano || !checkout || !url) {
    return NextResponse.json({ error: "plano, checkout e url são obrigatórios." }, { status: 400 });
  }
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "O link precisa ser uma URL completa (https://...)." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: ultimo } = await admin
    .from("tracking_checkout_links")
    .select("position")
    .eq("product_id", productId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await admin
    .from("tracking_checkout_links")
    .insert({
      product_id: productId,
      plano,
      checkout,
      url,
      position: (ultimo?.position ?? 0) + 10,
      created_by: profile.userId,
    })
    .select(CAMPOS)
    .single();

  if (error || !data) return NextResponse.json({ error: "Falha ao salvar." }, { status: 500 });

  return NextResponse.json({ link: data });
}
