"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Image as ImageIcon, Download, X, Paperclip, Copy, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PromptPicker } from "@/components/prompt-picker";
import { GeneratedImagesGallery } from "@/components/generated-images-gallery";
import { ImagePreviewModal } from "@/components/image-preview-modal";
import { downloadImageUrl } from "@/lib/download-file";
import { sanitizeFileName } from "@/lib/sanitize-filename";
import { useActiveProduct } from "@/components/layout/active-product-context";
import type { Database, ImageAspectRatio, ImageContextType, ImageQuality } from "@/lib/supabase/types";

type GeneratedImage = Database["public"]["Tables"]["generated_images"]["Row"];
type PromptTemplate = Database["public"]["Tables"]["image_prompt_templates"]["Row"];
type PromptCharacter = Database["public"]["Tables"]["image_prompt_characters"]["Row"];
type PromptTone = Database["public"]["Tables"]["image_prompt_tones"]["Row"];
type PromptCta = Database["public"]["Tables"]["image_prompt_ctas"]["Row"];

const ITEM_LABELS = ["Texto principal", "Subtítulo / horário", "Mensagem secundária", "CTA"];

function assemblePrompt(template: string, items: string[], character: string, tone: string): string {
  let text = template.split("[PERSONAGEM]").join(character);
  // Templates genéricos (com o marcador [TOM]) recebem a cor no lugar exato
  // do bloco de "Art direction". Templates feitos por mensagem (os 180 com
  // a cena já embutida) não têm esse marcador — pra cor predominante ainda
  // valer 100% neles, força uma instrução de override no fim do prompt em
  // vez de simplesmente não ter efeito nenhum.
  const hasToneToken = text.includes("[TOM]");
  text = text.split("[TOM]").join(tone);
  if (!hasToneToken && tone) {
    text += `\n\nDOMINANT COLOR OVERRIDE — this color scheme takes priority over any other color mentioned above for lighting, background gradient and rim light throughout the entire image:\n${tone}`;
  }
  items.forEach((item, i) => {
    text = text.split(`[ITEM ${i + 1}]`).join(item || `[ITEM ${i + 1}]`);
  });
  return text;
}

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
  /** Dinâmica + msg_key da mensagem sendo editada — quando presentes,
   * filtram o dropdown de "prompt pré-definido" pra mostrar só o template
   * genérico + o feito especificamente pra essa mensagem, em vez da lista
   * inteira de templates de todas as dinâmicas. */
  dynamicId?: string;
  msgKey?: string;
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
  dynamicId,
  msgKey,
}: ImageGenerationPanelProps) {
  const { activeProductId } = useActiveProduct();
  const [promptMode, setPromptMode] = useState<"livre" | "predefinido">("livre");
  const [prompt, setPrompt] = useState("");
  const [promptId, setPromptId] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>("3:2");
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

  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [characters, setCharacters] = useState<PromptCharacter[]>([]);
  const [tones, setTones] = useState<PromptTone[]>([]);
  const [ctas, setCtas] = useState<PromptCta[]>([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [characterId, setCharacterId] = useState<string>("");
  const [toneId, setToneId] = useState<string>("");
  const [items, setItems] = useState<string[]>(["", "", "", ""]);
  const [copiedPredefinido, setCopiedPredefinido] = useState(false);

  useEffect(() => {
    if (!activeProductId) return;
    async function loadPromptParts() {
      const supabase = createClient();
      const [{ data: t }, { data: c }, { data: to }, { data: ct }] = await Promise.all([
        supabase.from("image_prompt_templates").select("*").eq("product_id", activeProductId as string).order("position"),
        supabase.from("image_prompt_characters").select("*").eq("product_id", activeProductId as string).order("position"),
        supabase.from("image_prompt_tones").select("*").eq("product_id", activeProductId as string).order("position"),
        supabase.from("image_prompt_ctas").select("*").eq("product_id", activeProductId as string).order("position"),
      ]);
      setTemplates(t ?? []);
      setCharacters(c ?? []);
      setTones(to ?? []);
      setCtas(ct ?? []);
      const specific = t?.find((tpl) => tpl.dynamic_id === dynamicId && tpl.msg_key === msgKey);
      const fallback = t?.find((tpl) => !tpl.dynamic_id) ?? t?.[0];
      const initial = specific ?? fallback;
      if (initial) setTemplateId(initial.id);
      if (c && c.length > 0) setCharacterId(c[0].id);
      if (to && to.length > 0) setToneId(to[0].id);
    }
    loadPromptParts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProductId]);

  // Só o template genérico (sem dinâmica associada) + o feito
  // especificamente pra essa mensagem — evita listar as 180 opções de
  // todas as dinâmicas de uma vez.
  const visibleTemplates = useMemo(
    () => templates.filter((t) => !t.dynamic_id || (t.dynamic_id === dynamicId && t.msg_key === msgKey)),
    [templates, dynamicId, msgKey]
  );

  const selectedTemplate = templates.find((t) => t.id === templateId) ?? null;
  const selectedCharacter = characters.find((c) => c.id === characterId) ?? null;
  const selectedTone = tones.find((t) => t.id === toneId) ?? null;

  const assembledPrompt = useMemo(() => {
    if (!selectedTemplate) return "";
    return assemblePrompt(selectedTemplate.body, items, selectedCharacter?.body ?? "", selectedTone?.body ?? "");
  }, [selectedTemplate, selectedCharacter, selectedTone, items]);

  async function handleCopyPredefinido() {
    if (!assembledPrompt) return;
    await navigator.clipboard.writeText(assembledPrompt);
    setCopiedPredefinido(true);
    setTimeout(() => setCopiedPredefinido(false), 1500);
  }

  useEffect(() => {
    if (!contextId || !activeProductId) {
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
        .eq("product_id", activeProductId as string)
        .order("created_at", { ascending: false });
      if (!cancelled) setLibraryImages(data ?? []);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [contextType, contextId, activeProductId]);

  async function handleReferenceFileSelected(file: File) {
    setUploadingReference(true);
    const supabase = createClient();
    const path = `refs/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
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
    const effectivePrompt = promptMode === "predefinido" ? assembledPrompt : prompt;
    if (!effectivePrompt.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: "imagem",
          prompt: effectivePrompt,
          promptId: promptMode === "predefinido" ? undefined : promptId ?? undefined,
          aspectRatio,
          quality,
          contextType,
          contextId: contextId ?? undefined,
          dynamicId,
          msgKey,
          referenceImageUrl: referenceImageUrl ?? undefined,
        }),
      });
      // A resposta pode vir vazia (timeout da função no servidor) — nesse
      // caso res.json() lança um erro de parse cru e confuso. Trata isso
      // com uma mensagem clara.
      let body: { url?: string; id?: string; error?: string };
      try {
        body = await res.json();
      } catch {
        throw new Error(
          res.ok
            ? "A resposta demorou demais e voltou vazia. Tente gerar de novo."
            : `Erro ao gerar imagem (${res.status}). Tente de novo em alguns segundos.`
        );
      }
      if (!res.ok) throw new Error(body.error || "Erro ao gerar imagem.");
      if (!body.url) throw new Error("A IA não retornou nenhuma imagem. Tente gerar de novo.");
      const generatedUrl = body.url;
      const generatedId = body.id;
      onChange(generatedUrl);
      if (contextId && generatedId && activeProductId) {
        setLibraryImages((prev) => [
          {
            id: generatedId,
            product_id: activeProductId,
            context_type: contextType,
            context_id: contextId,
            prompt: effectivePrompt,
            prompt_id: promptMode === "predefinido" ? null : promptId,
            image_url: generatedUrl,
            provider: "",
            model: "",
            format: aspectRatio,
            quality,
            folder_id: null,
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
    <div className="rounded-lg bg-card p-3 shadow-card-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
          <ImageIcon size={13} />
          {label}
        </p>
        {promptMode === "livre" && (
          <PromptPicker
            preferredSlug="imagem"
            onSelect={(p) => {
              setPrompt(p.content);
              setPromptId(p.id);
            }}
          />
        )}
      </div>

      <div className="mb-2 flex gap-1.5">
        <PromptModeTab active={promptMode === "predefinido"} onClick={() => setPromptMode("predefinido")}>
          Prompt pré-definido
        </PromptModeTab>
        <PromptModeTab active={promptMode === "livre"} onClick={() => setPromptMode("livre")}>
          Prompt livre
        </PromptModeTab>
      </div>

      {promptMode === "livre" ? (
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
      ) : (
        <div className="space-y-2 rounded-lg bg-card-hover/50 p-2.5">
          {visibleTemplates.length === 0 ? (
            <p className="text-[11px] text-text-muted">
              Nenhum template cadastrado ainda — cadastre em Biblioteca de Imagens → Modelos de prompt.
            </p>
          ) : (
            <>
              <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="h-8 w-full text-[11px]">
                {visibleTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {ITEM_LABELS.map((itemLabel, i) => (
                  <div key={i} className="space-y-1">
                    <label className="text-[10px] text-text-muted">
                      Item {i + 1} — {itemLabel}
                    </label>
                    {i === 3 && ctas.length > 0 && (
                      <Select
                        value=""
                        onChange={(e) => {
                          if (!e.target.value) return;
                          const next = [...items];
                          next[3] = e.target.value;
                          setItems(next);
                        }}
                        className="h-7 text-[11px]"
                      >
                        <option value="">CTA rápido...</option>
                        {ctas.map((c) => (
                          <option key={c.id} value={c.body}>
                            {c.name}
                          </option>
                        ))}
                      </Select>
                    )}
                    <Input
                      value={items[i]}
                      onChange={(e) => {
                        const next = [...items];
                        next[i] = e.target.value;
                        setItems(next);
                      }}
                      placeholder={`ex: ${itemLabel.toUpperCase()}`}
                      className="h-8 text-xs"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-text-muted">Personagem</label>
                  <Select value={characterId} onChange={(e) => setCharacterId(e.target.value)} className="h-8 text-[11px]">
                    {characters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-text-muted">Cor predominante</label>
                  <Select value={toneId} onChange={(e) => setToneId(e.target.value)} className="h-8 text-[11px]">
                    {tones.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-text-muted">Prompt montado</label>
                  <button
                    type="button"
                    onClick={handleCopyPredefinido}
                    className="flex items-center gap-1 text-[10px] text-accent hover:underline"
                  >
                    {copiedPredefinido ? <Check size={10} /> : <Copy size={10} />}
                    {copiedPredefinido ? "Copiado!" : "Copiar prompt"}
                  </button>
                </div>
                <Textarea
                  value={assembledPrompt}
                  readOnly
                  rows={4}
                  className="w-full bg-accent-soft font-mono text-[10px] shadow-card-sm"
                />
              </div>
            </>
          )}
        </div>
      )}

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
              className="ml-auto flex items-center gap-1 rounded-button bg-card-hover px-2 py-1 text-[11px] text-text-secondary shadow-card-sm hover:brightness-95"
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
        disabled={!(promptMode === "predefinido" ? assembledPrompt : prompt).trim() || generating}
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
            <button
              type="button"
              onClick={() => downloadImageUrl(value, `imagem_${Date.now()}.png`)}
              className="flex items-center gap-1.5 rounded-button bg-card-hover px-2 py-1 text-[11px] text-text-secondary shadow-card-sm hover:brightness-95"
            >
              <Download size={11} />
              Baixar
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="flex items-center gap-1.5 rounded-button bg-card-hover px-2 py-1 text-[11px] text-text-secondary shadow-card-sm hover:brightness-95"
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

function PromptModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-button px-2.5 py-1 text-[11px] font-medium transition-colors ${
        active ? "bg-accent text-white" : "text-text-secondary hover:bg-card-hover"
      }`}
    >
      {children}
    </button>
  );
}
