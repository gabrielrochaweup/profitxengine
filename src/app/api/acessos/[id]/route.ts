import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptSecret } from "@/lib/crypto";
import type { Database } from "@/lib/supabase/types";
import { CAMPOS_ACESSO, ehCategoria, ehCiclo, ehMoeda } from "@/lib/acessos";

type AcessoUpdate = Database["public"]["Tables"]["acessos"]["Update"];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const update: AcessoUpdate = {};

  if (typeof body?.nome === "string" && body.nome.trim()) update.nome = body.nome.trim();
  if (ehCategoria(body?.categoria)) update.categoria = body.categoria;
  for (const campo of ["url", "usuario", "onde_2fa", "responsavel", "observacoes"] as const) {
    if (typeof body?.[campo] === "string" || body?.[campo] === null) {
      update[campo] = typeof body[campo] === "string" && body[campo].trim() ? body[campo].trim() : null;
    }
  }
  if (typeof body?.tem_2fa === "boolean") update.tem_2fa = body.tem_2fa;
  if (typeof body?.login_google === "boolean") update.login_google = body.login_google;
  if (ehMoeda(body?.moeda)) update.moeda = body.moeda;
  if (ehCiclo(body?.ciclo)) update.ciclo = body.ciclo;

  if (typeof body?.assinatura === "boolean") {
    update.assinatura = body.assinatura;
    if (!body.assinatura) update.valor_cents = 0;
  }
  if (typeof body?.valor_cents === "number" && update.valor_cents !== 0) {
    update.valor_cents = Math.max(0, Math.round(body.valor_cents));
  }

  // String vazia apaga a senha guardada; campo ausente deixa como está. Sem
  // essa diferença não haveria como remover uma senha sem apagar o acesso.
  if (typeof body?.senha === "string") {
    update.encrypted_senha = body.senha ? encryptSecret(body.senha) : null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }
  update.updated_at = new Date().toISOString();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("acessos")
    .update(update)
    .eq("id", params.id)
    .select(`${CAMPOS_ACESSO}, encrypted_senha`)
    .single();

  if (error || !data) return NextResponse.json({ error: "Falha ao atualizar." }, { status: 500 });

  const { encrypted_senha, ...resto } = data;
  return NextResponse.json({ acesso: { ...resto, tem_senha: !!encrypted_senha } });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("acessos").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: "Falha ao excluir." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
