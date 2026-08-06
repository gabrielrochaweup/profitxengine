"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, Copy, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PromptPicker } from "@/components/prompt-picker";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { createClient } from "@/lib/supabase/client";
import type { ConversationMessage, Database, Platform } from "@/lib/supabase/types";

type TestimonialTemplate = Database["public"]["Tables"]["testimonial_prompt_templates"]["Row"];
type TestimonialStyle = Database["public"]["Tables"]["testimonial_prompt_styles"]["Row"];
type TestimonialVariation = Database["public"]["Tables"]["testimonial_prompt_variations"]["Row"];
type TestimonialImageVariant = Database["public"]["Tables"]["testimonial_prompt_image_variants"]["Row"];

// Instrução fixa sobre o atendente — não vem de dropdown porque o pedido foi
// explícito: ele sempre atende do mesmo jeito, uma mensagem só, bom português.
const ATTENDANT_INSTRUCTION = `INSTRUÇÃO FIXA SOBRE O ATENDENTE (sender "right"):
O atendente responde com EXATAMENTE 1 mensagem no total, sempre em português correto e bem escrito, com uma única interação simples e sutil (ex: parabenizar ou agradecer de volta) — sem emojis, sem exagero, direta e cordial. Gere no máximo 2 a 3 mensagens no total somando cliente + atendente, e o cliente é sempre quem fala primeiro e quem agradece pela ajuda e pela equipe da PROFITX antes do fim da conversa.`;

function assembleTestimonialPrompt(
  template: string,
  style: string,
  variation: string,
  imageVariant: string,
  detail: string
): string {
  let text = template.split("[ESTILO]").join(style);
  text = text.split("[VARIACAO]").join(variation);
  text = text.split("[IMAGEM]").join(imageVariant);
  text = text.split("[ITEM 1]").join(detail || "(nenhum)");
  return `${text}\n\n${ATTENDANT_INSTRUCTION}`;
}

interface AiGeneratePanelProps {
  platform: Platform;
  onGenerated: (messages: ConversationMessage[], promptId: string | null) => void;
  hasExistingMessages: boolean;
}

function buildSystemPrompt(platform: Platform) {
  if (platform === "crm") {
    return `Você gera conversas fictícias para simular uma tela de atendimento estilo CRM/suporte ao cliente, com foco no universo de criptomoedas quando fizer sentido pelo contexto pedido.
Responda APENAS com um JSON válido (sem markdown, sem texto antes ou depois) no formato de array de objetos seguindo este schema:
[{"sender":"left"|"right","text":"string","time":"string"}]
"left" é o contato/cliente, "right" é o agente/IA de atendimento. Formate "time" como "16 jul, 10:06" (dia abreviado do mês em português + horário). Gere no máximo 12 mensagens, com horários plausíveis e crescentes.`;
  }
  const platformLabel = platform === "whatsapp" ? "WhatsApp" : "Instagram Direct";
  return `Você gera conversas fictícias para simular telas de chat de ${platformLabel}, com foco no universo de criptomoedas quando fizer sentido pelo contexto pedido.
Responda APENAS com um JSON válido (sem markdown, sem texto antes ou depois) no formato de array de objetos seguindo este schema:
[{"sender":"left"|"right","text":"string","time":"HH:MM","read_status":"sent"|"delivered"|"read"}]
"left" é o contato, "right" é o dono da conta que está simulando a tela. Gere no máximo 12 mensagens, com horários plausíveis e crescentes.`;
}

function parseMessages(raw: string): ConversationMessage[] {
  const cleaned = raw.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error("Formato inesperado.");
  return parsed.map((item) => ({
    sender: item.sender === "right" ? "right" : "left",
    text: String(item.text ?? ""),
    time: String(item.time ?? ""),
    read_status: ["sent", "delivered", "read"].includes(item.read_status) ? item.read_status : "read",
  }));
}

