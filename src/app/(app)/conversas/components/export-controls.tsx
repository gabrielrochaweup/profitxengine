"use client";

import { useState } from "react";
import { toPng } from "html-to-image";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EXPORT_FORMATS, PREVIEW_SCALE, type ExportFormat } from "../lib/export-formats";
import type { Platform } from "@/lib/supabase/types";

interface ExportControlsProps {
  format: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
  platform: Platform;
}

export function ExportControls({ format, onFormatChange, platform }: ExportControlsProps) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    const node = document.getElementById("export-target");
    if (!node) return;

    setDownloading(true);
    try {
      const dataUrl = await toPng(node, {
        pixelRatio: PREVIEW_SCALE,
        filter: (el) => !(el instanceof HTMLElement && el.classList.contains("no-export")),
      });
      const link = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      link.download = `${platform}_${date}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(EXPORT_FORMATS) as ExportFormat[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onFormatChange(key)}
            className={`rounded-button px-3 py-1.5 text-xs font-medium transition-colors ${
              format === key
                ? "bg-accent text-white"
                : "border border-border-strong text-text-secondary hover:bg-card-hover"
            }`}
          >
            {EXPORT_FORMATS[key].label}
          </button>
        ))}
      </div>

      <Button type="button" onClick={handleDownload} disabled={downloading}>
        <Download size={16} />
        {downloading ? "Gerando..." : "Baixar imagem"}
      </Button>
    </div>
  );
}
