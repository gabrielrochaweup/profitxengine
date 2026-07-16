import { NextResponse } from "next/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptSecret } from "@/lib/crypto";
import { validateKey } from "@/lib/ai";
import type { AiProvider } from "@/lib/supabase/types";

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ai_credentials")
    .select("provider, is_valid, last_validated_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ credentials: data });
}

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Apenas administradores podem cadastrar chaves." }, { status: 403 });
  }

  const { provider, apiKey } = (await request.json()) as { provider: AiProvider; apiKey: string };
  if (!provider || !apiKey) {
    return NextResponse.json({ error: "provider e apiKey são obrigatórios." }, { status: 400 });
  }

  let isValid = false;
  try {
    await validateKey(provider, apiKey);
    isValid = true;
  } catch {
    isValid = false;
  }

  const admin = createAdminClient();
  const { error } = await admin.from("ai_credentials").upsert(
    {
      provider,
      encrypted_key: encryptSecret(apiKey),
      is_valid: isValid,
      last_validated_at: new Date().toISOString(),
      created_by: profile.userId,
    },
    { onConflict: "provider" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ is_valid: isValid });
}
