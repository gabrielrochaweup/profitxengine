import "server-only";
import { GoogleGenAI } from "@google/genai";
import {
  combineSystem,
  type GenerateTextParams,
  type GenerateTextResult,
  type GenerateImageParams,
  type GenerateImageResult,
  type ImageQuality,
} from "./types";
import { uploadGeneratedImage } from "./storage";

// A API de imagem do Gemini aceita a proporção diretamente ("1:1", "3:2",
// "4:3", "9:16", "16:9", entre outras) — sem necessidade de mapear pra um
// tamanho fixo como na OpenAI. Qualidade vira resolução (imageSize).
const IMAGE_SIZE_BY_QUALITY: Record<ImageQuality, string> = {
  low: "1K",
  medium: "2K",
  high: "4K",
};

export async function generateText(
  params: GenerateTextParams,
  apiKey: string
): Promise<GenerateTextResult> {
  const client = new GoogleGenAI({ apiKey });
  const system = combineSystem(params);

  const response = await client.models.generateContent({
    model: params.model,
    // No Gemini, a vez do modelo se chama "model", não "assistant".
    contents: params.messages
      ? params.messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }))
      : params.prompt,
    config: {
      ...(system ? { systemInstruction: system } : {}),
      // 4096 em vez de 2048 — dá mais folga pra respostas mais longas (ex:
      // conversas com várias mensagens em JSON) não cortarem no meio.
      maxOutputTokens: params.maxTokens ?? 4096,
    },
  });

  return {
    text: response.text ?? "",
    tokensUsed: response.usageMetadata?.totalTokenCount ?? null,
  };
}

export async function generateImage(
  params: GenerateImageParams,
  apiKey: string
): Promise<GenerateImageResult> {
  const client = new GoogleGenAI({ apiKey });

  const response = await client.models.generateContent({
    model: params.model,
    contents: params.referenceImage
      ? [
          { text: params.prompt },
          { inlineData: { data: params.referenceImage.data, mimeType: params.referenceImage.mimeType } },
        ]
      : params.prompt,
    config: {
      imageConfig: {
        aspectRatio: params.aspectRatio ?? "1:1",
        imageSize: IMAGE_SIZE_BY_QUALITY[params.quality ?? "medium"],
      },
    },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((part) => part.inlineData?.data);

  if (!imagePart?.inlineData?.data) {
    throw new Error("O Gemini não retornou uma imagem. Tente reformular o prompt.");
  }

  const url = await uploadGeneratedImage(imagePart.inlineData.data, imagePart.inlineData.mimeType ?? "image/png");
  return { url };
}

export async function validateKey(apiKey: string): Promise<boolean> {
  const client = new GoogleGenAI({ apiKey });
  await client.models.generateContent({
    model: "gemini-3-flash",
    contents: "oi",
    config: { maxOutputTokens: 1 },
  });
  return true;
}
