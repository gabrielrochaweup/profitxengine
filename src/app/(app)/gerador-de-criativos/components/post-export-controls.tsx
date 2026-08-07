"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const EXPORT_PIXEL_RATIO = 3;

function isIOS() {
  if (typeof navigator === "undefined") return false;
  if (/iP(hone|od|ad)/.test(navigator.userAgent)) return true;
  if (navigator.platform !== "MacIntel" || navigator.maxTouchPoints <= 1) return false;
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return !window.matchMedia("(pointer: fine)").matches;
}

// Cópia enxuta de conversas/components/export-controls.tsx — mesma lib
// (html-to-image), mesmo pixelRatio e mesmo tratamento de iOS.
export function PostExportControls() {
  const [downloading, setDownloading] = useState(false);

  function handleDownload() {
    const node = document.getElementById("post-export-content");
    if (!node) return;

    const iosTab = isIOS() ? window.open("", "_blank") : null;

    setDownloading(true);
    (async () => {
      try {
        const { toPng } = await import("html-to-image");
        const dataUrl = await toPng(node, {
          pixelRatio: EXPORT_PIXEL_RATIO,
          filter: (el) => !(el instanceof HTMLElement && el.classList.contains("no-export")),
        });

        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const date = new Date().toISOString().slice(0, 10);
        const filename = `post_${date}_${Date.now()}.png`;

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
      } catch {
        iosTab?.close();
      } finally {
        setDownloading(false);
      }
    })();
  }

  return (
    <Button type="button" onClick={handleDownload} disabled={downloading} className="no-export shadow-popover">
      <Download size={16} />
      {downloading ? "Gerando..." : "Baixar imagem"}
    </Button>
  );
}
