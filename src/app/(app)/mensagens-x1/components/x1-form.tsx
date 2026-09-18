"use client";

import { useEffect, useState } from "react";
import { Sparkles, Copy, Trash2, Plus, ThumbsUp, ThumbsDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ContentGrid, Field, Section } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PromptPicker } from "@/components/prompt-picker";
import { ImageGenerationPanel } from "@/components/image-generation-panel";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { ApprovalContextPanel } from "../../calendario/components/approval-context-panel";
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
  generatedText: "",
  generatedImageUrl: null as string | null,
  status: "rascunho" as EngagementStatus,
  result: null as EngagementResult,
  notes: "",
  tema: "",
};

export function X1Form({ dateKey, messages, currentUserId, onSaved, onDeleted }: X1FormProps) {
  const toast = useToast();
  const confirm = useConfirm();
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
      generatedText: message.generated_text ?? "",
      generatedImageUrl: message.generated_image_url,
      status: message.status,
      result: message.result,
      notes: message.notes ?? "",
      tema: message.tema ?? "",
    });
  }

  async function handleGenerate() {
    if (!form.textPrompt.trim()) {
      setGenError("Preencha ao menos o prompt de texto.");
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
          system: `Escreva para um aluno com o seguinte perfil/segmento: ${SEGMENT_LABEL[form.segment]}. Ajuste o tom para esse perfil.`,
          promptId: form.textPromptId ?? undefined,
          performanceScope: "direct",
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
      student_segment: form.segment,
      text_prompt_id: form.textPromptId,
      image_prompt_id: null,
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
      if (!error && data) {
        onSaved(data);
        toast.success("Mensagem salva.");
      } else {
        toast.error("Erro ao salvar a mensagem. Tente novamente.");
      }
    } else {
      const { data, error } = await supabase.from("direct_messages").insert(payload).select().single();
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
    const ok = await confirm({
      title: "Excluir mensagem",
      description: "Excluir esta mensagem?",
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const supabase = createClient();
    const { error } = await supabase.from("direct_messages").delete().eq("id", form.id);
    if (!error) {
      onDeleted(form.id);
      setForm(EMPTY_FORM);
    } else {
      toast.error("Erro ao excluir a mensagem. Tente novamente.");
    }
  }

  return (
    <div>
      {messages.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {messages.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => loadIntoForm(m)}
              className={`rounded-button px-2.5 py-1 text-xs transition-shadow ${
                form.id === m.id
                  ? "bg-accent-soft text-text-primary shadow-[0_0_0_1px_var(--accent)]"
                  : "bg-card-hover text-text-secondary shadow-card-sm hover:brightness-95"
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

      {/* O segmento nao precisava de um cartao so pra ele, nem da largura
          inteira: sao quatro palavras num select. */}
      <Section titulo="Para quem" descricao="Define o tom que o modelo usa na mensagem.">
        <ContentGrid>
          <Field label="Segmento do aluno" span={4}>
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
          </Field>
        </ContentGrid>
      </Section>

      <Section
        titulo="Mensagem"
        acoes={
          <PromptPicker
            preferredSlug="mensagem"
            onSelect={(p) => setForm((prev) => ({ ...prev, textPrompt: p.content, textPromptId: p.id }))}
          />
        }
      >
        <Textarea
          value={form.textPrompt}
          onChange={(e) => setForm((prev) => ({ ...prev, textPrompt: e.target.value, textPromptId: null }))}
          rows={4}
          placeholder="Prompt para gerar a mensagem individual"
        />

        {genError && <p className="mt-2 text-sm text-danger">{genError}</p>}

        {/* Texto longo merece a largura toda; o botao, nao. */}
        <Button type="button" onClick={handleGenerate} disabled={generating} className="mt-3">
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

      </Section>

      <Section titulo="Imagem" descricao="Opcional — nem toda mensagem direct precisa de uma.">
      <ImageGenerationPanel
        contextType="x1_message"
        contextId={form.id}
        value={form.generatedImageUrl}
        onChange={(url) => setForm((prev) => ({ ...prev, generatedImageUrl: url }))}
        label="Gerar imagem (opcional)"
        placeholder="Nem toda mensagem direct precisa de imagem"
      />

      </Section>

      <Section titulo="Classificação" descricao="Como essa mensagem foi arquivada e o que ela rendeu.">
      <ContentGrid>
        <Field label="Status" span={3}>
          <Select
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as EngagementStatus }))}
          >
            <option value="rascunho">Rascunho</option>
            <option value="aprovada">Aprovada</option>
            <option value="enviada">Enviada</option>
          </Select>
        </Field>

        <Field label="Tema/tag" span={5}>
          <Input
            value={form.tema}
            onChange={(e) => setForm((prev) => ({ ...prev, tema: e.target.value }))}
            placeholder="reengajamento, upsell..."
          />
        </Field>

        <Field label="Resultado" span={4}>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, result: prev.result === "funcionou" ? null : "funcionou" }))}
              className={`flex h-10 flex-1 items-center justify-center rounded-input transition-shadow ${
                form.result === "funcionou"
                  ? "bg-success/15 text-success shadow-[0_0_0_1px_var(--success)]"
                  : "bg-card-hover text-text-secondary shadow-card-sm hover:brightness-95"
              }`}
            >
              <ThumbsUp size={15} />
            </button>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, result: prev.result === "nao_funcionou" ? null : "nao_funcionou" }))
              }
              className={`flex h-10 flex-1 items-center justify-center rounded-input transition-shadow ${
                form.result === "nao_funcionou"
                  ? "bg-danger/15 text-danger shadow-[0_0_0_1px_var(--danger)]"
                  : "bg-card-hover text-text-secondary shadow-card-sm hover:brightness-95"
              }`}
            >
              <ThumbsDown size={15} />
            </button>
          </div>
        </Field>

        <Field label="Nota livre" hint="(opcional)" span={12}>
          <Textarea
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            rows={2}
            placeholder="O que funcionou ou não com esse aluno/segmento?"
          />
        </Field>
      </ContentGrid>
      </Section>

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
