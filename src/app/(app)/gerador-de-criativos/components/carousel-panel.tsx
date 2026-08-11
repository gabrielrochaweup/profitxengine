"use client";

import { useState } from "react";
import { Plus, Save, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { CarouselFramePreview } from "./carousel-frame-preview";
import { ScaledFramePreview } from "./scaled-frame-preview";
import { CarouselFrameEditModal } from "./carousel-frame-edit-modal";
import { CarouselExportControls, CAROUSEL_EXPORT_NODE_ID } from "./carousel-export-controls";
import { CarouselHistoryPanel } from "./carousel-history-panel";
import { POST_FORMAT_DIMENSIONS } from "./carousel-constants";
import type { CarouselFrame, Database, ImageAspectRatio, PostFormat } from "@/lib/supabase/types";

type FakeCarousel = Database["public"]["Tables"]["fake_carousels"]["Row"];

interface CarouselPanelProps {
  initialCarousels: FakeCarousel[];
  currentUserId: string;
}

const FORMAT_ASPECT_RATIO: Record<PostFormat, ImageAspectRatio> = {
  quadrado: "1:1",
  feed: "9:16",
  stories: "9:16",
};

// O título/subtítulo já vão por cima da imagem depois — sem essa instrução
// fixa, o modelo de imagem tende a desenhar seu próprio texto/infográfico
// na cena (títulos, listas, números), que brigam visualmente com o nosso.
const IMAGE_NO_TEXT_INSTRUCTION =
  "\n\nIMPORTANTE: gere só a cena/fundo visual, SEM nenhum texto, palavra, letra, número, legenda ou elemento de infográfico desenhado na imagem — o texto será adicionado por cima depois, separadamente.";

function buildCarouselTextSystem(frameCount: number): string {
  return `Você escreve o texto de um carrossel de posts para Instagram.
Baseado no tema abaixo, escreva exatamente ${frameCount} frame(s), cada um com um título curto e direto (até 12 palavras) e um texto de apoio (até 18 palavras).
Responda SOMENTE com um JSON válido, sem markdown, sem texto antes ou depois, no formato exato:
[{"titulo": "...", "texto": "..."}]
com exatamente ${frameCount} item(ns), na ordem em que os frames devem aparecer.`;
}

function parseCarouselTexts(raw: string, count: number): { headline: string; subtitle: string }[] {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/```\s*$/, "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = [];
  }
  const arr = Array.isArray(parsed) ? parsed : [];
  return Array.from({ length: count }, (_, i) => {
    const item = arr[i] as { titulo?: string; texto?: string } | undefined;
    return { headline: item?.titulo ?? "", subtitle: item?.texto ?? "" };
  });
}

export function CarouselPanel({ initialCarousels, currentUserId }: CarouselPanelProps) {
  const toast = useToast();
  const confirm = useConfirm();

  const [carousels, setCarousels] = useState<FakeCarousel[]>(initialCarousels);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [format, setFormat] = useState<PostFormat>("quadrado");
  const [frameCount, setFrameCount] = useState(3);
  const [prompt, setPrompt] = useState("");
  const [frames, setFrames] = useState<CarouselFrame[]>([]);
  const [generating, setGenerating] = useState(false);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [exportIndex, setExportIndex] = useState(0);

  const { width, height } = POST_FORMAT_DIMENSIONS[format];

  function resetToNew() {
    setCurrentId(null);
    setTitle("");
    setFormat("quadrado");
    setFrameCount(3);
    setPrompt("");
    setFrames([]);
    setExportIndex(0);
  }

  function loadCarousel(carousel: FakeCarousel) {
    setCurrentId(carousel.id);
    setTitle(carousel.title ?? "");
    setFormat(carousel.format);
    setFrames(carousel.frames);
    setFrameCount(carousel.frames.length || 1);
    setExportIndex(0);
  }

  function patchFrame(index: number, patch: Partial<CarouselFrame>) {
    setFrames((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  async function handleGenerate() {
    if (!prompt.trim() || frameCount < 1) return;
    setGenerating(true);
    try {
      const textPromise = fetch("/api/ai/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: "mensagem",
          prompt,
          system: buildCarouselTextSystem(frameCount),
        }),
      }).then((r) => r.json());

      const imagePromises = Array.from({ length: frameCount }, (_, i) =>
        fetch("/api/ai/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            module: "imagem",
            prompt: prompt + IMAGE_NO_TEXT_INSTRUCTION,
            aspectRatio: FORMAT_ASPECT_RATIO[format],
            quality: "medium",
            contextType: "carrossel",
            contextId: currentId ? `${currentId}-frame-${i}` : `carrossel-rascunho-frame-${i}`,
          }),
        }).then((r) => r.json())
      );

      const [textBody, ...imageBodies] = await Promise.all([textPromise, ...imagePromises]);
      if (textBody.error) throw new Error(textBody.error);
      const texts = parseCarouselTexts(String(textBody.text ?? ""), frameCount);

      const built: CarouselFrame[] = imageBodies.map((img, i) => {
        if (img.error) throw new Error(img.error);
        return { backgroundImageUrl: img.url as string, headline: texts[i].headline, subtitle: texts[i].subtitle };
      });

      setFrames(built);
      setExportIndex(0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar o conteúdo. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      title: title || null,
      format,
      frames,
      prompt_id: null,
      created_by: currentUserId,
    };

    if (currentId) {
      const { data, error } = await supabase
        .from("fake_carousels")
        .update(payload)
        .eq("id", currentId)
        .select()
        .single();
      if (!error && data) {
        setCarousels((prev) => prev.map((c) => (c.id === data.id ? data : c)));
        toast.success("Salvo.");
      } else {
        toast.error("Erro ao salvar. Tente novamente.");
      }
    } else {
      const { data, error } = await supabase.from("fake_carousels").insert(payload).select().single();
      if (!error && data) {
        setCurrentId(data.id);
        setCarousels((prev) => [data, ...prev]);
        toast.success("Salvo.");
      } else {
        toast.error("Erro ao salvar. Tente novamente.");
      }
    }
    setSaving(false);
  }

  async function handleDelete(carousel: FakeCarousel) {
    const ok = await confirm({
      title: "Excluir",
      description: `Excluir "${carousel.title || "sem título"}"? Essa ação não pode ser desfeita.`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const supabase = createClient();
    const { error } = await supabase.from("fake_carousels").delete().eq("id", carousel.id);
    if (!error) {
      setCarousels((prev) => prev.filter((c) => c.id !== carousel.id));
      if (currentId === carousel.id) resetToNew();
    } else {
      toast.error("Erro ao excluir. Tente novamente.");
    }
  }

  const editingFrame = editingIndex !== null ? frames[editingIndex] : null;
  const exportDisplayWidth = 520;
  const exportDisplayHeight = (exportDisplayWidth * height) / width;

  return (
    <div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título (opcional, só pra organizar e nomear o arquivo)"
          className="max-w-xs"
        />
        <div className="flex flex-wrap items-center gap-2">
          <CarouselHistoryPanel carousels={carousels} onSelect={loadCarousel} onDelete={handleDelete} />
          <Button type="button" variant="secondary" size="sm" onClick={resetToNew}>
            <Plus size={14} />
            Novo
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
            <Save size={14} />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <Card className="mt-4 space-y-3 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">
          <Select value={format} onChange={(e) => setFormat(e.target.value as PostFormat)}>
            {(Object.keys(POST_FORMAT_DIMENSIONS) as PostFormat[]).map((f) => (
              <option key={f} value={f}>
                {POST_FORMAT_DIMENSIONS[f].label}
              </option>
            ))}
          </Select>
          <Input
            type="number"
            min={1}
            max={10}
            value={frameCount}
            onChange={(e) => setFrameCount(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
            placeholder="Quantos frames"
          />
        </div>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder="Cole o prompt com o tema do post/carrossel — a IA gera o fundo e o texto de cada frame automaticamente."
        />
        <Button type="button" onClick={handleGenerate} disabled={generating || !prompt.trim()} className="w-full">
          <Sparkles size={16} />
          {generating ? "Gerando..." : "Gerar"}
        </Button>
      </Card>

      {frames.length > 0 && (
        <div className="mt-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {frames.map((frame, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setEditingIndex(i)}
                className="group relative overflow-hidden rounded-xl border border-border-strong hover:border-accent"
              >
                <ScaledFramePreview frame={frame} canvasWidth={width} canvasHeight={height} targetWidth={240} />
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                  {i + 1}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <CarouselExportControls
              frameCount={frames.length}
              exportIndex={exportIndex}
              setExportIndex={setExportIndex}
              title={title}
            />
            <Button type="button" variant="secondary" size="sm" onClick={() => setFrames([])}>
              Gerar novo conteúdo
            </Button>
          </div>
        </div>
      )}

      {/* Nó de exportação — fora da tela, só usado pra capturar cada frame em resolução real. */}
      <div style={{ position: "absolute", left: -9999, top: 0, width: exportDisplayWidth, height: exportDisplayHeight }}>
        <div id={CAROUSEL_EXPORT_NODE_ID} style={{ width: exportDisplayWidth, height: exportDisplayHeight }}>
          {frames[exportIndex] && <CarouselFramePreview frame={frames[exportIndex]} />}
        </div>
      </div>

      <CarouselFrameEditModal
        frame={editingFrame}
        frameIndex={editingIndex ?? 0}
        canvasWidth={width}
        canvasHeight={height}
        onClose={() => setEditingIndex(null)}
        onChange={(patch) => editingIndex !== null && patchFrame(editingIndex, patch)}
      />
    </div>
  );
}
