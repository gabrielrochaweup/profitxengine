"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PROMPT_CATEGORY_LABEL, PROMPT_CATEGORIES } from "@/lib/prompts";
import type { Database, PromptCategory } from "@/lib/supabase/types";

type Prompt = Database["public"]["Tables"]["prompts"]["Row"];

interface PromptFormProps {
  open: boolean;
  prompt: Prompt | null;
  currentUserId: string;
  defaultCategory?: PromptCategory;
  onClose: () => void;
  onSaved: (prompt: Prompt, isNew: boolean) => void;
}

export function PromptForm({ open, prompt, currentUserId, defaultCategory, onClose, onSaved }: PromptFormProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<PromptCategory>("conversa");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(prompt?.title ?? "");
      setCategory(prompt?.category ?? defaultCategory ?? "conversa");
      setContent(prompt?.content ?? "");
      setTags((prompt?.tags ?? []).join(", "));
      setError(null);
    }
  }, [open, prompt, defaultCategory]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const supabase = createClient();

    if (prompt) {
      const { data, error: updateError } = await supabase
        .from("prompts")
        .update({ title, category, content, tags: parsedTags })
        .eq("id", prompt.id)
        .select()
        .single();

      setSaving(false);
      if (updateError || !data) {
        setError(updateError?.message ?? "Erro ao salvar.");
        return;
      }
      onSaved(data, false);
    } else {
      const { data, error: insertError } = await supabase
        .from("prompts")
        .insert({ title, category, content, tags: parsedTags, created_by: currentUserId })
        .select()
        .single();

      setSaving(false);
      if (insertError || !data) {
        setError(insertError?.message ?? "Erro ao criar.");
        return;
      }
      onSaved(data, true);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={prompt ? "Editar prompt" : "Novo prompt"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Título</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="PROMPT 1 IMAGEM" />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Categoria</label>
          <Select value={category} onChange={(e) => setCategory(e.target.value as PromptCategory)}>
            {PROMPT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {PROMPT_CATEGORY_LABEL[c]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Prompt</label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={6}
            placeholder="Descreva o prompt que você já usa..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Tags (separadas por vírgula)</label>
          <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="cripto, promoção, prova social" />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
