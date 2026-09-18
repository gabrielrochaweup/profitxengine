import { NextResponse } from "next/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { CAMPOS_DOMINIO, normalizarCaminho, normalizarDominio } from "@/lib/blog";

type DominioUpdate = Database["public"]["Tables"]["blog_dominios"]["Update"];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "editor")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const update: DominioUpdate = {};

  if (typeof body?.dominio === "string") {
    const d = normalizarDominio(body.dominio);
    if (!d) return NextResponse.json({ error: "Domínio inválido." }, { status: 400 });
    // Trocar o domínio invalida a prova de posse: o TXT que foi conferido
    // está no domínio antigo, e deixar o "verificado" de pé seria dizer que
    // temos permissão num lugar onde ninguém checou nada.
    update.dominio = d;
    update.verificado = false;
    update.verificado_em = null;
  }
  if (typeof body?.caminho === "string") update.caminho = normalizarCaminho(body.caminho);
  for (const campo of ["nome", "publico_alvo", "tom"] as const) {
    if (typeof body?.[campo] === "string" || body?.[campo] === null) {
      update[campo] = typeof body[campo] === "string" && body[campo].trim() ? body[campo].trim() : null;
    }
  }
  if (typeof body?.idioma === "string" && body.idioma.trim()) update.idioma = body.idioma.trim();
  if (typeof body?.ativo === "boolean") update.ativo = body.ativo;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }
  update.updated_at = new Date().toISOString();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("blog_dominios")
    .update(update)
    .eq("id", params.id)
    .select(CAMPOS_DOMINIO)
    .single();

  if (error || !data) return NextResponse.json({ error: "Falha ao atualizar." }, { status: 500 });

  return NextResponse.json({ dominio: data });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "editor")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("blog_dominios").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: "Falha ao excluir." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
