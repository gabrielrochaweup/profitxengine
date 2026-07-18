"use client";

import { Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type GeneratedImage = Database["public"]["Tables"]["generated_images"]["Row"];

interface GeneratedImagesGalleryProps {
  open: boolean;
  onClose: () => void;
  images: GeneratedImage[] | null;
  onPreview: (image: GeneratedImage) => void;
  onDelete: (id: string) => void;
  deletingId?: string | null;
}

const QUALITY_LABEL: Record<string, string> = { low: "Baixa", medium: "Média", high: "Alta" };

/**
 * Gaveta de reuso: desliza da direita pra esquerda, por trás do popup que a
 * abriu, listando todas as imagens já geradas naquele contexto (a dinâmica
 * inteira, não só o slot/mensagem atual). Clicar numa imagem abre o popup
 * ampliado (`ImagePreviewModal`) por cima, sem fechar a gaveta. Fica sempre
 * montada (não desmonta em `!open`) pra transição de translate animar.
 */
export function GeneratedImagesGallery({
  open,
  onClose,
  images,
  onPreview,
  onDelete,
  deletingId,
}: GeneratedImagesGalleryProps) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[70] bg-black/50 transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-[71] flex w-full max-w-md flex-col border-l border-border bg-card shadow-popover transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">Imagens já geradas</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-card-hover hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {images === null ? (
            <p className="py-8 text-center text-sm text-text-muted">Carregando...</p>
          ) : images.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-muted">Nenhuma imagem gerada ainda neste contexto.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => onPreview(img)}
                  className="group relative overflow-hidden rounded-lg border border-border text-left"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.image_url} alt={img.prompt} className="aspect-square w-full object-cover" />
                  <div className="absolute inset-0 flex flex-col justify-between bg-black/70 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="line-clamp-3 text-[10px] text-white/90">{img.prompt}</p>
                    <div className="flex items-center justify-between gap-1">
                      <span className="rounded-button bg-white/10 px-1.5 py-0.5 text-[9px] text-white/70">
                        {img.format} · {QUALITY_LABEL[img.quality] ?? img.quality}
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(img.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.stopPropagation();
                            onDelete(img.id);
                          }
                        }}
                        aria-disabled={deletingId === img.id}
                        title="Excluir"
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white hover:bg-danger aria-disabled:opacity-50"
                      >
                        <Trash2 size={11} />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
