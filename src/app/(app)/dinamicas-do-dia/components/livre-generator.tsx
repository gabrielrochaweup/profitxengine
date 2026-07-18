"use client";

import { useEffect, useState } from "react";
import { Sparkles, Copy, Trash2, Plus, ThumbsUp, ThumbsDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PromptPicker } from "@/components/prompt-picker";
import { ImageGenerationPanel } from "@/components/image-generation-panel";
import { useToast } from "@/components/ui/toast";
import { ApprovalContextPanel } from "../../calendario/components/approval-context-panel";
import { DayNewsPreview } from "../../calendario/components/day-news-preview";
import type { Database, EngagementResult, EngagementStatus } from "@/lib/supabase/types";

type EngagementMessage = Database["public"]["Tables"]["engagement_messages"]["Row"];

interface LivreGeneratorProps {
  dateKey: string;
  messages: EngagementMessage[];
  currentUserId: string;
  onSaved: (message: EngagementMessage) => void;
  onDeleted: (id: string) => void;
}

const EMPTY_FORM = {
  id: null as string | null,
  textPrompt: "",
  textPromptId: null as string | null,
  generatedText: "",
  generatedImageUrl: null as string | null,
  status: "rascunho" as EngagementStatus,
  result: null as EngagementResult,
  notes: "",
  tema: "",
  newsReference: null as string | null,
};

