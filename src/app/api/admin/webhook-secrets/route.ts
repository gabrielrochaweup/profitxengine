import "server-only";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptSecret } from "@/lib/crypto";

const WEBHOOK_KEYS = ["top5"] as const;
type WebhookKey = (typeof WEBHOOK_KEYS)[number];

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("webhook_secrets").select("key, updated_at");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ secrets: data });
}

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Apenas administradores podem gerar segredos de webhook." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { key?: WebhookKey } | null;
  const key = body?.key;
  if (!key || !WEBHOOK_KEYS.includes(key)) {
    return NextResponse.json({ error: "Webhook inválido." }, { status: 400 });
  }

  const secret = randomBytes(32).toString("hex");
  const admin = createAdminClient();
  const { error } = await admin.from("webhook_secrets").upsert(
    {
      key,
      encrypted_secret: encryptSecret(secret),
      updated_by: profile.userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // O valor em texto puro só existe nesta resposta — não fica recuperável
  // depois (só cifrado no banco), então o admin precisa copiar agora.
  return NextResponse.json({ secret });
}
