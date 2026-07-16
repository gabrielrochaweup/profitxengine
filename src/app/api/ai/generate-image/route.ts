import { NextResponse } from "next/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { getDecryptedKey, getProviderSettings, incrementPromptUsage } from "@/lib/ai/credentials";
import { generateImage } from "@/lib/ai";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AiModule } from "@/lib/supabase/types";

interface GenerateImageBody {
  module: AiModule;
  prompt: string;
  promptId?: string;
  size?: "1024x1024" | "1024x1792" | "1792x1024";
}

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "editor")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = (await request.json()) as GenerateImageBody;
  if (!body.module || !body.prompt) {
    return NextResponse.json({ error: "module e prompt são obrigatórios." }, { status: 400 });
  }

  const settings = await getProviderSettings(body.module);
  if (settings.provider !== "openai") {
    return NextResponse.json(
      { error: "Geração de imagem só está disponível com o provedor OpenAI. Ajuste em Configurações." },
      { status: 422 }
    );
  }

  const apiKey = await getDecryptedKey("openai");
  if (!apiKey) {
    return NextResponse.json(
      { error: "Nenhuma chave válida configurada para OpenAI. Configure em Configurações." },
      { status: 422 }
    );
  }

  try {
    const result = await generateImage(
      { prompt: body.prompt, provider: "openai", model: settings.model || "dall-e-3", size: body.size },
      apiKey
    );

    const admin = createAdminClient();
    await admin.from("ai_usage_log").insert({
      module: body.module,
      provider: "openai",
      model: settings.model || "dall-e-3",
      tokens_used: null,
      created_by: profile.userId,
    });

    if (body.promptId) {
      await incrementPromptUsage(body.promptId);
    }

    return NextResponse.json({ url: result.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao gerar imagem." },
      { status: 502 }
    );
  }
}
