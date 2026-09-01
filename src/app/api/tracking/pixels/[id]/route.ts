import { NextResponse } from "next/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptSecret } from "@/lib/crypto";
import type { Database } from "@/lib/supabase/types";

type PixelUpdate = Database["public"]["Tables"]["tracking_pixels"]["Update"];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const admin = createAdminClient();
  const update: PixelUpdate = {};

  if (typeof body?.label === "string" || body?.label === null) {
    update.label = typeof body.label === "string" && body.label.trim() ? body.label.trim() : null;
  }
  if (typeof body?.pixel_id === "string" && body.pixel_id.trim()) {
    update.pixel_id = body.pixel_id.trim();
  }
  if (typeof body?.active === "boolean") {
    update.active = body.active;
  }
  if (typeof body?.capi_token === "string" && body.capi_token.trim()) {
    update.encrypted_capi_token = encryptSecret(body.capi_token.trim());
  }
  if (body?.capi_token === null) {
    update.encrypted_capi_token = null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  const { data, error } = await admin
    .from("tracking_pixels")
    .update(update)
    .eq("id", params.id)
    .select("id, platform, pixel_id, label, active, created_at, encrypted_capi_token")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Falha ao atualizar." }, { status: 500 });
  }

  const { encrypted_capi_token, ...rest } = data;
  return NextResponse.json({ pixel: { ...rest, has_capi_token: !!encrypted_capi_token } });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("tracking_pixels").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: "Falha ao excluir." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
