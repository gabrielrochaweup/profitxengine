"use client";

import { useState } from "react";
import { Copy, Sparkles, RotateCcw, Check, X, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { PromptPicker } from "@/components/prompt-picker";
import { ImageGenerationPanel } from "@/components/image-generation-panel";
import type { Database, TradingWindow } from "@/lib/supabase/types";

type MessageDynamicSlot = Database["public"]["Tables"]["message_dynamic_slots"]["Row"];

interface MessageRowProps {
  slot: MessageDynamicSlot;
  computedText: string;
  overrideText?: string;
  blocked: boolean;
  needsRealtimeUpdate: boolean;
  chars: number;
  charLevel: "normal" | "high" | "veryhigh";
  fonte: TradingWindow;
  onFonteChange: (fonte: TradingWindow) => void;
  onUseVariant: (text: string) => void;
  onRestoreOriginal: () => void;
}

const WINDOWS: TradingWindow[] = ["dia", "semana", "mes", "total"];

export function MessageRow({
  slot,
  computedText,
  overrideText,
  blocked,
  needsRealtimeUpdate,
  chars,
  charLevel,
  fonte,
  onFonteChange,
  onUseVariant,
  onRestoreOriginal,
}: MessageRowProps) {
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [instructionPromptId, setInstructionPromptId] = useState<string | null>(null);
  const [ctaValue, setCtaValue] = useState("");
  const [showCtaInput, setShowCtaInput] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [textExpanded, setTextExpanded] = useState(false);

  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const activeText = overrideText ?? computedText;

  async function generate(promptInstruction: string, promptId?: string | null) {
    setGenerating(true);
    setError(null);
    setPreview(null);
    try {
      const res = await fetch("/api/ai/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: "mensagem",
          prompt: `${promptInstruction}\n\nMensagem original:\n${activeText}`,
          promptId: promptId ?? undefined,
          performanceScope: "grupo",
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Erro ao gerar variação.");
      setPreview(body.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar variação.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(activeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full rounded-xl border p-3 text-left transition-colors hover:border-accent ${
          blocked
            ? "border-danger bg-danger/10"
            : needsRealtimeUpdate
              ? "border-warning bg-warning/10"
              : "border-border"
        }`}
      >
        {needsRealtimeUpdate && (
          <p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-warning">
            ⏱️ TEMPO REAL — confira/atualize o conteúdo antes de agendar
          </p>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-medium ${needsRealtimeUpdate ? "text-warning" : "text-text-primary"}`}>
            {slot.time_label}
          </span>
          <span
            className={`shrink-0 rounded-button px-2 py-0.5 text-[10px] ${
              charLevel === "veryhigh"
                ? "bg-danger/20 text-danger"
                : charLevel === "high"
                  ? "bg-warning/20 text-warning"
                  : "bg-card-hover text-text-muted"
            }`}
          >
            {chars}
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-text-secondary">{slot.role_label}</p>
        <p className="mt-1 line-clamp-2 text-[11px] text-text-muted">{activeText.split("\n")[0]}</p>
        {overrideText && (
          <span className="mt-2 inline-block rounded-button bg-accent/15 px-2 py-0.5 text-[10px] text-accent">
            personalizada
          </span>
        )}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`${slot.time_label} · ${slot.role_label}`}
        className="max-w-[76.8rem]"
      >
        {blocked && (
          <p className="mb-3 rounded-lg bg-danger px-2 py-1.5 text-center text-[11px] font-bold text-white">
            ⚠️ RESULTADO NEGATIVO — NÃO ENVIAR ESTA MENSAGEM
          </p>
        )}

        <div className="grid gap-2 lg:h-[68vh] lg:grid-cols-3 lg:gap-3">
          {/* Coluna 1: mensagem principal (rola internamente, não precisa mostrar tudo de cara) */}
          <div className="flex min-h-0 flex-col gap-2 overflow-hidden lg:gap-3 lg:pr-1">
            <div className="flex items-center justify-between gap-2">
              {slot.has_fonte_selector ? (
                <Select value={fonte} onChange={(e) => onFonteChange(e.target.value as TradingWindow)} className="h-7 w-28 text-[11px]">
                  {WINDOWS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </Select>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-1.5">
                {overrideText && (
                  <Button type="button" variant="ghost" size="sm" onClick={onRestoreOriginal} className="h-7 px-2 text-[11px]">
                    <RotateCcw size={12} />
                    Restaurar original
                  </Button>
                )}
                <Button type="button" variant={blocked ? "secondary" : "primary"} size="sm" disabled={blocked} onClick={handleCopy} className="h-7 px-2 text-[11px]">
                  <Copy size={12} />
                  {blocked ? "Bloqueado" : copied ? "Copiado!" : "Copiar"}
                </Button>
              </div>
            </div>

            <p
              className={cn(
                "min-h-0 overflow-y-auto whitespace-pre-wrap rounded-lg bg-card-hover p-3 text-xs text-text-primary",
                textExpanded ? "max-h-none" : "max-h-32",
                "lg:max-h-none lg:flex-1",
                blocked && "opacity-50 grayscale"
              )}
            >
              {activeText}
            </p>

            <button
              type="button"
              onClick={() => setTextExpanded((v) => !v)}
              className="flex shrink-0 items-center gap-1.5 self-start rounded-button border border-border-strong px-2 py-1 text-[11px] text-text-secondary hover:bg-card-hover lg:hidden"
            >
              {textExpanded ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
              {textExpanded ? "Recolher mensagem" : "Ver mensagem completa"}
            </button>

            {slot.media_suggestion && (
              <p className="shrink-0 rounded-lg border-l-2 border-accent-pink bg-accent-pink/10 px-2 py-1.5 text-[11px] text-text-secondary">
                🎬 {slot.media_suggestion}
              </p>
            )}
            {slot.expert_hint && (
              <p className="shrink-0 rounded-lg border-l-2 border-accent bg-accent/10 px-2 py-1.5 text-[11px] text-text-secondary">
                🎙️ {slot.expert_hint}
              </p>
            )}
          </div>

          {/* Coluna 2: gerar texto com IA */}
          <div className="flex min-h-0 flex-col overflow-y-auto rounded-lg border border-dashed border-border-strong p-3">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-text-secondary">
              <Sparkles size={12} />
              Gerar variação com IA
            </p>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => generate("Reescreva a mensagem abaixo de forma mais curta e direta, mantendo a mesma oferta e tom.")}
                disabled={generating}
                className="rounded-button border border-border-strong px-2.5 py-1 text-[11px] text-text-secondary hover:bg-card-hover disabled:opacity-50"
              >
                Mais curta
              </button>
              <button
                type="button"
                onClick={() => generate("Reescreva a mensagem abaixo de forma mais longa e detalhada, mantendo a mesma oferta e tom.")}
                disabled={generating}
                className="rounded-button border border-border-strong px-2.5 py-1 text-[11px] text-text-secondary hover:bg-card-hover disabled:opacity-50"
              >
                Mais longa
              </button>
              <button
                type="button"
                onClick={() => setShowCtaInput((v) => !v)}
                className="rounded-button border border-border-strong px-2.5 py-1 text-[11px] text-text-secondary hover:bg-card-hover"
              >
                Trocar CTA
              </button>
            </div>

            {showCtaInput && (
              <div className="mt-2 flex gap-2">
                <Input
                  value={ctaValue}
                  onChange={(e) => setCtaValue(e.target.value)}
                  placeholder="Novo CTA (ex: garanta sua vaga agora)"
                  className="h-8 flex-1 text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={!ctaValue.trim() || generating}
                  onClick={() => generate(`Reescreva a mensagem abaixo trocando a chamada para ação (CTA) para: "${ctaValue}". Mantenha o resto do conteúdo e o tom.`)}
                >
                  Aplicar
                </Button>
              </div>
            )}

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <label className="text-[11px] text-text-muted">Ou descreva a variação que você quer</label>
              <PromptPicker
                preferredSlug="mensagem"
                onSelect={(p) => {
                  setInstruction(p.content);
                  setInstructionPromptId(p.id);
                }}
              />
            </div>
            <div className="mt-1.5 space-y-2">
              <Textarea
                value={instruction}
                onChange={(e) => {
                  setInstruction(e.target.value);
                  setInstructionPromptId(null);
                }}
                rows={2}
                placeholder="Ex: deixe mais urgente, foque no benefício X..."
                className="w-full text-xs"
              />
              <Button
                type="button"
                size="sm"
                className="w-full"
                disabled={!instruction.trim() || generating}
                onClick={() => generate(instruction, instructionPromptId)}
              >
                {generating ? "Gerando..." : "Gerar"}
              </Button>
            </div>

            {error && <p className="mt-2 text-xs text-danger">{error}</p>}

            {preview && (
              <div className="mt-3 rounded-lg border border-accent/40 bg-accent/5 p-3">
                <p className="mb-1.5 text-[11px] font-medium text-accent">Sugestão gerada</p>
                <p className="max-h-40 overflow-y-auto whitespace-pre-wrap text-xs text-text-primary">{preview}</p>
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      onUseVariant(preview);
                      setPreview(null);
                      setInstruction("");
                    }}
                  >
                    <Check size={12} />
                    Usar esta versão
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setPreview(null)}>
                    <X size={12} />
                    Descartar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Coluna 3: gerar imagem com IA */}
          <div className="min-h-0 overflow-y-auto">
            <ImageGenerationPanel
              contextType="dinamica_slot"
              contextId={slot.dynamic_id}
              value={generatedImageUrl}
              onChange={setGeneratedImageUrl}
              label="Gerar imagem para essa mensagem"
              placeholder={slot.media_suggestion || "Descreva a imagem para essa mensagem..."}
              rows={2}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
