import "server-only";
import OpenAI from "openai";
import { combineSystem, type GenerateTextParams, type GenerateTextResult, type GenerateImageParams, type GenerateImageResult } from "./types";

export async function generateText(
  params: GenerateTextParams,
  apiKey: string
): Promise<GenerateTextResult> {
  const client = new OpenAI({ apiKey });
  const system = combineSystem(params);

  const completion = await client.chat.completions.create({
    model: params.model,
    max_tokens: params.maxTokens ?? 2048,
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

  const result = await client.images.generate({
    model: params.model,
    prompt: params.prompt,
    size: params.size ?? "1024x1024",
    n: 1,
  });

  const url = result.data?.[0]?.url;
  if (!url) {
    throw new Error("A OpenAI não retornou uma URL de imagem.");
  }
  return { url };
}

export async function validateKey(apiKey: string): Promise<boolean> {
  const client = new OpenAI({ apiKey });
  await client.models.list();
  return true;
}
