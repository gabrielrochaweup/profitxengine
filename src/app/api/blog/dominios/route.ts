import { NextResponse } from "next/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CAMPOS_DOMINIO, normalizarCaminho, normalizarDominio } from "@/lib/blog";

export async function GET(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "editor")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const productId = new URL(request.url).searchParams.get("product_id");
  if (!productId) return NextResponse.json({ error: "product_id é obrigatório." }, { status: 400 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_dominios")
    .select(CAMPOS_DOMINIO)
    .eq("product_id", productId)
    .order("created_at", { ascending: true });

  return NextResponse.json({ dominios: data ?? [] });
}

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "editor")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const productId: string | undefined = body?.product_id;
  const dominio = normalizarDominio(body?.dominio);

  if (!productId || !dominio) {
    return NextResponse.json(
      { error: "Informe um domínio válido, tipo escolaprofitx.com." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("blog_dominios")
    .insert({
      product_id: productId,
      dominio,
      caminho: normalizarCaminho(body?.caminho),
      nome: texto(body?.nome),
      idioma: texto(body?.idioma) ?? "pt-BR",
      publico_alvo: texto(body?.publico_alvo),
      tom: texto(body?.tom),
      created_by: profile.userId,
    })
    .select(CAMPOS_DOMINIO)
    .single();

  if (error) {
    const repetido = error.code === "23505";
    return NextResponse.json(
      { error: repetido ? "Esse domínio já está cadastrado." : "Falha ao salvar." },
      { status: repetido ? 409 : 500 }
    );
  }

  return NextResponse.json({ dominio: data });
}

function texto(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
