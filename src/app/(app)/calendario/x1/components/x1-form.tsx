"use client";

import { useEffect, useState } from "react";
import { Sparkles, Copy, Download, Trash2, Plus, ThumbsUp, ThumbsDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PromptPicker } from "@/components/prompt-picker";
import { ApprovalContextPanel } from "../../components/approval-context-panel";
import type { Database, EngagementResult, EngagementStatus, StudentSegment } from "@/lib/supabase/types";

type DirectMessage = Database["public"]["Tables"]["direct_messages"]["Row"];

interface X1FormProps {
  dateKey: string;
  messages: DirectMessage[];
  currentUserId: string;
  onSaved: (message: DirectMessage) => void;
  onDeleted: (id: string) => void;
}

const SEGMENT_LABEL: Record<StudentSegment, string> = {
  iniciante: "Iniciante",
  avancado: "Avançado",
  inativo: "Inativo há X dias",
};

const EMPTY_FORM = {
  id: null as string | null,
  segment: "iniciante" as StudentSegment,
  textPrompt: "",
  textPromptId: null as string | null,
  imagePrompt: "",
  imagePromptId: null as string | null,
  generatedText: "",
  generatedImageUrl: null as string | null,
  status: "rascunho" as EngagementStatus,
  result: null as EngagementResult,
  notes: "",
  tema: "",
};

export function X1Form({ dateKey, messages, currentUserId, onSaved, onDeleted }: X1FormProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setForm(EMPTY_FORM);
  }, [dateKey]);

  function loadIntoForm(message: DirectMessage) {
    setForm({
      id: message.id,
      segment: (message.student_segment as StudentSegment) ?? "iniciante",
      textPrompt: "",
      textPromptId: message.text_prompt_id,
      imagePrompt: "",
      imagePromptId: message.image_prompt_id,
      generatedText: message.generated_text ?? "",
      generatedImageUrl: message.generated_image_url,
      status: message.status,
      result: message.result,
      notes: message.notes ?? "",
      tema: message.tema ?? "",
    });
  }

  async function handleGenerate() {
    setGenerating(true);
    setGenError(null);
    try {
      const tasks: Promise<void>[] = [];
      let newText: string | null = null;
      let newImage: string | null = null;

      if (form.textPrompt.trim()) {
        tasks.push(
          fetch("/api/ai/generate-text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              module: "mensagem",
              prompt: form.textPrompt,
              system: `Escreva para um aluno com o seguinte perfil/segmento: ${SEGMENT_LABEL[form.segment]}. Ajuste o tom para esse perfil.`,
              promptId: form.textPromptId ?? undefined,
              performanceScope: "direct",
            }),
          }).then(async (res) => {
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || "Erro ao gerar texto.");
            newText = body.text;
          })
        );
      }

      if (form.imagePrompt.trim()) {
        tasks.push(
          fetch("/api/ai/generate-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              module: "imagem",
              prompt: form.imagePrompt,
              promptId: form.imagePromptId ?? undefined,
            }),
          }).then(async (res) => {
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || "Erro ao gerar imagem.");
            newImage = body.url;
          })
        );
      }

      if (tasks.length === 0) {
        setGenError("Preencha ao menos o prompt de texto.");
        return;
      }

      const results = await Promise.allSettled(tasks);
      const failed = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;

      setForm((prev) => ({
        ...prev,
        generatedText: newText ?? prev.generatedText,
        generatedImageUrl: newImage ?? prev.generatedImageUrl,
      }));

      if (failed) {
        setGenError(failed.reason instanceof Error ? failed.reason.message : "Erro ao gerar conteúdo.");
      }
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
      student_segment: form.segment,
      text_prompt_id: form.textPromptId,
      image_prompt_id: form.imagePromptId,
      generated_text: form.generatedText || null,
      generated_image_url: form.generatedImageUrl,
      status: form.status,
      result: form.result,
      notes: form.notes || null,
      tema: form.tema || null,
      created_by: currentUserId,
    };

    if (form.id) {
      const { data, error } = await supabase
        .from("direct_messages")
        .update(payload)
        .eq("id", form.id)
        .select()
        .single();
      if (!error && data) onSaved(data);
    } else {
      const { data, error } = await supabase.from("direct_messages").insert(payload).select().single();
      if (!error && data) {
        onSaved(data);
        setForm((prev) => ({ ...prev, id: data.id }));
      }
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!form.id) return;
    if (!confirm("Excluir esta mensagem?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("direct_messages").delete().eq("id", form.id);
    if (!error) {
      onDeleted(form.id);
      setForm(EMPTY_FORM);
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
              {SEGMENT_LABEL[(m.student_segment as StudentSegment) ?? "iniciante"]} ·{" "}
              {m.tema || m.generated_text?.slice(0, 15) || "Sem título"}
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

      <ApprovalContextPanel scope="direct" />

      <Card className="p-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Segmento do aluno</label>
          <Select
            value={form.segment}
            onChange={(e) => setForm((prev) => ({ ...prev, segment: e.target.value as StudentSegment }))}
          >
            {Object.entries(SEGMENT_LABEL).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            placeholder="Prompt para gerar a mensagem individual"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-text-secondary">Prompt de imagem (opcional)</label>
            <PromptPicker
              category="imagem"
              onSelect={(p) => setForm((prev) => ({ ...prev, imagePrompt: p.content, imagePromptId: p.id }))}
            />
          </div>
          <Textarea
            value={form.imagePrompt}
            onChange={(e) => setForm((prev) => ({ ...prev, imagePrompt: e.target.value, imagePromptId: null }))}
            rows={4}
            placeholder="Nem toda mensagem direct precisa de imagem"
          />
        </div>
      </div>

      {genError && <p className="text-sm text-danger">{genError}</p>}

      <Button type="button" onClick={handleGenerate} disabled={generating} className="w-full">
        <Sparkles size={16} />
        {generating ? "Gerando..." : "Gerar"}
      </Button>

      {(form.generatedText || form.generatedImageUrl) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Imagem gerada</label>
            {form.generatedImageUrl ? (
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.generatedImageUrl}
                  alt="Imagem gerada"
                  className="w-full rounded-lg border border-border object-cover"
                />
                <a
                  href={form.generatedImageUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
                >
                  <Download size={12} />
                  Baixar imagem
                </a>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border-strong px-3 py-6 text-center text-xs text-text-muted">
                Nenhuma imagem gerada ainda
              </p>
            )}
          </div>
        </div>
      )}

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
            placeholder="reengajamento, upsell..."
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
          placeholder="O que funcionou ou não com esse aluno/segmento?"
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
