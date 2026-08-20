import { NextResponse } from "next/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { getDecryptedKey, getProviderSettings, incrementPromptUsage } from "@/lib/ai/credentials";
import { generateImage, DEFAULT_MODELS } from "@/lib/ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveProduct } from "@/lib/products-server";
import type { AiModule, ImageAspectRatio, ImageContextType, ImageQuality } from "@/lib/supabase/types";

// Geração de imagem pode passar do limite padrão de função serverless do
// Vercel (10s), principalmente em qualidade alta.
export const maxDuration = 60;

interface GenerateImageBody {
  module: AiModule;
  prompt: string;
  promptId?: string;
  aspectRatio?: ImageAspectRatio;
  quality?: ImageQuality;
  contextType?: ImageContextType;
  contextId?: string;
  /** Dinâmica + slot de origem — usados só pra organizar a imagem sozinha
   * numa pasta "nome da dinâmica" > "horário do slot" (ver findOrCreateFolder). */
  dynamicId?: string;
  msgKey?: string;
  /** URL de uma imagem já enviada pro bucket 'reference-images' — usada
   * como base visual da geração. */
  referenceImageUrl?: string;
}

async function findOrCreateFolder(
  admin: ReturnType<typeof createAdminClient>,
  productId: string,
  name: string,
  parentId: string | null,
  createdBy: string
): Promise<string> {
  const findExisting = () => {
    let q = admin.from("image_folders").select("id").eq("product_id", productId).eq("name", name);
    q = parentId ? q.eq("parent_id", parentId) : q.is("parent_id", null);
    return q.maybeSingle();
  };

  const { data: existing } = await findExisting();
  if (existing) return existing.id;

  let countQuery = admin.from("image_folders").select("id", { count: "exact", head: true }).eq("product_id", productId);
  countQuery = parentId ? countQuery.eq("parent_id", parentId) : countQuery.is("parent_id", null);
  const { count } = await countQuery;

  const { data: created, error } = await admin
    .from("image_folders")
    .insert({ product_id: productId, name, parent_id: parentId, position: count ?? 0, created_by: createdBy })
    .select("id")
    .single();
  if (error || !created) {
    // Corrida entre duas gerações simultâneas criando a mesma pasta — o
    // índice único barrou o insert, então busca de novo (agora já existe).
    const { data: retry } = await findExisting();
    if (retry) return retry.id;
    throw error ?? new Error("Falha ao criar pasta.");
  }
  return created.id;
}

/**
 * Acha (ou cria) a pasta "nome da dinâmica" > "horário do slot" e devolve o
 * id da subpasta — pra imagem gerada de dentro de uma Dinâmica do Dia já
 * cair organizada sozinha, sem precisar arrastar manualmente depois.
 */
async function resolveDynamicFolderId(
  admin: ReturnType<typeof createAdminClient>,
  productId: string,
  dynamicId: string,
  msgKey: string,
  createdBy: string
): Promise<string | null> {
  try {
    const [{ data: dynamic }, { data: slot }] = await Promise.all([
      admin.from("message_dynamics").select("name").eq("id", dynamicId).single(),
      admin.from("message_dynamic_slots").select("time_label").eq("dynamic_id", dynamicId).eq("msg_key", msgKey).single(),
    ]);
    if (!dynamic?.name) return null;

    const parentId = await findOrCreateFolder(admin, productId, dynamic.name, null, createdBy);
    const childName = slot?.time_label?.trim() || "Sem horário";
    return await findOrCreateFolder(admin, productId, childName, parentId, createdBy);
  } catch (error) {
    console.error("Erro ao organizar pasta automática da dinâmica:", error);
    return null;
  }
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

  const activeProduct = await getActiveProduct(profile.userId, profile.role === "admin");
  if (!activeProduct) {
    return NextResponse.json({ error: "Nenhum produto ativo." }, { status: 422 });
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
      let folderId: string | null = null;
      if (body.contextType === "dinamica_slot" && body.dynamicId && body.msgKey) {
        folderId = await resolveDynamicFolderId(admin, activeProduct.id, body.dynamicId, body.msgKey, profile.userId);
      }

      const { data } = await admin
        .from("generated_images")
        .insert({
          product_id: activeProduct.id,
          context_type: body.contextType,
          context_id: body.contextId,
          prompt: body.prompt,
          prompt_id: body.promptId ?? null,
          image_url: result.url,
          provider: settings.provider,
          model,
          format: aspectRatio,
          quality,
          folder_id: folderId,
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
