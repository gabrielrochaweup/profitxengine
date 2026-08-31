import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptSecret } from "@/lib/crypto";

function generateToken() {
  return randomBytes(24).toString("base64url");
}

// action="rotate" gera um novo token e devolve em texto puro (uma vez só,
// igual na criação); { active: boolean } liga/desliga o endpoint sem
// apagar histórico.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const admin = createAdminClient();

  if (body?.action === "rotate") {
    const token = generateToken();
    const { error } = await admin
      .from("tracking_webhook_endpoints")
      .update({ encrypted_secret: encryptSecret(token) })
      .eq("id", params.id);
    if (error) return NextResponse.json({ error: "Falha ao rotacionar." }, { status: 500 });
    return NextResponse.json({ secret: token });
  }

  if (typeof body?.active === "boolean") {
    const { error } = await admin
      .from("tracking_webhook_endpoints")
      .update({ active: body.active })
      .eq("id", params.id);
    if (error) return NextResponse.json({ error: "Falha ao atualizar." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("tracking_webhook_endpoints").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: "Falha ao excluir." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
