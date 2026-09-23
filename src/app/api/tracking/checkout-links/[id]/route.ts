import { NextResponse } from "next/server";
import { getSessionProfile, ehAprovado } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

type LinkUpdate = Database["public"]["Tables"]["tracking_checkout_links"]["Update"];

const CAMPOS = "id, plano, checkout, url, position, created_at";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const profile = await getSessionProfile();
  if (!ehAprovado(profile)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const update: LinkUpdate = {};

  if (typeof body?.plano === "string" && body.plano.trim()) update.plano = body.plano.trim();
  if (typeof body?.checkout === "string" && body.checkout.trim()) update.checkout = body.checkout.trim();
  if (typeof body?.url === "string" && body.url.trim()) {
    try {
      new URL(body.url.trim());
    } catch {
      return NextResponse.json({ error: "O link precisa ser uma URL completa (https://...)." }, { status: 400 });
    }
    update.url = body.url.trim();
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tracking_checkout_links")
    .update(update)
    .eq("id", params.id)
    .select(CAMPOS)
    .single();

  if (error || !data) return NextResponse.json({ error: "Falha ao atualizar." }, { status: 500 });

  return NextResponse.json({ link: data });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const profile = await getSessionProfile();
  if (!ehAprovado(profile)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("tracking_checkout_links").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: "Falha ao excluir." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
