"use client";

import { useState } from "react";
import { Plus, Save, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { CarouselFrameEditor } from "./carousel-frame-editor";
import { CarouselFramePreview } from "./carousel-frame-preview";
import { CarouselExportControls, CAROUSEL_EXPORT_NODE_ID } from "./carousel-export-controls";
import { CarouselHistoryPanel } from "./carousel-history-panel";
import { POST_FORMAT_DIMENSIONS, PREVIEW_DISPLAY_WIDTH } from "./post-preview";
import type { CarouselFrame, Database, PostFormat } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type FakeCarousel = Database["public"]["Tables"]["fake_carousels"]["Row"];

interface CarouselPanelProps {
  initialCarousels: FakeCarousel[];
  currentUserId: string;
}

const DEFAULT_FRAME: CarouselFrame = {
  backgroundImageUrl: null,
  scrimPosition: "rodape",
  dateText: "",
  categoryText: "",
  headline: "",
  headlinePosition: "rodape",
  subtitle: "",
  ctaText: "",
  showLogo: true,
  accent: "dourado",
};

export function CarouselPanel({ initialCarousels, currentUserId }: CarouselPanelProps) {
  const toast = useToast();
  const confirm = useConfirm();

  const [carousels, setCarousels] = useState<FakeCarousel[]>(initialCarousels);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [format, setFormat] = useState<PostFormat>("quadrado");
  const [frames, setFrames] = useState<CarouselFrame[]>([{ ...DEFAULT_FRAME }]);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);

  const { width, height } = POST_FORMAT_DIMENSIONS[format];
  const displayHeight = (PREVIEW_DISPLAY_WIDTH * height) / width;
  const activeFrame = frames[activeFrameIndex] ?? DEFAULT_FRAME;

  function resetToNew() {
    setCurrentId(null);
    setTitle("");
    setFormat("quadrado");
    setFrames([{ ...DEFAULT_FRAME }]);
    setActiveFrameIndex(0);
  }

  function loadCarousel(carousel: FakeCarousel) {
    setCurrentId(carousel.id);
    setTitle(carousel.title ?? "");
    setFormat(carousel.format);
    setFrames(carousel.frames.length > 0 ? carousel.frames : [{ ...DEFAULT_FRAME }]);
    setActiveFrameIndex(0);
  }

  function patchActiveFrame(patch: Partial<CarouselFrame>) {
    setFrames((prev) => prev.map((f, i) => (i === activeFrameIndex ? { ...f, ...patch } : f)));
  }

  function addFrame() {
    setFrames((prev) => [...prev, { ...DEFAULT_FRAME }]);
    setActiveFrameIndex(frames.length);
  }

  async function removeFrame(index: number) {
    if (frames.length <= 1) return;
    const frame = frames[index];
    const hasContent = Boolean(frame.backgroundImageUrl || frame.headline || frame.subtitle);
    if (hasContent) {
      const ok = await confirm({
        title: "Remover frame",
        description: `Remover o frame ${index + 1}? Essa ação não pode ser desfeita.`,
        confirmLabel: "Remover",
        danger: true,
      });
      if (!ok) return;
    }
    setFrames((prev) => prev.filter((_, i) => i !== index));
    setActiveFrameIndex((prev) => Math.max(0, prev >= index ? prev - 1 : prev));
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
        toast.success("Carrossel salvo.");
      } else {
        toast.error("Erro ao salvar o carrossel. Tente novamente.");
      }
    } else {
      const { data, error } = await supabase.from("fake_carousels").insert(payload).select().single();
      if (!error && data) {
        setCurrentId(data.id);
        setCarousels((prev) => [data, ...prev]);
        toast.success("Carrossel salvo.");
      } else {
        toast.error("Erro ao salvar o carrossel. Tente novamente.");
      }
    }
    setSaving(false);
  }

  async function handleDelete(carousel: FakeCarousel) {
    const ok = await confirm({
      title: "Excluir carrossel",
      description: `Excluir o carrossel "${carousel.title || "sem título"}"? Essa ação não pode ser desfeita.`,
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
      toast.error("Erro ao excluir o carrossel. Tente novamente.");
    }
  }

  return (
    <div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do carrossel (opcional, só pra organizar)"
            className="max-w-xs"
          />
          <Select
            value={format}
            onChange={(e) => setFormat(e.target.value as PostFormat)}
            className="h-10 w-44 text-sm"
          >
            {(Object.keys(POST_FORMAT_DIMENSIONS) as PostFormat[]).map((f) => (
              <option key={f} value={f}>
                {POST_FORMAT_DIMENSIONS[f].label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CarouselHistoryPanel carousels={carousels} onSelect={loadCarousel} onDelete={handleDelete} />
          <Button type="button" variant="secondary" size="sm" onClick={resetToNew}>
            <Plus size={14} />
            Novo carrossel
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
            <Save size={14} />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {frames.map((_, i) => (
          <div key={i} className="group relative">
            <button
              type="button"
              onClick={() => setActiveFrameIndex(i)}
              className={cn(
                "flex h-9 min-w-9 items-center justify-center rounded-button border px-3 text-sm font-medium transition-colors",
                i === activeFrameIndex
                  ? "border-accent bg-accent text-white"
                  : "border-border-strong text-text-secondary hover:bg-card-hover"
              )}
            >
              {i + 1}
            </button>
            {frames.length > 1 && (
              <button
                type="button"
                onClick={() => removeFrame(i)}
                title="Remover frame"
                className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addFrame}
          title="Adicionar frame"
          className="flex h-9 w-9 items-center justify-center rounded-button border border-dashed border-border-strong text-text-secondary hover:bg-card-hover"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_560px]">
        <div className="space-y-6">
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-medium text-text-primary">Frame {activeFrameIndex + 1}</h3>
            <CarouselFrameEditor
              frame={activeFrame}
              contextId={currentId ? `${currentId}-frame-${activeFrameIndex}` : null}
              onChange={patchActiveFrame}
            />
          </Card>
        </div>

        <div className="mx-auto w-full max-w-[560px]">
          <Card className="flex flex-col items-center gap-4 overflow-x-auto p-6">
            <div
              id={CAROUSEL_EXPORT_NODE_ID}
              className="relative shrink-0 overflow-hidden"
              style={{ width: PREVIEW_DISPLAY_WIDTH, height: displayHeight }}
            >
              <CarouselFramePreview frame={activeFrame} />
            </div>
            <CarouselExportControls
              frameCount={frames.length}
              activeFrameIndex={activeFrameIndex}
              setActiveFrameIndex={setActiveFrameIndex}
              title={title}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
