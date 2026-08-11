"use client";

import { useState } from "react";
import { Download, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PREVIEW_DISPLAY_WIDTH } from "./carousel-constants";

export const CAROUSEL_EXPORT_NODE_ID = "carousel-export-content";

// Mesma conta usada em todo o app — largura final sempre 1080px.
const EXPORT_PIXEL_RATIO = 1080 / PREVIEW_DISPLAY_WIDTH;

function isIOS() {
  if (typeof navigator === "undefined") return false;
  if (/iP(hone|od|ad)/.test(navigator.userAgent)) return true;
  if (navigator.platform !== "MacIntel" || navigator.maxTouchPoints <= 1) return false;
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return !window.matchMedia("(pointer: fine)").matches;
}

function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "post";
}

// O nó de exportação fica fora da tela — trocar o índice é só um
// re-render; espera o React commitar e a <img> de fundo do frame novo
// terminar de carregar antes de capturar.
async function waitForFrameReady() {
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  const node = document.getElementById(CAROUSEL_EXPORT_NODE_ID);
  const img = node?.querySelector("img");
  if (img && !img.complete) {
    await new Promise<void>((resolve) => {
      const done = () => resolve();
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
      setTimeout(done, 5000);
    });
  }
}

async function captureCurrentFrame(): Promise<string | null> {
  const node = document.getElementById(CAROUSEL_EXPORT_NODE_ID);
  if (!node) return null;
  const { toPng } = await import("html-to-image");
  return toPng(node, {
    pixelRatio: EXPORT_PIXEL_RATIO,
    filter: (el) => !(el instanceof HTMLElement && el.classList.contains("no-export")),
  });
}

async function downloadDataUrl(dataUrl: string, filename: string, iosTab: Window | null) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  if (iosTab) {
    iosTab.location.href = blobUrl;
  } else {
    const link = document.createElement("a");
    link.download = filename;
    link.href = blobUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
}

interface CarouselExportControlsProps {
  frameCount: number;
  exportIndex: number;
  setExportIndex: (index: number) => void;
  title: string;
}

export function CarouselExportControls({ frameCount, exportIndex, setExportIndex, title }: CarouselExportControlsProps) {
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingFirst, setDownloadingFirst] = useState(false);

  function handleDownloadFirst() {
    const originalIndex = exportIndex;
    const iosTab = isIOS() ? window.open("", "_blank") : null;
    setDownloadingFirst(true);
    (async () => {
      try {
        setExportIndex(0);
        await waitForFrameReady();
        const dataUrl = await captureCurrentFrame();
        if (dataUrl) await downloadDataUrl(dataUrl, `${slugify(title)}.png`, iosTab);
      } catch {
        iosTab?.close();
      } finally {
        setExportIndex(originalIndex);
        setDownloadingFirst(false);
      }
    })();
  }

  function handleDownloadAll() {
    const originalIndex = exportIndex;
    const prefix = slugify(title);
    const iosTab = isIOS() ? window.open("", "_blank") : null;
    setDownloadingAll(true);
    (async () => {
      try {
        for (let i = 0; i < frameCount; i++) {
          setExportIndex(i);
          await waitForFrameReady();
          const dataUrl = await captureCurrentFrame();
          if (dataUrl) await downloadDataUrl(dataUrl, `${prefix}_${i + 1}.png`, i === 0 ? iosTab : null);
          await new Promise((resolve) => setTimeout(resolve, 350));
        }
      } catch {
        iosTab?.close();
      } finally {
        setExportIndex(originalIndex);
        setDownloadingAll(false);
      }
    })();
  }

  const busy = downloadingAll || downloadingFirst;

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" onClick={handleDownloadFirst} disabled={busy}>
        <ImageIcon size={16} />
        {downloadingFirst ? "Gerando..." : "Baixar primeira imagem"}
      </Button>
      <Button type="button" onClick={handleDownloadAll} disabled={busy}>
        <Download size={16} />
        {downloadingAll ? `Gerando ${exportIndex + 1}/${frameCount}...` : "Baixar carrossel completo"}
      </Button>
    </div>
  );
}
