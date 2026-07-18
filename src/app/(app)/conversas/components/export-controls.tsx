"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Platform } from "@/lib/supabase/types";

const EXPORT_PIXEL_RATIO = 3;

interface ExportControlsProps {
  platform: Platform;
}

export function ExportControls({ platform }: ExportControlsProps) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    const node = document.getElementById("export-content");
    if (!node) return;

    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(node, {
        pixelRatio: EXPORT_PIXEL_RATIO,
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
    <Button type="button" onClick={handleDownload} disabled={downloading} className="no-export shadow-popover">
      <Download size={16} />
      {downloading ? "Gerando..." : "Baixar imagem"}
    </Button>
  );
}
