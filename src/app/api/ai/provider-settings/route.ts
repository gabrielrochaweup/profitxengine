import { NextResponse } from "next/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AiModule, AiProvider } from "@/lib/supabase/types";

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("ai_provider_settings").select("module, provider, model");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Apenas administradores podem alterar isso." }, { status: 403 });
  }

  const { module, provider, model } = (await request.json()) as {
    module: AiModule;
    provider: AiProvider;
    model: string;
  };

  if (!module || !provider || !model) {
    return NextResponse.json({ error: "module, provider e model são obrigatórios." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("ai_provider_settings").upsert(
    { module, provider, model, updated_by: profile.userId, updated_at: new Date().toISOString() },
    { onConflict: "module" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
