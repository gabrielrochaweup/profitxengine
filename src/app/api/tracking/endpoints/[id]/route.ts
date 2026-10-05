import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSessionProfile, ehAprovado } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptSecret } from "@/lib/crypto";

function generateToken() {
  return randomBytes(24).toString("base64url");
}

// action="rotate" gera um novo token e devolve em texto puro (uma vez só,
// igual na criação); { modo: "ativo" | "teste" | "pausado" } troca o estado
// do checkout; { active: boolean } liga/desliga os demais tipos sem apagar
// histórico.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const profile = await getSessionProfile();
  if (!ehAprovado(profile)) {
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

  // "active" = o webhook responde (ativo e teste); só "pausado" recusa. Os
  // dois campos andam juntos pra que o resolvedor do webhook, que só olha
  // "active", continue certo.
  if (body?.modo === "ativo" || body?.modo === "teste" || body?.modo === "pausado") {
    const { error } = await admin
      .from("tracking_webhook_endpoints")
      .update({ modo: body.modo, active: body.modo !== "pausado" })
      .eq("id", params.id);
    if (error) return NextResponse.json({ error: "Falha ao trocar o estado." }, { status: 500 });
    return NextResponse.json({ ok: true, modo: body.modo });
  }

  if (typeof body?.active === "boolean") {
    // Mantém "modo" junto. Se o banco ainda não tem a coluna (migration 0130
    // por rodar), repete só com "active" — o liga/desliga não pode quebrar.
    let { error } = await admin
      .from("tracking_webhook_endpoints")
      .update({ active: body.active, modo: body.active ? "ativo" : "pausado" })
      .eq("id", params.id);
    if (error) {
      ({ error } = await admin.from("tracking_webhook_endpoints").update({ active: body.active }).eq("id", params.id));
    }
    if (error) return NextResponse.json({ error: "Falha ao atualizar." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (typeof body?.label === "string" || body?.label === null) {
    const label = typeof body.label === "string" && body.label.trim() ? body.label.trim() : null;
    const { error } = await admin.from("tracking_webhook_endpoints").update({ label }).eq("id", params.id);
    if (error) return NextResponse.json({ error: "Falha ao renomear." }, { status: 500 });
    return NextResponse.json({ ok: true, label });
  }

  if (typeof body?.platform === "string" && body.platform.trim()) {
    const { error } = await admin
      .from("tracking_webhook_endpoints")
      .update({ platform: body.platform.trim() })
      .eq("id", params.id);
    if (error) return NextResponse.json({ error: "Falha ao trocar a plataforma." }, { status: 500 });
    return NextResponse.json({ ok: true, platform: body.platform.trim() });
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const profile = await getSessionProfile();
  if (!ehAprovado(profile)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("tracking_webhook_endpoints").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: "Falha ao excluir." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
