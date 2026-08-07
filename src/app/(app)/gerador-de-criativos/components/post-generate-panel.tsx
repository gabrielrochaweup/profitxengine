"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, Copy, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PromptPicker } from "@/components/prompt-picker";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type PostTemplate = Database["public"]["Tables"]["post_prompt_templates"]["Row"];

// Instrução de formatação fixa — sempre embutida no prompt montado (aba
// pré-definida) ou enviada como "system" (aba livre), igual ao truque do
// "DOMINANT COLOR OVERRIDE" já usado no gerador de imagem.
const FORMAT_INSTRUCTION = `INSTRUÇÕES DE FORMATAÇÃO (siga à risca):
- Para negrito, envolva o trecho com **dois asteriscos**.
- Para itálico, envolva o trecho com *um asterisco*.
- Para destacar um trecho curto com marca-texto verde, envolva com ==dois sinais de igual==.
- Não use markdown de título (#), listas, nem emojis, a menos que o pedido explicitamente peça.
- Responda só com o texto do post, sem aspas, sem explicações antes ou depois.`;

function assemblePostPrompt(template: string, detail: string): string {
  const text = template.split("[ITEM 1]").join(detail || "(nenhum)");
  return `${text}\n\n${FORMAT_INSTRUCTION}`;
}

interface PostGeneratePanelProps {
  onGenerated: (body: string, promptId: string | null) => void;
}

export function PostGeneratePanel({ onGenerated }: PostGeneratePanelProps) {
  const [promptMode, setPromptMode] = useState<"livre" | "predefinido">("livre");
  const [prompt, setPrompt] = useState("");
  const [promptId, setPromptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [templates, setTemplates] = useState<PostTemplate[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [detail, setDetail] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("post_prompt_templates").select("*").order("position");
      setTemplates(data ?? []);
      if (data && data.length > 0) setTemplateId(data[0].id);
    }
    load();
  }, []);

  const selectedTemplate = templates.find((t) => t.id === templateId) ?? null;
  const assembledPrompt = useMemo(() => {
    if (!selectedTemplate) return "";
    return assemblePostPrompt(selectedTemplate.body, detail);
  }, [selectedTemplate, detail]);

  async function handleCopy() {
    if (!assembledPrompt) return;
    await navigator.clipboard.writeText(assembledPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleGenerate() {
    const effectivePrompt = promptMode === "predefinido" ? assembledPrompt : prompt;
    if (!effectivePrompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: "mensagem",
          prompt: effectivePrompt,
          system: promptMode === "livre" ? FORMAT_INSTRUCTION : undefined,
          promptId: promptMode === "predefinido" ? undefined : (promptId ?? undefined),
        }),
      });
      const resBody = await res.json();
      if (!res.ok) throw new Error(resBody.error || "Erro ao gerar o post.");
      onGenerated(String(resBody.text ?? "").trim(), promptMode === "predefinido" ? null : promptId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar o post.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">Gerar texto com IA</h3>
        {promptMode === "livre" && (
          <PromptPicker
            preferredSlug="post"
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
          placeholder="Ex: post provocador sobre operar com gerenciamento de risco em vez de tentar acertar tudo."
        />
      ) : (
        <div className="space-y-2 rounded-lg border border-border bg-card-hover/50 p-2.5">
          {templates.length === 0 ? (
            <p className="text-[11px] text-text-muted">Nenhum modelo cadastrado ainda.</p>
          ) : (
            <>
              <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="h-8 w-full text-[11px]">
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>

              <div className="space-y-1">
                <label className="text-[10px] text-text-muted">Detalhe específico (opcional)</label>
                <Input
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="ex: 3 meses operando copy trading"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-text-muted">Prompt montado</label>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[10px] text-accent hover:underline"
                  >
                    {copied ? <Check size={10} /> : <Copy size={10} />}
                    {copied ? "Copiado!" : "Copiar prompt"}
                  </button>
                </div>
                <Textarea value={assembledPrompt} readOnly rows={5} className="w-full font-mono text-[10px]" />
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
        {loading ? "Gerando..." : "Gerar texto com IA"}
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
