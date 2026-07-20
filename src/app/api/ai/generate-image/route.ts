import { NextResponse } from "next/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { getDecryptedKey, getProviderSettings, incrementPromptUsage } from "@/lib/ai/credentials";
import { generateImage, DEFAULT_MODELS } from "@/lib/ai";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AiModule, ImageAspectRatio, ImageContextType, ImageQuality } from "@/lib/supabase/types";

interface GenerateImageBody {
  module: AiModule;
  prompt: string;
  promptId?: string;
  aspectRatio?: ImageAspectRatio;
  quality?: ImageQuality;
  contextType?: ImageContextType;
  contextId?: string;
  /** URL de uma imagem já enviada pro bucket 'reference-images' — usada
   * como base visual da geração. */
  referenceImageUrl?: string;
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
  if (settings.provider === "anthropic") {
    return NextResponse.json(
      { error: "Anthropic não suporta geração de imagens. Selecione OpenAI ou Google em Configurações." },
      { status: 422 }
    );
  }

  const apiKey = await getDecryptedKey(settings.provider);
  if (!apiKey) {
    return NextResponse.json(
      { error: `Nenhuma chave válida configurada para ${settings.provider}. Configure em Configurações.` },
      { status: 422 }
    );
  }

  const model = settings.model || DEFAULT_MODELS[settings.provider].image || DEFAULT_MODELS.openai.image!;

  try {
    const aspectRatio = body.aspectRatio ?? "1:1";
    const quality = body.quality ?? "medium";

    let referenceImage: { data: string; mimeType: string } | undefined;
    if (body.referenceImageUrl) {
      const refRes = await fetch(body.referenceImageUrl);
      if (!refRes.ok) {
        return NextResponse.json({ error: "Não foi possível ler a imagem de referência." }, { status: 400 });
      }
      const mimeType = refRes.headers.get("content-type") ?? "image/png";
      const buffer = Buffer.from(await refRes.arrayBuffer());
      referenceImage = { data: buffer.toString("base64"), mimeType };
    }

    const result = await generateImage(
      { prompt: body.prompt, provider: settings.provider, model, aspectRatio, quality, referenceImage },
      apiKey
    );

    const admin = createAdminClient();
    await admin.from("ai_usage_log").insert({
      module: body.module,
      provider: settings.provider,
      model,
      tokens_used: null,
      created_by: profile.userId,
    });

    if (body.promptId) {
      await incrementPromptUsage(body.promptId);
    }

    let generationId: string | null = null;
    if (body.contextType && body.contextId) {
      const { data } = await admin
        .from("generated_images")
        .insert({
          context_type: body.contextType,
          context_id: body.contextId,
          prompt: body.prompt,
          prompt_id: body.promptId ?? null,
          image_url: result.url,
          provider: settings.provider,
          model,
          format: aspectRatio,
          quality,
          created_by: profile.userId,
        })
        .select("id")
        .single();
      generationId = data?.id ?? null;
    }

    return NextResponse.json({ url: result.url, id: generationId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao gerar imagem." },
      { status: 502 }
    );
  }
}
