import { NextResponse } from "next/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { CAMPOS_POST, gerarSlug } from "@/lib/blog";

type PostUpdate = Database["public"]["Tables"]["blog_posts"]["Update"];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "editor")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const update: PostUpdate = {};

  if (typeof body?.titulo === "string" && body.titulo.trim()) update.titulo = body.titulo.trim();
  if (typeof body?.slug === "string" && body.slug.trim()) update.slug = gerarSlug(body.slug);
  if (typeof body?.conteudo_md === "string") update.conteudo_md = body.conteudo_md;
  if (typeof body?.dominio_id === "string" || body?.dominio_id === null) update.dominio_id = body.dominio_id;
  for (const campo of ["meta_descricao", "palavra_chave", "imagem_url", "imagem_alt"] as const) {
    if (typeof body?.[campo] === "string" || body?.[campo] === null) {
      update[campo] = typeof body[campo] === "string" && body[campo].trim() ? body[campo].trim() : null;
    }
  }

  // Publicar carimba a data uma vez só: republicar um post já publicado não
  // pode reescrever a data original, senão o histórico do blog embaralha.
  if (body?.status === "publicado" || body?.status === "rascunho") {
    update.status = body.status;
    if (body.status === "publicado") {
      const admin = createAdminClient();
      const { data: atual } = await admin.from("blog_posts").select("publicado_em").eq("id", params.id).single();
      if (!atual?.publicado_em) update.publicado_em = new Date().toISOString();
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }
  update.updated_at = new Date().toISOString();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("blog_posts")
    .update(update)
    .eq("id", params.id)
    .select(CAMPOS_POST)
    .single();

  if (error) {
    const repetido = error.code === "23505";
    return NextResponse.json(
      { error: repetido ? "Já existe um post com essa slug nesse domínio." : "Falha ao atualizar." },
      { status: repetido ? 409 : 500 }
    );
  }

  return NextResponse.json({ post: data });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "editor")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("blog_posts").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: "Falha ao excluir." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
