import type { PostFormat } from "@/lib/supabase/types";

// Tamanhos padrão de post/carrossel (largura sempre 1080, só a altura
// muda) — os 3 formatos fixos do Instagram, usados pra manter a proporção
// das miniaturas no grid igual à do arquivo final gerado.
export const POST_FORMAT_DIMENSIONS: Record<PostFormat, { width: number; height: number; label: string }> = {
  quadrado: { width: 1080, height: 1080, label: "1080 x 1080 — quadrado" },
  feed: { width: 1080, height: 1350, label: "1080 x 1350 — feed" },
  stories: { width: 1080, height: 1920, label: "1080 x 1920 — stories" },
};
