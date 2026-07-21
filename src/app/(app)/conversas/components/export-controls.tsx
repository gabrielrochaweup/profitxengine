"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Platform } from "@/lib/supabase/types";

const EXPORT_PIXEL_RATIO = 3;

interface ExportControlsProps {
  platform: Platform;
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  if (/iP(hone|od|ad)/.test(navigator.userAgent)) return true;
  // iPadOS Safari se identifica como "Macintosh" desde o iOS 13 (modo
  // "site de desktop" por padrão), então também checamos touch. Mas
  // maxTouchPoints > 0 sozinho dá falso positivo em alguns Mac com
  // trackpad — por isso exige também um ponteiro "grosso" (touch), já
  // que um Mac de verdade com mouse/trackpad reporta pointer:fine.
  if (navigator.platform !== "MacIntel" || navigator.maxTouchPoints <= 1) return false;
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return !window.matchMedia("(pointer: fine)").matches;
}

export function ExportControls({ platform }: ExportControlsProps) {
  const [downloading, setDownloading] = useState(false);

  function handleDownload() {
    const node = document.getElementById("export-content");
    if (!node) return;

    // No iOS Safari, window.open() só funciona de forma confiável quando
    // chamado de forma síncrona dentro do gesto de clique — por isso
    // abrimos a aba em branco JÁ, antes de qualquer await, e só navegamos
    // ela pra imagem depois que a conversão termina.
    const iosTab = isIOS() ? window.open("", "_blank") : null;

    setDownloading(true);
    (async () => {
      try {
        const { toPng } = await import("html-to-image");
        const dataUrl = await toPng(node, {
          pixelRatio: EXPORT_PIXEL_RATIO,
          filter: (el) => !(el instanceof HTMLElement && el.classList.contains("no-export")),
        });

        // data: URLs muito grandes (imagem em 3x) são pouco confiáveis como
        // href de download no Safari — convertemos pra blob: URL, que não
        // tem esse limite e é o padrão recomendado pra isso.
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const date = new Date().toISOString().slice(0, 10);
        const filename = `${platform}_${date}_${Date.now()}.png`;

        if (iosTab) {
          // iOS não expõe "salvar arquivo" via JS — abrir a imagem numa aba
          // deixa o usuário segurar o dedo nela e usar "Adicionar à
          // Galeria", o fluxo nativo do iOS pra salvar imagens da web.
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
