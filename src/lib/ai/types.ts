export type AiProvider = "openai" | "anthropic";

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

export interface GenerateImageParams {
  prompt: string;
  provider: AiProvider;
  model: string;
  size?: "1024x1024" | "1024x1792" | "1792x1024";
}

export interface GenerateImageResult {
  url: string;
}

export const DEFAULT_MODELS: Record<AiProvider, { text: string; image?: string }> = {
  openai: { text: "gpt-4o-mini", image: "dall-e-3" },
  anthropic: { text: "claude-sonnet-4-5" },
};

export function combineSystem(params: Pick<GenerateTextParams, "system" | "performanceContext">): string | undefined {
  const parts = [params.system, params.performanceContext].filter(Boolean);
  return parts.length > 0 ? parts.join("\n\n") : undefined;
}
