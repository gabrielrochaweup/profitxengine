import "server-only";
import OpenAI, { toFile } from "openai";
import {
  combineSystem,
  type GenerateTextParams,
  type GenerateTextResult,
  type GenerateImageParams,
  type GenerateImageResult,
  type ImageAspectRatio,
  type ImageQuality,
} from "./types";
import { uploadGeneratedImage } from "./storage";

// A API de imagens da OpenAI não tem um parâmetro de proporção — só tamanhos
// fixos. gpt-image-* aceita quadrado/retrato/paisagem; dall-e-3 tem seus
// próprios retângulos. Landscape (3:2, 4:3, 16:9) cai no único retângulo
// horizontal disponível de cada modelo — não há como diferenciar entre eles.
function resolveOpenAiSize(model: string, aspectRatio?: ImageAspectRatio): string {
  const isDalle3 = model.startsWith("dall-e");
  if (aspectRatio === "9:16") return isDalle3 ? "1024x1792" : "1024x1536";
  if (!aspectRatio || aspectRatio === "1:1") return "1024x1024";
  return isDalle3 ? "1792x1024" : "1536x1024";
}

function resolveOpenAiQuality(model: string, quality?: ImageQuality): string {
  if (model.startsWith("dall-e")) return quality === "high" ? "hd" : "standard";
  return quality ?? "medium";
}

// input_fidelity só existe no gpt-image-1 (e variantes 1.x) — o gpt-image-2
// rejeita o parâmetro ("does not support the 'input_fidelity' parameter").
function supportsInputFidelity(model: string): boolean {
  return model.startsWith("gpt-image-1");
}

// Modelos "reasoning" (o1/o3/o4 e a família gpt-5) rejeitam o parâmetro
// legado max_tokens ("Unsupported parameter") e exigem max_completion_tokens
// no lugar — a SDK não faz essa troca sozinha, então detectamos pelo prefixo
// do nome do modelo.
function isReasoningModel(model: string): boolean {
  return /^(o1|o3|o4|gpt-5)/.test(model);
}

export async function generateText(
  params: GenerateTextParams,
  apiKey: string
): Promise<GenerateTextResult> {
  const client = new OpenAI({ apiKey });
  const system = combineSystem(params);
  const maxTokens = params.maxTokens ?? 2048;

  const completion = await client.chat.completions.create({
    model: params.model,
    ...(isReasoningModel(params.model)
      ? { max_completion_tokens: maxTokens }
      : { max_tokens: maxTokens }),
    messages: [
      ...(system ? [{ role: "system" as const, content: system }] : []),
      { role: "user" as const, content: params.prompt },
    ],
  });

  return {
    text: completion.choices[0]?.message?.content ?? "",
    tokensUsed: completion.usage?.total_tokens ?? null,
  };
}

export async function generateImage(
  params: GenerateImageParams,
  apiKey: string
): Promise<GenerateImageResult> {
  const client = new OpenAI({ apiKey });

  // Modelos dall-e-* aceitam response_format ("url" ou "b64_json"); os gpt-image-*
  // não aceitam esse parâmetro e sempre devolvem b64_json — por isso lidamos com
  // os dois formatos de resposta abaixo em vez de fixar um só.
  // As uniões de tipo do SDK variam por endpoint/modelo (gpt-image-* vs
  // dall-e-3); resolvemos os valores certos em runtime — só o valor de cada
  // campo precisa de cast, não o objeto de params inteiro (isso faria o TS
  // escolher o overload de streaming e quebrar o tipo de retorno).
  const size = resolveOpenAiSize(params.model, params.aspectRatio) as OpenAI.Images.ImageGenerateParamsNonStreaming["size"];
  const quality = resolveOpenAiQuality(params.model, params.quality) as OpenAI.Images.ImageGenerateParamsNonStreaming["quality"];

  // Com imagem de referência anexada, usa o endpoint de edição em vez do de
  // geração — é o que aceita uma imagem de entrada como base visual.
  // input_fidelity "high" existe justamente pra preservar traços/rosto de
  // uma pessoa na referência.
  const result = params.referenceImage
    ? await client.images.edit({
        model: params.model,
        prompt: params.prompt,
        image: await toFile(
          Buffer.from(params.referenceImage.data, "base64"),
          `reference.${params.referenceImage.mimeType.split("/")[1] ?? "png"}`,
          { type: params.referenceImage.mimeType }
        ),
        size,
        quality,
        ...(supportsInputFidelity(params.model) ? { input_fidelity: "high" as const } : {}),
        n: 1,
      } as OpenAI.Images.ImageEditParamsNonStreaming)
    : await client.images.generate({
        model: params.model,
        prompt: params.prompt,
        size,
        quality,
        n: 1,
      });

  const image = result.data?.[0];
  if (image?.url) {
    return { url: image.url };
  }
  if (image?.b64_json) {
    const url = await uploadGeneratedImage(image.b64_json, "image/png");
    return { url };
  }
  throw new Error("A OpenAI não retornou uma imagem.");
}

export async function validateKey(apiKey: string): Promise<boolean> {
  const client = new OpenAI({ apiKey });
  await client.models.list();
  return true;
}
