"use client";

import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Download, X, Paperclip } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { PromptPicker } from "@/components/prompt-picker";
import { GeneratedImagesGallery } from "@/components/generated-images-gallery";
import { ImagePreviewModal } from "@/components/image-preview-modal";
import type { Database, ImageAspectRatio, ImageContextType, ImageQuality } from "@/lib/supabase/types";

type GeneratedImage = Database["public"]["Tables"]["generated_images"]["Row"];

interface ImageGenerationPanelProps {
  contextType: ImageContextType;
  /** Identificador estável do contexto (dinâmica inteira/mensagem/e-mail).
   * Nulo enquanto o item ainda não foi salvo — nesse caso a biblioteca fica
   * vazia, já que não existe contexto estável pra buscar gerações
   * anteriores. */
  contextId: string | null;
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
}

const ASPECT_RATIO_OPTIONS: { value: ImageAspectRatio; label: string }[] = [
  { value: "3:2", label: "Formato: 3:2" },
  { value: "4:3", label: "Formato: 4:3" },
  { value: "1:1", label: "Formato: 1:1 (quadrado)" },
  { value: "9:16", label: "Formato: 9:16 (retrato)" },
  { value: "16:9", label: "Formato: 16:9 (paisagem)" },
];

const QUALITY_OPTIONS: { value: ImageQuality; label: string }[] = [
  { value: "low", label: "Qualidade: Baixa" },
  { value: "medium", label: "Qualidade: Média" },
  { value: "high", label: "Qualidade: Alta" },
];

/**
 * Painel de geração de imagem reutilizado em Dinâmicas do Dia (slot e modo
 * livre), Mensagens X1 e E-mails — controles de qualidade/formato, botão de
 * gerar (que vira "Gerar nova" depois da primeira), prévia inline da
 * biblioteca (embaixo do prompt) e gaveta completa pra reuso/exclusão.
 */
