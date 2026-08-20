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

type ClientLocale = "br" | "us" | "es";

// Instrução fixa sobre o atendente — não vem de dropdown porque o pedido foi
// explícito: ele sempre atende do mesmo jeito, uma mensagem só, bem escrita.
// Muda de idioma junto com o cliente (brasileiro/americano/latino) pra não
// conflitar com a instrução de idioma do prompt principal.
function getAttendantInstruction(locale: ClientLocale): string {
  if (locale === "us") {
    return `FIXED INSTRUCTION ABOUT THE AGENT (sender "right"):
The agent replies with EXACTLY 1 message in total, always in natural, well-written American English, with a single simple and subtle interaction (e.g. congratulating or thanking back) — no emojis, no exaggeration, direct and polite. Generate at most 2 to 3 messages in total between client + agent, and the client always speaks first and thanks the team before the end of the conversation.`;
  }
  if (locale === "es") {
    return `INSTRUCCIÓN FIJA SOBRE EL AGENTE (sender "right"):
El agente responde con EXACTAMENTE 1 mensaje en total, siempre en español latinoamericano natural y bien escrito (evita "vosotros"/"vale"/modismos de España — usa "ustedes" y un tono neutro de Latinoamérica), con una única interacción simple y sutil (ej: felicitar o agradecer de vuelta) — sin emojis, sin exagerar, directo y cordial. Genera como máximo 2 a 3 mensajes en total entre cliente y agente, y el cliente siempre habla primero y agradece al equipo antes de terminar la conversación.`;
  }
  return `INSTRUÇÃO FIXA SOBRE O ATENDENTE (sender "right"):
O atendente responde com EXATAMENTE 1 mensagem no total, sempre em português correto e bem escrito, com uma única interação simples e sutil (ex: parabenizar ou agradecer de volta) — sem emojis, sem exagero, direta e cordial. Gere no máximo 2 a 3 mensagens no total somando cliente + atendente, e o cliente é sempre quem fala primeiro e quem agradece pela ajuda antes do fim da conversa.`;
}

function assembleTestimonialPrompt(
  template: string,
  style: string,
  variation: string,
  imageVariant: string,
  detail: string,
  locale: ClientLocale
): string {
  let text = template.split("[ESTILO]").join(style);
  text = text.split("[VARIACAO]").join(variation);
  text = text.split("[IMAGEM]").join(imageVariant);
  text = text.split("[ITEM 1]").join(detail || "(nenhum)");
  return `${text}\n\n${getAttendantInstruction(locale)}`;
}

interface AiGeneratePanelProps {
  platform: Platform;
  onGenerated: (
    messages: ConversationMessage[],
    promptId: string | null,
    contactName: string | null,
    contactHandle: string | null
  ) => void;
  hasExistingMessages: boolean;
}

function buildSystemPrompt(platform: Platform, locale: ClientLocale) {
  const localeInstruction =
    locale === "us"
      ? `O contato é um cliente americano, dos EUA — gere um "contact_name" tipicamente americano pra ele, e escreva TODAS as mensagens (do contato e do atendente) em inglês americano natural.`
      : locale === "es"
        ? `O contato é um cliente latino-americano (não da Espanha) — gere um "contact_name" típico de algum país da América Latina (México, Colômbia, Argentina, Chile, Peru etc.), e escreva TODAS as mensagens (do contato e do atendente) em espanhol latino-americano natural, evitando "vosotros" e expressões tipicamente espanholas.`
        : `O contato é um cliente brasileiro — gere um "contact_name" tipicamente brasileiro pra ele, e escreva as mensagens em português.`;

  if (platform === "crm") {
    return `Você gera conversas fictícias para simular uma tela de atendimento estilo CRM/suporte ao cliente, com foco no universo de criptomoedas quando fizer sentido pelo contexto pedido.
${localeInstruction}
Responda APENAS com um JSON válido (sem markdown, sem texto antes ou depois) seguindo este schema:
{"contact_name":"string","messages":[{"sender":"left"|"right","text":"string","time":"string"}]}
"left" é o contato/cliente, "right" é o agente/IA de atendimento. Formate "time" como "16 jul, 10:06" (dia abreviado do mês + horário, no idioma da conversa). Gere no máximo 12 mensagens em "messages", com horários plausíveis e crescentes.`;
  }
  const platformLabel = platform === "whatsapp" ? "WhatsApp" : "Instagram Direct";
  const handleField =
    platform === "instagram"
      ? `,"contact_handle":"string (nome de usuário estilo Instagram pro contato — minúsculo, sem espaço, ex: ana.trader23)"`
      : "";
  return `Você gera conversas fictícias para simular telas de chat de ${platformLabel}, com foco no universo de criptomoedas quando fizer sentido pelo contexto pedido.
${localeInstruction}
Responda APENAS com um JSON válido (sem markdown, sem texto antes ou depois) seguindo este schema:
{"contact_name":"string"${handleField},"messages":[{"sender":"left"|"right","text":"string","time":"HH:MM","read_status":"sent"|"delivered"|"read"}]}
"left" é o contato, "right" é o dono da conta que está simulando a tela. Gere no máximo 12 mensagens em "messages", com horários plausíveis e crescentes.`;
}

interface GeneratedConversation {
  contactName: string | null;
  contactHandle: string | null;
  messages: ConversationMessage[];
}

function parseGeneratedConversation(raw: string): GeneratedConversation {
  const cleaned = raw.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(cleaned);
  // Fallback pro formato antigo (array puro) caso o modelo ignore o schema novo.
  const rawMessages = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.messages) ? parsed.messages : null;
  if (!rawMessages) throw new Error("Formato inesperado.");

  const messages: ConversationMessage[] = rawMessages.map((item: Record<string, unknown>) => ({
    sender: item.sender === "right" ? "right" : "left",
    text: String(item.text ?? ""),
    time: String(item.time ?? ""),
    read_status: ["sent", "delivered", "read"].includes(item.read_status as string)
      ? (item.read_status as "sent" | "delivered" | "read")
      : "read",
  }));

  const contactName = typeof parsed?.contact_name === "string" && parsed.contact_name.trim() ? parsed.contact_name.trim() : null;
  const contactHandle =
    typeof parsed?.contact_handle === "string" && parsed.contact_handle.trim() ? parsed.contact_handle.trim() : null;

  return { contactName, contactHandle, messages };
}

export function AiGeneratePanel({ platform, onGenerated, hasExistingMessages }: AiGeneratePanelProps) {
  const confirm = useConfirm();
  const [locale, setLocale] = useState<ClientLocale>("br");
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
      detail,
      locale
    );
  }, [selectedTemplate, selectedStyle, selectedVariation, selectedImageVariant, detail, locale]);

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
          system: buildSystemPrompt(platform, locale),
          promptId: promptMode === "predefinido" ? undefined : promptId ?? undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Erro ao gerar conversa.");

      const { contactName, contactHandle, messages } = parseGeneratedConversation(body.text);
      onGenerated(messages, promptMode === "predefinido" ? null : promptId, contactName, contactHandle);
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

      <div className="space-y-1">
        <label className="text-[10px] text-text-muted">Cliente</label>
        <Select value={locale} onChange={(e) => setLocale(e.target.value as ClientLocale)} className="h-8 w-full text-[11px]">
          <option value="br">Cliente brasileiro</option>
          <option value="us">Cliente americano</option>
          <option value="es">Cliente latino (espanhol)</option>
        </Select>
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
