import { NextResponse } from "next/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CAMPOS_BM, ehStatusBm } from "@/lib/tracking/bms";

// Inventário de BMs (Meta) e contas de gerente (Google). Admin only: é a
// lista de ativos de anúncio da operação.

export async function GET(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const productId = new URL(request.url).searchParams.get("product_id");
  if (!productId) return NextResponse.json({ error: "product_id é obrigatório." }, { status: 400 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("ad_business_managers")
    .select(CAMPOS_BM)
    .eq("product_id", productId)
    .order("created_at", { ascending: true });

  return NextResponse.json({ bms: data ?? [] });
}

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const productId: string | undefined = body?.product_id;
  const platform = body?.platform;
  const nome: string = typeof body?.nome === "string" ? body.nome.trim() : "";

  if (!productId || (platform !== "meta" && platform !== "google") || !nome) {
    return NextResponse.json(
      { error: "product_id, platform ('meta'/'google') e nome são obrigatórios." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ad_business_managers")
    .insert({
      product_id: productId,
      platform,
      nome,
      external_id: typeof body?.external_id === "string" && body.external_id.trim() ? body.external_id.trim() : null,
      status: ehStatusBm(body?.status) ? body.status : "pronta",
      contas: typeof body?.contas === "string" ? body.contas : "",
      paginas: typeof body?.paginas === "string" ? body.paginas : "",
      observacoes: typeof body?.observacoes === "string" && body.observacoes.trim() ? body.observacoes.trim() : null,
      created_by: profile.userId,
    })
    .select(CAMPOS_BM)
    .single();

  if (error || !data) return NextResponse.json({ error: "Falha ao criar." }, { status: 500 });

  return NextResponse.json({ bm: data });
}
