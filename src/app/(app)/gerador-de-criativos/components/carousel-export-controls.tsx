"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PREVIEW_DISPLAY_WIDTH } from "./post-preview";

export const CAROUSEL_EXPORT_NODE_ID = "carousel-export-content";

// Mesma conta de post-export-controls.tsx — largura final sempre 1080px.
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
  return slug || "carrossel";
}

// Aguarda o React commitar a troca de frame ativo e a <img> de fundo do
// novo frame terminar de carregar, antes de capturar — troca de index é
// só um re-render, mas o html-to-image precisa da imagem já pronta no DOM.
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

function downloadDataUrl(dataUrl: string, filename: string, iosTab: Window | null) {
  return (async () => {
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
  })();
}

interface CarouselExportControlsProps {
  frameCount: number;
  activeFrameIndex: number;
  setActiveFrameIndex: (index: number) => void;
  title: string;
}

export function CarouselExportControls({
  frameCount,
  activeFrameIndex,
  setActiveFrameIndex,
  title,
}: CarouselExportControlsProps) {
  const [downloading, setDownloading] = useState(false);

  function handleDownloadAll() {
    const originalIndex = activeFrameIndex;
    const prefix = slugify(title);
    const iosTab = isIOS() ? window.open("", "_blank") : null;

    setDownloading(true);
    (async () => {
      try {
        const { toPng } = await import("html-to-image");
        for (let i = 0; i < frameCount; i++) {
          setActiveFrameIndex(i);
          await waitForFrameReady();
          const node = document.getElementById(CAROUSEL_EXPORT_NODE_ID);
          if (!node) continue;
          const dataUrl = await toPng(node, {
            pixelRatio: EXPORT_PIXEL_RATIO,
            filter: (el) => !(el instanceof HTMLElement && el.classList.contains("no-export")),
          });
          await downloadDataUrl(dataUrl, `${prefix}_${i + 1}.png`, i === 0 ? iosTab : null);
          await new Promise((resolve) => setTimeout(resolve, 350));
        }
      } catch {
        iosTab?.close();
      } finally {
        setActiveFrameIndex(originalIndex);
        setDownloading(false);
      }
    })();
  }

  return (
    <Button type="button" onClick={handleDownloadAll} disabled={downloading} className="no-export shadow-popover">
      <Download size={16} />
      {downloading ? `Gerando ${activeFrameIndex + 1}/${frameCount}...` : `Baixar todas (${frameCount})`}
    </Button>
  );
}
