import "server-only";
import * as openai from "./openai";
import * as anthropic from "./anthropic";
import * as google from "./google";
import type {
  AiProvider,
  GenerateImageParams,
  GenerateImageResult,
  GenerateTextParams,
  GenerateTextResult,
} from "./types";

export type { AiProvider, GenerateTextParams, GenerateTextResult, GenerateImageParams, GenerateImageResult };
export { DEFAULT_MODELS } from "./types";

export async function generateText(
  params: GenerateTextParams,
  apiKey: string
): Promise<GenerateTextResult> {
  if (params.provider === "openai") return openai.generateText(params, apiKey);
  if (params.provider === "google") return google.generateText(params, apiKey);
  return anthropic.generateText(params, apiKey);
}

export async function generateImage(
  params: GenerateImageParams,
  apiKey: string
): Promise<GenerateImageResult> {
  if (params.provider === "openai") return openai.generateImage(params, apiKey);
  if (params.provider === "google") return google.generateImage(params, apiKey);
  throw new Error("Anthropic não suporta geração de imagens. Selecione OpenAI ou Google para este tipo de tarefa.");
}

export async function validateKey(provider: AiProvider, apiKey: string): Promise<boolean> {
  if (provider === "openai") return openai.validateKey(apiKey);
  if (provider === "google") return google.validateKey(apiKey);
  return anthropic.validateKey(apiKey);
}
