import type { PostFormat } from "@/lib/supabase/types";

// Tamanhos padrão de post/carrossel (largura sempre 1080, só a altura
// muda) — os 3 formatos fixos do Instagram. A largura exibida na tela fica
// fixa em PREVIEW_DISPLAY_WIDTH; a exportação usa esse valor pra calcular o
// pixelRatio e sair sempre com 1080px de largura exata.
export const POST_FORMAT_DIMENSIONS: Record<PostFormat, { width: number; height: number; label: string }> = {
  quadrado: { width: 1080, height: 1080, label: "1080 x 1080 — quadrado" },
  feed: { width: 1080, height: 1350, label: "1080 x 1350 — feed" },
  stories: { width: 1080, height: 1920, label: "1080 x 1920 — stories" },
};
export const PREVIEW_DISPLAY_WIDTH = 520;
