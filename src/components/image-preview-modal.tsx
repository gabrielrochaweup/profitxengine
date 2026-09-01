"use client";

import { Download, Check, X } from "lucide-react";
import { downloadImageUrl } from "@/lib/download-file";
import type { Database } from "@/lib/supabase/types";

type GeneratedImage = Database["public"]["Tables"]["generated_images"]["Row"];

interface ImagePreviewModalProps {
  image: GeneratedImage | null;
  onClose: () => void;
  onSelect?: (url: string) => void;
}

const QUALITY_LABEL: Record<string, string> = { low: "Baixa", medium: "Média", high: "Alta" };

/**
 * Popup de imagem ampliada — abre por cima da gaveta de biblioteca (ou da
 * prévia inline) sem fechá-la. Fechar aqui (X ou clique fora) só fecha este
 * popup; a gaveta por trás continua aberta.
 */
export function ImagePreviewModal({ image, onClose, onSelect }: ImagePreviewModalProps) {
  if (!image) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-panel bg-card shadow-popover">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">Imagem gerada</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-card-hover hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.image_url}
            alt={image.prompt}
            className="max-h-[55vh] w-full rounded-lg border border-border object-contain"
          />
          <p className="mt-3 whitespace-pre-wrap text-xs text-text-secondary">{image.prompt}</p>
          <p className="mt-1 text-[11px] text-text-muted">
            {image.format} · Qualidade {QUALITY_LABEL[image.quality] ?? image.quality}
          </p>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => downloadImageUrl(image.image_url, `imagem_${image.id}.png`)}
              className="flex items-center gap-1.5 rounded-button border border-border-strong px-3 py-1.5 text-xs text-text-secondary hover:bg-card-hover"
            >
              <Download size={12} />
              Baixar
            </button>
            {onSelect && (
              <button
                type="button"
                onClick={() => onSelect(image.image_url)}
                className="flex items-center gap-1.5 rounded-button bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover"
              >
                <Check size={12} />
                Usar esta imagem
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
