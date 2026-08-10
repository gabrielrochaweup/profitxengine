"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ImageGenerationPanel } from "@/components/image-generation-panel";
import type { CarouselFrame, CarouselHeadlinePosition, CarouselScrimPosition, PostAccent } from "@/lib/supabase/types";

interface CarouselFrameEditorProps {
  frame: CarouselFrame;
  contextId: string | null;
  onChange: (patch: Partial<CarouselFrame>) => void;
}

export function CarouselFrameEditor({ frame, contextId, onChange }: CarouselFrameEditorProps) {
  return (
    <div className="space-y-4">
      <ImageGenerationPanel
        contextType="carrossel"
        contextId={contextId}
        value={frame.backgroundImageUrl}
        onChange={(url) => onChange({ backgroundImageUrl: url })}
        label="Gerar fundo com IA"
        placeholder="Descreva o fundo que você quer gerar pra esse frame..."
        rows={3}
      />

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">Escurecimento (pra legibilidade do texto)</label>
        <Select
          value={frame.scrimPosition}
          onChange={(e) => onChange({ scrimPosition: e.target.value as CarouselScrimPosition })}
        >
          <option value="nenhum">Nenhum</option>
          <option value="topo">Topo</option>
          <option value="rodape">Rodapé</option>
          <option value="ambos">Topo e rodapé</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Data (opcional)</label>
          <Input
            value={frame.dateText}
            onChange={(e) => onChange({ dateText: e.target.value })}
            placeholder="Ex: 30 de julho, 2026"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Categoria (opcional)</label>
          <Input
            value={frame.categoryText}
            onChange={(e) => onChange({ categoryText: e.target.value })}
            placeholder="Ex: Notícias"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-text-secondary">Título</label>
          <Select
            value={frame.headlinePosition}
            onChange={(e) => onChange({ headlinePosition: e.target.value as CarouselHeadlinePosition })}
            className="h-7 w-32 text-xs"
          >
            <option value="topo">No topo</option>
            <option value="rodape">No rodapé</option>
          </Select>
        </div>
        <Textarea
          value={frame.headline}
          onChange={(e) => onChange({ headline: e.target.value })}
          rows={3}
          placeholder="Ex: Você woke up e viu o mercado ==dispara ou desaba==?"
        />
        <p className="text-[11px] text-text-muted">
          Sintaxe: <code>==destaque na cor de acento==</code>
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">Subtítulo (opcional)</label>
        <Input
          value={frame.subtitle}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder="Linha menor abaixo do título"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">Texto do botão (CTA, opcional)</label>
        <Input
          value={frame.ctaText}
          onChange={(e) => onChange({ ctaText: e.target.value })}
          placeholder="Ex: Arraste para o lado →"
        />
      </div>

      <label className="flex items-center gap-1.5 text-xs text-text-secondary">
        <input
          type="checkbox"
          checked={frame.showLogo}
          onChange={(e) => onChange({ showLogo: e.target.checked })}
        />
        Mostrar logo da PROFITX
      </label>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">Cor de destaque</label>
        <Select value={frame.accent} onChange={(e) => onChange({ accent: e.target.value as PostAccent })}>
          <option value="dourado">Dourado</option>
          <option value="azul">Azul</option>
          <option value="verde">Verde</option>
        </Select>
      </div>
    </div>
  );
}
