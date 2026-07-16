import { NextResponse } from "next/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { validateKey } from "@/lib/ai";
import type { AiProvider } from "@/lib/supabase/types";

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Apenas administradores podem validar chaves." }, { status: 403 });
  }

  const { provider, apiKey } = (await request.json()) as { provider: AiProvider; apiKey: string };
  if (!provider || !apiKey) {
    return NextResponse.json({ error: "provider e apiKey são obrigatórios." }, { status: 400 });
  }

  try {
    await validateKey(provider, apiKey);
    return NextResponse.json({ valid: true });
  } catch (error) {
    return NextResponse.json({
      valid: false,
      error: error instanceof Error ? error.message : "Chave inválida.",
    });
  }
}
