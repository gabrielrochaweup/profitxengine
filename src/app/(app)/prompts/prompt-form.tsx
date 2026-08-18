"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useActiveProduct } from "@/components/layout/active-product-context";
import type { Database } from "@/lib/supabase/types";

type Prompt = Database["public"]["Tables"]["prompts"]["Row"];
type PromptCategoryRow = Database["public"]["Tables"]["prompt_categories"]["Row"];

interface PromptFormProps {
  open: boolean;
  prompt: Prompt | null;
  categories: PromptCategoryRow[];
  currentUserId: string;
  defaultCategoryId?: string;
  onClose: () => void;
  onSaved: (prompt: Prompt, isNew: boolean) => void;
}

export function PromptForm({
  open,
  prompt,
  categories,
  currentUserId,
  defaultCategoryId,
  onClose,
  onSaved,
}: PromptFormProps) {
  const { activeProductId } = useActiveProduct();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(prompt?.title ?? "");
      setCategoryId(prompt?.category_id ?? defaultCategoryId ?? categories[0]?.id ?? "");
      setContent(prompt?.content ?? "");
      setTags((prompt?.tags ?? []).join(", "));
      setError(null);
    }
  }, [open, prompt, defaultCategoryId, categories]);

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
        .update({ title, category_id: categoryId, content, tags: parsedTags })
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
      if (!activeProductId) {
        setSaving(false);
        setError("Nenhum produto ativo.");
        return;
      }
      const { data, error: insertError } = await supabase
        .from("prompts")
        .insert({
          product_id: activeProductId,
          title,
          category_id: categoryId,
          content,
          tags: parsedTags,
          created_by: currentUserId,
        })
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
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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
          <Button type="submit" disabled={saving || !categoryId}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
