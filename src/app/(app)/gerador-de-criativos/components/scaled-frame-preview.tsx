import { CarouselFramePreview } from "./carousel-frame-preview";
import type { CarouselFrame } from "@/lib/supabase/types";

interface ScaledFramePreviewProps {
  frame: CarouselFrame;
  canvasWidth: number;
  canvasHeight: number;
  targetWidth: number;
}

// O CarouselFramePreview é calibrado em px fixos pra um canvas de 1080px
// (mesmo padrão do resto do app). Pra caber numa miniatura de grid ou numa
// prévia pequena dentro de um popup, renderiza o canvas real e encolhe com
// CSS transform em vez de recalcular tamanhos de fonte.
export function ScaledFramePreview({ frame, canvasWidth, canvasHeight, targetWidth }: ScaledFramePreviewProps) {
  const scale = targetWidth / canvasWidth;
  const targetHeight = canvasHeight * scale;

  return (
    <div style={{ width: targetWidth, height: targetHeight, overflow: "hidden" }} className="relative">
      <div style={{ width: canvasWidth, height: canvasHeight, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <CarouselFramePreview frame={frame} />
      </div>
    </div>
  );
}
