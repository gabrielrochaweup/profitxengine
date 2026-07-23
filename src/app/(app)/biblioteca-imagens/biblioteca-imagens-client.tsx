"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ImagePreviewModal } from "@/components/image-preview-modal";
import { cn } from "@/lib/utils";
import type { Database, ImageContextType } from "@/lib/supabase/types";

type GeneratedImage = Database["public"]["Tables"]["generated_images"]["Row"];

const FOLDER_LABEL: Record<ImageContextType, string> = {
  dinamica_slot: "Dinâmicas do Dia",
  livre_engagement: "Gerador Livre",
  x1_message: "Mensagens X1",
  email: "E-mails",
};

const QUALITY_LABEL: Record<string, string> = { low: "Baixa", medium: "Média", high: "Alta" };

interface BibliotecaImagensClientProps {
  initialImages: GeneratedImage[];
  currentUserId: string;
  isAdmin: boolean;
}

export function BibliotecaImagensClient({ initialImages, currentUserId, isAdmin }: BibliotecaImagensClientProps) {
  const [images, setImages] = useState(initialImages);
  const [folder, setFolder] = useState<ImageContextType | "all">("all");
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const folders = useMemo(() => {
    const counts: Partial<Record<ImageContextType, number>> = {};
    for (const img of images) counts[img.context_type] = (counts[img.context_type] ?? 0) + 1;
    return counts;
  }, [images]);

  const visible = folder === "all" ? images : images.filter((img) => img.context_type === folder);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase.from("generated_images").delete().eq("id", id);
    if (!error) setImages((prev) => prev.filter((img) => img.id !== id));
    setDeletingId(null);
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-1.5">
        <FolderTab active={folder === "all"} onClick={() => setFolder("all")} label={`Todas (${images.length})`} />
        {(Object.keys(FOLDER_LABEL) as ImageContextType[]).map((key) => (
          <FolderTab
            key={key}
            active={folder === key}
            onClick={() => setFolder(key)}
            label={`${FOLDER_LABEL[key]} (${folders[key] ?? 0})`}
          />
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-8 text-center text-sm text-text-muted">Nenhuma imagem gerada ainda.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {visible.map((img) => {
            const canDelete = isAdmin || img.created_by === currentUserId;
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setPreviewImage(img)}
                className="group relative overflow-hidden rounded-lg border border-border text-left"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.image_url} alt={img.prompt} className="aspect-square w-full object-cover" />
                <div className="absolute inset-0 flex flex-col justify-between bg-black/70 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="line-clamp-3 text-[10px] text-white/90">{img.prompt}</p>
                  <div className="flex items-center justify-between gap-1">
                    <span className="rounded-button bg-white/10 px-1.5 py-0.5 text-[9px] text-white/70">
                      {FOLDER_LABEL[img.context_type]} · {img.format} · {QUALITY_LABEL[img.quality] ?? img.quality}
                    </span>
                    {canDelete && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(img.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.stopPropagation();
                            handleDelete(img.id);
                          }
                        }}
                        aria-disabled={deletingId === img.id}
                        title="Excluir"
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-danger aria-disabled:opacity-50"
                      >
                        <Trash2 size={11} />
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <ImagePreviewModal image={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}

function FolderTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-button border px-3 py-1.5 text-xs transition-colors",
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-border-strong text-text-secondary hover:bg-card-hover"
      )}
    >
      {label}
    </button>
  );
}