export function AiGeneratePanel({ platform, onGenerated, hasExistingMessages }: AiGeneratePanelProps) {
  const confirm = useConfirm();
  const [promptMode, setPromptMode] = useState<"livre" | "predefinido">("livre");
  const [prompt, setPrompt] = useState("");
  const [promptId, setPromptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [templates, setTemplates] = useState<TestimonialTemplate[]>([]);
  const [styles, setStyles] = useState<TestimonialStyle[]>([]);
  const [variations, setVariations] = useState<TestimonialVariation[]>([]);
  const [imageVariants, setImageVariants] = useState<TestimonialImageVariant[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [styleId, setStyleId] = useState("");
  const [variationId, setVariationId] = useState("");
  const [imageVariantId, setImageVariantId] = useState("");
  const [detail, setDetail] = useState("");
  const [copiedPredefinido, setCopiedPredefinido] = useState(false);

  useEffect(() => {
    async function loadPromptParts() {
      const supabase = createClient();
      const [{ data: t }, { data: s }, { data: v }, { data: iv }] = await Promise.all([
        supabase.from("testimonial_prompt_templates").select("*").order("position"),
        supabase.from("testimonial_prompt_styles").select("*").order("position"),
        supabase.from("testimonial_prompt_variations").select("*").order("position"),
        supabase.from("testimonial_prompt_image_variants").select("*").order("position"),
      ]);
      setTemplates(t ?? []);
      setStyles(s ?? []);
      setVariations(v ?? []);
      setImageVariants(iv ?? []);
      if (t && t.length > 0) setTemplateId(t[0].id);
      if (s && s.length > 0) setStyleId(s[0].id);
      if (v && v.length > 0) setVariationId(v[0].id);
      if (iv && iv.length > 0) setImageVariantId(iv[0].id);
    }
    loadPromptParts();
  }, []);

  const selectedTemplate = templates.find((t) => t.id === templateId) ?? null;
  const selectedStyle = styles.find((s) => s.id === styleId) ?? null;
  const selectedVariation = variations.find((v) => v.id === variationId) ?? null;
  const selectedImageVariant = imageVariants.find((iv) => iv.id === imageVariantId) ?? null;

  const assembledPrompt = useMemo(() => {
    if (!selectedTemplate) return "";
    return assembleTestimonialPrompt(
      selectedTemplate.body,
      selectedStyle?.body ?? "",
      selectedVariation?.body ?? "",
      selectedImageVariant?.body ?? "",
      detail
    );
  }, [selectedTemplate, selectedStyle, selectedVariation, selectedImageVariant, detail]);

  async function handleCopyPredefinido() {
    if (!assembledPrompt) return;
    await navigator.clipboard.writeText(assembledPrompt);
    setCopiedPredefinido(true);
    setTimeout(() => setCopiedPredefinido(false), 1500);
  }

  async function handleGenerate() {
    const effectivePrompt = promptMode === "predefinido" ? assembledPrompt : prompt;
    if (!effectivePrompt.trim()) return;
    if (hasExistingMessages) {
      const ok = await confirm({
        title: "Substituir mensagens",
        description: "Isso vai substituir as mensagens atuais do editor. Continuar?",
        confirmLabel: "Substituir",
      });
      if (!ok) return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: "conversa",
          prompt: effectivePrompt,
          system: buildSystemPrompt(platform),
          promptId: promptMode === "predefinido" ? undefined : promptId ?? undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Erro ao gerar conversa.");

      const messages = parseMessages(body.text);
      onGenerated(messages, promptMode === "predefinido" ? null : promptId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar conversa.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">Gerar com IA</h3>
        {promptMode === "livre" && (
          <PromptPicker
            preferredSlug="conversa"
            onSelect={(saved) => {
              setPrompt(saved.content);
              setPromptId(saved.id);
            }}
          />
        )}
      </div>

      <div className="flex gap-1.5">
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
          rows={4}
          placeholder="Ex: conversa entre cliente e vendedor negociando uma carteira de cripto, cliente com objeção de preço e depois fechando."
        />
      ) : (
        <div className="space-y-2 rounded-lg border border-border bg-card-hover/50 p-2.5">
          {templates.length === 0 ? (
            <p className="text-[11px] text-text-muted">
              Nenhum cenário cadastrado ainda — cadastre em Simulador de Conversas → Modelos de prompt.
            </p>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-[10px] text-text-muted">Cenário</label>
                <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="h-8 w-full text-[11px]">
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-text-muted">Qualidade do português</label>
                  <Select value={styleId} onChange={(e) => setStyleId(e.target.value)} className="h-8 text-[11px]">
                    {styles.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-text-muted">Com ou sem imagem</label>
                  <Select
                    value={imageVariantId}
                    onChange={(e) => setImageVariantId(e.target.value)}
                    className="h-8 text-[11px]"
                  >
                    {imageVariants.map((iv) => (
                      <option key={iv.id} value={iv.id}>
                        {iv.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-text-muted">Variação de interação</label>
                <Select value={variationId} onChange={(e) => setVariationId(e.target.value)} className="h-8 w-full text-[11px]">
                  {variations.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-text-muted">Detalhe específico (opcional)</label>
                <Input
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="ex: bateu a meta de R$5 mil no mês"
                  className="h-8 text-xs"
                />
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
                <Textarea value={assembledPrompt} readOnly rows={6} className="w-full font-mono text-[10px]" />
              </div>
            </>
          )}
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button
        type="button"
        onClick={handleGenerate}
        disabled={loading || !(promptMode === "predefinido" ? assembledPrompt : prompt).trim()}
        className="w-full"
      >
        <Sparkles size={16} />
        {loading ? "Gerando..." : "Gerar conversa com IA"}
      </Button>
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
        active ? "bg-accent text-white" : "border border-border-strong text-text-secondary hover:bg-card-hover"
      }`}
    >
      {children}
    </button>
  );
}
