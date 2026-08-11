"use client";

import { useState } from "react";
import { Download, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadImageUrl } from "@/lib/download-file";
import type { CarouselFrame } from "@/lib/supabase/types";

function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "post";
}

interface CarouselExportControlsProps {
  frames: CarouselFrame[];
  title: string;
}

// Sem overlay de texto sobre a imagem, cada frame já É o arquivo final —
// baixar é só buscar a URL gerada e salvar, sem precisar capturar nada com
// html-to-image (reaproveita downloadImageUrl, já usado em image-generation-panel.tsx).
export function CarouselExportControls({ frames, title }: CarouselExportControlsProps) {
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingFirst, setDownloadingFirst] = useState(false);

  async function handleDownloadFirst() {
    const url = frames[0]?.backgroundImageUrl;
    if (!url) return;
    setDownloadingFirst(true);
    await downloadImageUrl(url, `${slugify(title)}.png`);
    setDownloadingFirst(false);
  }

  async function handleDownloadAll() {
    setDownloadingAll(true);
    const prefix = slugify(title);
    for (let i = 0; i < frames.length; i++) {
      const url = frames[i].backgroundImageUrl;
      if (!url) continue;
      await downloadImageUrl(url, `${prefix}_${i + 1}.png`);
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
    setDownloadingAll(false);
  }

  const busy = downloadingAll || downloadingFirst;

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" onClick={handleDownloadFirst} disabled={busy || !frames[0]?.backgroundImageUrl}>
        <ImageIcon size={16} />
        {downloadingFirst ? "Baixando..." : "Baixar primeira imagem"}
      </Button>
      <Button type="button" onClick={handleDownloadAll} disabled={busy}>
        <Download size={16} />
        {downloadingAll ? "Baixando..." : "Baixar carrossel completo"}
      </Button>
    </div>
  );
}
