export type ExportFormat = "stories" | "feed" | "square";

interface FormatSpec {
  label: string;
  width: number;
  height: number;
}

export const EXPORT_FORMATS: Record<ExportFormat, FormatSpec> = {
  stories: { label: "Stories (1080×1920)", width: 1080, height: 1920 },
  feed: { label: "Feed (1080×1350)", width: 1080, height: 1350 },
  square: { label: "Quadrado (1080×1080)", width: 1080, height: 1080 },
};

// Fator de escala entre o tamanho real de exportação e o CSS px exibido em tela.
export const PREVIEW_SCALE = 3;