export function ImageGenerationPanel({
  contextType,
  contextId,
  value,
  onChange,
  label = "Gerar imagem",
  placeholder = "Descreva a imagem que você quer gerar...",
  rows = 3,
}: ImageGenerationPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [promptId, setPromptId] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>("1:1");
  const [quality, setQuality] = useState<ImageQuality>("medium");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);
  const [libraryImages, setLibraryImages] = useState<GeneratedImage[] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [uploadingReference, setUploadingReference] = useState(false);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!contextId) {
      setLibraryImages([]);
      return;
    }
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("generated_images")
        .select("*")
        .eq("context_type", contextType)
        .eq("context_id", contextId as string)
        .order("created_at", { ascending: false });
      if (!cancelled) setLibraryImages(data ?? []);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [contextType, contextId]);

  async function handleReferenceFileSelected(file: File) {
    setUploadingReference(true);
    const supabase = createClient();
    const path = `refs/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("reference-images").upload(path, file);
    if (!uploadError) {
      const { data } = supabase.storage.from("reference-images").getPublicUrl(path);
      setReferenceImageUrl(data.publicUrl);
    } else {
      setError("Erro ao enviar a imagem de referência. Tente novamente.");
    }
    setUploadingReference(false);
  }

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: "imagem",
          prompt,
          promptId: promptId ?? undefined,
          aspectRatio,
          quality,
          contextType,
          contextId: contextId ?? undefined,
          referenceImageUrl: referenceImageUrl ?? undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Erro ao gerar imagem.");
      onChange(body.url);
      if (contextId && body.id) {
        setLibraryImages((prev) => [
          {
            id: body.id,
            context_type: contextType,
            context_id: contextId,
            prompt,
            prompt_id: promptId,
            image_url: body.url,
            provider: "",
            model: "",
            format: aspectRatio,
            quality,
            created_by: null,
            created_at: new Date().toISOString(),
          },
          ...(prev ?? []),
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar imagem.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDeleteFromLibrary(id: string) {
    setDeletingId(id);
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("generated_images").delete().eq("id", id);
    if (!deleteError) {
      setLibraryImages((prev) => (prev ? prev.filter((img) => img.id !== id) : prev));
    }
    setDeletingId(null);
  }

  function handleSelectFromLibrary(url: string) {
    onChange(url);
    setPreviewImage(null);
    setGalleryOpen(false);
  }

  function openCurrentPreview() {
    const match = libraryImages?.find((img) => img.image_url === value);
    if (match) {
      setPreviewImage(match);
    } else {
      setGalleryOpen(true);
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-border-strong p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-text-secondary">
          <ImageIcon size={12} />
          {label}
        </p>
        <PromptPicker
          category="imagem"
          onSelect={(p) => {
            setPrompt(p.content);
            setPromptId(p.id);
          }}
        />
      </div>

      <Textarea
        value={prompt}
        onChange={(e) => {
          setPrompt(e.target.value);
          setPromptId(null);
        }}
        rows={rows}
        placeholder={placeholder}
        className="w-full text-xs"
      />

      <input
        ref={referenceInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleReferenceFileSelected(file);
          e.target.value = "";
        }}
      />

      <div className="mt-2 flex items-center gap-2">
        {referenceImageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={referenceImageUrl}
              alt="Imagem de referência"
              className="h-9 w-9 rounded-md border border-border object-cover"
            />
            <span className="text-[11px] text-text-muted">Imagem de referência anexada</span>
            <button
              type="button"
              onClick={() => setReferenceImageUrl(null)}
              className="ml-auto flex items-center gap-1 rounded-button border border-border-strong px-2 py-1 text-[11px] text-text-secondary hover:bg-card-hover"
            >
              <X size={11} />
              Remover
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => referenceInputRef.current?.click()}
            disabled={uploadingReference}
            className="flex items-center gap-1.5 rounded-button border border-dashed border-border-strong px-2 py-1 text-[11px] text-text-secondary hover:bg-card-hover"
          >
            <Paperclip size={11} />
            {uploadingReference ? "Enviando..." : "Anexar imagem de referência"}
          </button>
        )}
      </div>

      {contextId && (
        <div className="mt-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] text-text-muted">
              Biblioteca{libraryImages && libraryImages.length > 0 ? ` (${libraryImages.length})` : ""}
            </span>
            {libraryImages && libraryImages.length > 0 && (
              <button
                type="button"
                onClick={() => setGalleryOpen(true)}
                className="text-[11px] text-accent hover:underline"
              >
                Ver tudo
              </button>
            )}
          </div>
          {libraryImages === null ? (
            <p className="text-[11px] text-text-muted">Carregando...</p>
          ) : libraryImages.length === 0 ? (
            <p className="text-[11px] text-text-muted">Nenhuma imagem gerada ainda.</p>
          ) : (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {libraryImages.map((img) => (
                <button key={img.id} type="button" onClick={() => setPreviewImage(img)} className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.image_url}
                    alt={img.prompt}
                    className="h-12 w-12 rounded-md border border-border object-cover transition-opacity hover:opacity-80"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-2">
        <Select
          value={quality}
          onChange={(e) => setQuality(e.target.value as ImageQuality)}
          className="h-8 flex-1 text-[11px]"
        >
          {QUALITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <Select
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value as ImageAspectRatio)}
          className="h-8 flex-1 text-[11px]"
        >
          {ASPECT_RATIO_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      <Button
        type="button"
        size="sm"
        className="mt-2 w-full"
        disabled={!prompt.trim() || generating}
        onClick={handleGenerate}
      >
        {generating ? "Gerando..." : value ? "Gerar nova" : "Gerar"}
      </Button>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      {value && (
        <div className="mt-2 flex items-center gap-2">
          <button type="button" onClick={openCurrentPreview} title="Ver imagem" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Imagem gerada"
              className="h-16 w-16 rounded-lg border border-border object-cover transition-opacity hover:opacity-80"
            />
          </button>
          <div className="flex flex-1 flex-wrap gap-1.5">
            <a
              href={value}
              download
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-button border border-border-strong px-2 py-1 text-[11px] text-text-secondary hover:bg-card-hover"
            >
              <Download size={11} />
              Baixar
            </a>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="flex items-center gap-1.5 rounded-button border border-border-strong px-2 py-1 text-[11px] text-text-secondary hover:bg-card-hover"
            >
              <X size={11} />
              Remover
            </button>
          </div>
        </div>
      )}

      <GeneratedImagesGallery
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        images={libraryImages}
        onPreview={setPreviewImage}
        onDelete={handleDeleteFromLibrary}
        deletingId={deletingId}
      />

      <ImagePreviewModal
        image={previewImage}
        onClose={() => setPreviewImage(null)}
        onSelect={handleSelectFromLibrary}
      />
    </div>
  );
}
