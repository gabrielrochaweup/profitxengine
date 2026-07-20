export type AiProvider = "openai" | "anthropic" | "google";

export interface GenerateTextParams {
  prompt: string;
  provider: AiProvider;
  model: string;
  system?: string;
  /** Resumo de aprovação (Dia/Semana/Mês/Geral) das mensagens anteriores, anexado ao system prompt. */
  performanceContext?: string;
  maxTokens?: number;
}

export interface GenerateTextResult {
  text: string;
  tokensUsed: number | null;
}

export type ImageAspectRatio = "1:1" | "3:2" | "4:3" | "9:16" | "16:9";
export type ImageQuality = "low" | "medium" | "high";

export interface GenerateImageParams {
  prompt: string;
  provider: AiProvider;
  model: string;
  aspectRatio?: ImageAspectRatio;
  quality?: ImageQuality;
  /** Imagem de referência anexada pelo usuário (ex: foto de uma pessoa) —
   * usada como base visual pelo provedor além do texto do prompt. */
  referenceImage?: { data: string; mimeType: string };
}

export interface GenerateImageResult {
  url: string;
}

export const DEFAULT_MODELS: Record<AiProvider, { text: string; image?: string }> = {
  openai: { text: "gpt-4o-mini", image: "gpt-image-1" },
  anthropic: { text: "claude-sonnet-5" },
  google: { text: "gemini-3-flash", image: "gemini-3.1-flash-image" },
};

export function combineSystem(params: Pick<GenerateTextParams, "system" | "performanceContext">): string | undefined {
  const parts = [params.system, params.performanceContext].filter(Boolean);
  return parts.length > 0 ? parts.join("\n\n") : undefined;
}
