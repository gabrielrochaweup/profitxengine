import { NextResponse } from "next/server";
import { getSessionProfile, ehAprovado } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { CAMPOS_PRESET, normalizarValorUtm } from "@/lib/tracking/utm-presets";

type PresetUpdate = Database["public"]["Tables"]["tracking_utm_presets"]["Update"];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const profile = await getSessionProfile();
  if (!ehAprovado(profile)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const update: PresetUpdate = {};

  if (typeof body?.nome === "string" && body.nome.trim()) update.nome = body.nome.trim();
  for (const campo of ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const) {
    if (typeof body?.[campo] === "string") update[campo] = normalizarValorUtm(body[campo]);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tracking_utm_presets")
    .update(update)
    .eq("id", params.id)
    .select(CAMPOS_PRESET)
    .single();

  if (error || !data) return NextResponse.json({ error: "Falha ao atualizar." }, { status: 500 });

  return NextResponse.json({ preset: data });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const profile = await getSessionProfile();
  if (!ehAprovado(profile)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("tracking_utm_presets").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: "Falha ao excluir." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
