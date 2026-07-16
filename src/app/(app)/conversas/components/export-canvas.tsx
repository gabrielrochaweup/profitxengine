import { type ReactNode } from "react";
import { PHONE_WIDTH, PHONE_HEIGHT } from "./phone-frame";
import { EXPORT_FORMATS, PREVIEW_SCALE, type ExportFormat } from "../lib/export-formats";

interface ExportCanvasProps {
  format: ExportFormat;
  children: ReactNode;
}

export function ExportCanvas({ format, children }: ExportCanvasProps) {
  const spec = EXPORT_FORMATS[format];
  const canvasWidth = spec.width / PREVIEW_SCALE;
  const canvasHeight = spec.height / PREVIEW_SCALE;
  const scale = Math.min(canvasWidth / PHONE_WIDTH, (canvasHeight * 0.92) / PHONE_HEIGHT);

  return (
    <div
      id="export-target"
      className="relative mx-auto flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#1a1332] via-[#0a0a0c] to-[#0a0a0c]"
      style={{ width: canvasWidth, height: canvasHeight }}
    >
      <div style={{ transform: `scale(${scale})` }}>{children}</div>
    </div>
  );
}
