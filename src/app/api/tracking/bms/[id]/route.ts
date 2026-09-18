import { NextResponse } from "next/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { CAMPOS_BM, ehStatusBm } from "@/lib/tracking/bms";

type BmUpdate = Database["public"]["Tables"]["ad_business_managers"]["Update"];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const update: BmUpdate = {};

  if (typeof body?.nome === "string" && body.nome.trim()) update.nome = body.nome.trim();
  if (typeof body?.external_id === "string" || body?.external_id === null) {
    update.external_id = typeof body.external_id === "string" && body.external_id.trim() ? body.external_id.trim() : null;
  }
  if (ehStatusBm(body?.status)) update.status = body.status;
  if (typeof body?.contas === "string") update.contas = body.contas;
  if (typeof body?.paginas === "string") update.paginas = body.paginas;
  if (typeof body?.observacoes === "string" || body?.observacoes === null) {
    update.observacoes = typeof body.observacoes === "string" && body.observacoes.trim() ? body.observacoes.trim() : null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }
  update.updated_at = new Date().toISOString();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ad_business_managers")
    .update(update)
    .eq("id", params.id)
    .select(CAMPOS_BM)
    .single();

  if (error || !data) return NextResponse.json({ error: "Falha ao atualizar." }, { status: 500 });

  return NextResponse.json({ bm: data });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("ad_business_managers").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: "Falha ao excluir." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
