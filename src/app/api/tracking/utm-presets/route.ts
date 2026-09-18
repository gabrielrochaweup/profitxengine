import { NextResponse } from "next/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CAMPOS_PRESET, normalizarValorUtm } from "@/lib/tracking/utm-presets";

// UTMs salvas por canal, pra não redigitar as mesmas toda vez. Admin only:
// mesma porta das outras telas de configuração do Tracking.

export async function GET(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const productId = new URL(request.url).searchParams.get("product_id");
  if (!productId) return NextResponse.json({ error: "product_id é obrigatório." }, { status: 400 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("tracking_utm_presets")
    .select(CAMPOS_PRESET)
    .eq("product_id", productId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  return NextResponse.json({ presets: data ?? [] });
}

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const productId: string | undefined = body?.product_id;
  const nome: string = typeof body?.nome === "string" ? body.nome.trim() : "";

  if (!productId || !nome) {
    return NextResponse.json({ error: "product_id e nome são obrigatórios." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Entra no fim da lista — quem criou por último provavelmente é o canal
  // menos estabelecido, e reordenar à mão seria mais UI do que o problema pede.
  const { data: ultimo } = await admin
    .from("tracking_utm_presets")
    .select("position")
    .eq("product_id", productId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await admin
    .from("tracking_utm_presets")
    .insert({
      product_id: productId,
      nome,
      utm_source: normalizarValorUtm(body?.utm_source),
      utm_medium: normalizarValorUtm(body?.utm_medium),
      utm_campaign: normalizarValorUtm(body?.utm_campaign),
      utm_content: normalizarValorUtm(body?.utm_content),
      position: (ultimo?.position ?? 0) + 10,
      created_by: profile.userId,
    })
    .select(CAMPOS_PRESET)
    .single();

  if (error || !data) return NextResponse.json({ error: "Falha ao salvar." }, { status: 500 });

  return NextResponse.json({ preset: data });
}
