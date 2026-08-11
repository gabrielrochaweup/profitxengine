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
import { CarouselExportControls } from "./carousel-export-controls";
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

// Reconhece um prompt colado já dividido por slide ("SLIDE 1 ...\n...",
// "SLIDE 2 ...\n..."). Cada bloco vira o prompt de imagem daquele frame —
// sem essa divisão, o prompt inteiro (todos os slides juntos) seria mandado
// pra cada geração, misturando as descrições. O prompt controla 100% do
// resultado, incluindo texto: se o usuário escrever texto na descrição, o
// modelo de imagem pode desenhá-lo — não há mais overlay separado.
function parseSlidePrompts(raw: string): string[] | null {
  const headerRegex = /^\s*slide\s*\d+.*$/gim;
  const matches = Array.from(raw.matchAll(headerRegex));
  if (matches.length === 0) return null;

  return matches
    .map((match, i) => {
      const start = (match.index ?? 0) + match[0].length;
      const end = i + 1 < matches.length ? matches[i + 1].index! : raw.length;
      return raw.slice(start, end).trim();
    })
    .filter((block) => block.length > 0);
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

  const { width, height } = POST_FORMAT_DIMENSIONS[format];

  function resetToNew() {
    setCurrentId(null);
    setTitle("");
    setFormat("quadrado");
    setFrameCount(3);
    setPrompt("");
    setFrames([]);
  }

  function loadCarousel(carousel: FakeCarousel) {
    setCurrentId(carousel.id);
    setTitle(carousel.title ?? "");
    setFormat(carousel.format);
    setFrames(carousel.frames);
    setFrameCount(carousel.frames.length || 1);
  }

  function generateImageForFrame(imagePrompt: string, index: number) {
    return fetch("/api/ai/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module: "imagem",
        prompt: imagePrompt,
        aspectRatio: FORMAT_ASPECT_RATIO[format],
        quality: "medium",
        contextType: "carrossel",
        contextId: currentId ? `${currentId}-frame-${index}` : `carrossel-rascunho-frame-${index}`,
      }),
    }).then((r) => r.json());
  }

  async function handleGenerate() {
    if (!prompt.trim() || frameCount < 1) return;
    setGenerating(true);
    try {
      const slidePrompts = parseSlidePrompts(prompt);
      const prompts = slidePrompts ?? Array.from({ length: frameCount }, () => prompt);

      const imageBodies = await Promise.all(prompts.map((p, i) => generateImageForFrame(p, i)));
      const built: CarouselFrame[] = imageBodies.map((img) => {
        if (img.error) throw new Error(img.error);
        return { backgroundImageUrl: img.url as string };
      });

      setFrames(built);
      if (slidePrompts) setFrameCount(slidePrompts.length);
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
          placeholder="Cole o prompt — o resultado sai exatamente como descrito, sem edição depois."
        />
        <p className="text-[11px] text-text-muted">
          Dica: pra dar uma imagem própria pra cada frame, cole um bloco por slide no formato{" "}
          <code>SLIDE 1 ... / SLIDE 2 ...</code> — cada bloco vira o prompt de um frame.
        </p>
        <Button type="button" onClick={handleGenerate} disabled={generating || !prompt.trim()} className="w-full">
          <Sparkles size={16} />
          {generating ? "Gerando..." : "Gerar"}
        </Button>
      </Card>

      {frames.length > 0 && (
        <div className="mt-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {frames.map((frame, i) => (
              <div key={i} className="relative overflow-hidden rounded-xl border border-border-strong bg-[#0a0a0c]">
                <div style={{ aspectRatio: `${width} / ${height}` }}>
                  {frame.backgroundImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={frame.backgroundImageUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <CarouselExportControls frames={frames} title={title} />
            <Button type="button" variant="secondary" size="sm" onClick={() => setFrames([])}>
              Gerar novo conteúdo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