export function LivreGenerator({ dateKey, messages, currentUserId, onSaved, onDeleted }: LivreGeneratorProps) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setForm(EMPTY_FORM);
  }, [dateKey]);

  function loadIntoForm(message: EngagementMessage) {
    setForm({
      id: message.id,
      textPrompt: "",
      textPromptId: message.text_prompt_id,
      generatedText: message.generated_text ?? "",
      generatedImageUrl: message.generated_image_url,
      status: message.status,
      result: message.result,
      notes: message.notes ?? "",
      tema: message.tema ?? "",
      newsReference: message.news_reference,
    });
  }

  async function handleGenerate() {
    if (!form.textPrompt.trim()) {
      setGenError("Escreva ou selecione um prompt de texto.");
      return;
    }
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/ai/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: "mensagem",
          prompt: form.textPrompt,
          promptId: form.textPromptId ?? undefined,
          performanceScope: "grupo",
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Erro ao gerar texto.");
      setForm((prev) => ({ ...prev, generatedText: body.text }));
    } catch (error) {
      setGenError(error instanceof Error ? error.message : "Erro ao gerar texto.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    if (!form.generatedText) return;
    await navigator.clipboard.writeText(form.generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      scheduled_date: dateKey,
      text_prompt_id: form.textPromptId,
      image_prompt_id: null,
      generated_text: form.generatedText || null,
      generated_image_url: form.generatedImageUrl,
      status: form.status,
      result: form.result,
      notes: form.notes || null,
      tema: form.tema || null,
      news_reference: form.newsReference,
      created_by: currentUserId,
    };

    if (form.id) {
      const { data, error } = await supabase
        .from("engagement_messages")
        .update(payload)
        .eq("id", form.id)
        .select()
        .single();
      if (!error && data) {
        onSaved(data);
        toast.success("Mensagem salva.");
      } else {
        toast.error("Erro ao salvar a mensagem. Tente novamente.");
      }
    } else {
      const { data, error } = await supabase.from("engagement_messages").insert(payload).select().single();
      if (!error && data) {
        onSaved(data);
        setForm((prev) => ({ ...prev, id: data.id }));
        toast.success("Mensagem salva.");
      } else {
        toast.error("Erro ao salvar a mensagem. Tente novamente.");
      }
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!form.id) return;
    if (!confirm("Excluir esta mensagem?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("engagement_messages").delete().eq("id", form.id);
    if (!error) {
      onDeleted(form.id);
      setForm(EMPTY_FORM);
    } else {
      toast.error("Erro ao excluir a mensagem. Tente novamente.");
    }
  }

  return (
    <div className="space-y-4">
      {messages.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {messages.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => loadIntoForm(m)}
              className={`rounded-button border px-2.5 py-1 text-xs ${
                form.id === m.id
                  ? "border-accent bg-accent/15 text-text-primary"
                  : "border-border-strong text-text-secondary hover:bg-card-hover"
              }`}
            >
              {m.tema || m.generated_text?.slice(0, 20) || "Sem título"}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setForm(EMPTY_FORM)}
            className="flex items-center gap-1 rounded-button border border-dashed border-border-strong px-2.5 py-1 text-xs text-text-secondary hover:bg-card-hover"
          >
            <Plus size={12} />
            Nova
          </button>
        </div>
      )}

      <ApprovalContextPanel scope="grupo" />

      <Card className="p-4">
        <DayNewsPreview dateKey={dateKey} />
      </Card>

      {form.newsReference && (
        <p className="rounded-lg border border-border bg-card-hover px-2.5 py-1.5 text-xs text-text-secondary">
          Gancho selecionado: {form.newsReference}
        </p>
      )}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-text-secondary">Prompt de texto</label>
          <PromptPicker
            category="mensagem"
            onSelect={(p) => setForm((prev) => ({ ...prev, textPrompt: p.content, textPromptId: p.id }))}
          />
        </div>
        <Textarea
          value={form.textPrompt}
          onChange={(e) => setForm((prev) => ({ ...prev, textPrompt: e.target.value, textPromptId: null }))}
          rows={4}
          placeholder="Prompt para gerar a mensagem do grupo"
        />
      </div>

      {genError && <p className="text-sm text-danger">{genError}</p>}

      <Button type="button" onClick={handleGenerate} disabled={generating} className="w-full">
        <Sparkles size={16} />
        {generating ? "Gerando..." : "Gerar mensagem"}
      </Button>

      {form.generatedText && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-text-secondary">Mensagem gerada</label>
            <Button type="button" variant="ghost" size="sm" onClick={handleCopy} className="h-6 px-2 text-[11px]">
              <Copy size={12} />
              {copied ? "Copiado!" : "Copiar formatado"}
            </Button>
          </div>
          <Textarea
            value={form.generatedText}
            onChange={(e) => setForm((prev) => ({ ...prev, generatedText: e.target.value }))}
            rows={6}
          />
        </div>
      )}

      <ImageGenerationPanel
        contextType="livre_engagement"
        contextId={form.id}
        value={form.generatedImageUrl}
        onChange={(url) => setForm((prev) => ({ ...prev, generatedImageUrl: url }))}
        label="Gerar imagem correspondente"
        placeholder="Prompt para gerar a imagem correspondente"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Status</label>
          <Select
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as EngagementStatus }))}
          >
            <option value="rascunho">Rascunho</option>
            <option value="aprovada">Aprovada</option>
            <option value="enviada">Enviada</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Tema/tag</label>
          <Input
            value={form.tema}
            onChange={(e) => setForm((prev) => ({ ...prev, tema: e.target.value }))}
            placeholder="promoção, prova social..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Resultado</label>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, result: prev.result === "funcionou" ? null : "funcionou" }))}
              className={`flex h-10 flex-1 items-center justify-center rounded-input border ${
                form.result === "funcionou"
                  ? "border-success bg-success/15 text-success"
                  : "border-border-strong text-text-secondary hover:bg-card-hover"
              }`}
            >
              <ThumbsUp size={15} />
            </button>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, result: prev.result === "nao_funcionou" ? null : "nao_funcionou" }))
              }
              className={`flex h-10 flex-1 items-center justify-center rounded-input border ${
                form.result === "nao_funcionou"
                  ? "border-danger bg-danger/15 text-danger"
                  : "border-border-strong text-text-secondary hover:bg-card-hover"
              }`}
            >
              <ThumbsDown size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">Nota livre</label>
        <Textarea
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          rows={2}
          placeholder="O que funcionou ou não nessa estratégia?"
        />
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        {form.id ? (
          <Button type="button" variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 size={14} />
            Excluir
          </Button>
        ) : (
          <span />
        )}
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : form.id ? "Salvar alterações" : "Salvar mensagem"}
        </Button>
      </div>
    </div>
  );
}
