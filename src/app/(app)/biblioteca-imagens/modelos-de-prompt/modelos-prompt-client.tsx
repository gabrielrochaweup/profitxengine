"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useActiveProduct } from "@/components/layout/active-product-context";
import type { Database } from "@/lib/supabase/types";

type PromptPartTable =
  | "image_prompt_templates"
  | "image_prompt_characters"
  | "image_prompt_tones"
  | "image_prompt_ctas";
type PromptPartRow = { id: string; name: string; body: string; position: number };

interface ModelosPromptClientProps {
  initialTemplates: Database["public"]["Tables"]["image_prompt_templates"]["Row"][];
  initialCharacters: Database["public"]["Tables"]["image_prompt_characters"]["Row"][];
  initialTones: Database["public"]["Tables"]["image_prompt_tones"]["Row"][];
  initialCtas: Database["public"]["Tables"]["image_prompt_ctas"]["Row"][];
  currentUserId: string;

}

export function ModelosPromptClient({
  initialTemplates,
  initialCharacters,
  initialTones,
  initialCtas,
  currentUserId,

}: ModelosPromptClientProps) {
  const { activeProductId } = useActiveProduct();
  return (
    <div className="mt-6 space-y-8">
      <PromptPartSection
        table="image_prompt_templates"
        title="Templates"
        description={`Use [ITEM 1] a [ITEM 4] pras variáveis de texto livre, [PERSONAGEM] pro bloco de personagem escolhido e [TOM] pro bloco de energia/tom escolhido.`}
        newLabel="Novo template"
        initialItems={initialTemplates}
        currentUserId={currentUserId}
        productId={activeProductId}

      />
      <PromptPartSection
        table="image_prompt_characters"
        title="Personagens"
        description="Texto que substitui [PERSONAGEM] no template — inclua o próprio cabeçalho (ex: 'Main character — PEPE:')."
        newLabel="Novo personagem"
        initialItems={initialCharacters}
        currentUserId={currentUserId}
        productId={activeProductId}

      />
      <PromptPartSection
        table="image_prompt_tones"
        title="Cor Predominante"
        description="Texto que substitui [TOM] no template — a descrição de iluminação e fundo na cor escolhida, pra diferenciar visualmente as imagens. Nos templates por mensagem (sem [TOM]), a cor entra como instrução de override no fim do prompt."
        newLabel="Nova cor"
        initialItems={initialTones}
        currentUserId={currentUserId}
        productId={activeProductId}

      />
      <PromptPartSection
        table="image_prompt_ctas"
        title="CTAs"
        description="Texto pronto pro Item 4 (CTA) — aparece como atalho rápido ao lado do campo, sem precisar reescrever toda vez."
        newLabel="Novo CTA"
        initialItems={initialCtas}
        currentUserId={currentUserId}
        productId={activeProductId}

      />
    </div>
  );
}

function PromptPartSection({
  table,
  title,
  description,
  newLabel,
  initialItems,
  currentUserId,
  productId,

}: {
  table: PromptPartTable;
  title: string;
  description: string;
  newLabel: string;
  initialItems: PromptPartRow[];
  currentUserId: string;
  productId: string | null;

}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState<PromptPartRow[]>(initialItems);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editBody, setEditBody] = useState("");
  const [saving, setSaving] = useState(false);

  function startEdit(item: PromptPartRow) {
    setExpandedId(item.id);
    setEditName(item.name);
    setEditBody(item.body);
  }

  async function handleAdd() {
    if (!productId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from(table)
      .insert({ product_id: productId, name: "Novo item", body: "", position: items.length, created_by: currentUserId })
      .select()
      .single();
    if (error || !data) {
      toast.error("Erro ao criar. Tente novamente.");
      return;
    }
    setItems((prev) => [...prev, data as PromptPartRow]);
    startEdit(data as PromptPartRow);
  }

  async function handleSave(id: string) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from(table).update({ name: editName, body: editBody }).eq("id", id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar. Tente novamente.");
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, name: editName, body: editBody } : i)));
    setExpandedId(null);
  }

  async function handleDelete(item: PromptPartRow) {
    const ok = await confirm({
      title: `Excluir "${item.name}"`,
      description: "Essa ação não pode ser desfeita.",
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const supabase = createClient();
    const { error } = await supabase.from(table).delete().eq("id", item.id);
    if (error) {
      toast.error("Erro ao excluir. Tente novamente.");
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    if (expandedId === item.id) setExpandedId(null);
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    const withPositions = next.map((it, i) => ({ ...it, position: i }));
    setItems(withPositions);
    const supabase = createClient();
    const results = await Promise.all(
      withPositions.map((it) => supabase.from(table).update({ position: it.position }).eq("id", it.id))
    );
    if (results.some((r) => r.error)) toast.error("Erro ao reordenar. Tente novamente.");
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-semibold text-text-primary">{title}</h2>
          <Tooltip text={description} />
        </div>
        {(
          <Button type="button" variant="secondary" size="sm" onClick={handleAdd}>
            <Plus size={14} />
            {newLabel}
          </Button>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {items.length === 0 && <p className="text-xs text-text-muted">Nada cadastrado ainda.</p>}
        {items.map((item, index) => {
          const isOpen = expandedId === item.id;
          return (
            <Card key={item.id} className="p-3">
              {isOpen ? (
                <div className="space-y-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 text-xs"
                    placeholder="Nome"
                  />
                  <Textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={8}
                    className="font-mono text-xs"
                    placeholder="Texto que entra no lugar do placeholder..."
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setExpandedId(null)}>
                      Cancelar
                    </Button>
                    <Button type="button" size="sm" disabled={saving} onClick={() => handleSave(item.id)}>
                      {saving ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="flex-1 truncate text-sm text-text-primary">{item.name}</span>
                  {(
                    <div className="flex shrink-0 items-center gap-0.5">
                      <IconButton label="Mover pra cima" onClick={() => move(index, -1)}>
                        <ChevronUp size={13} />
                      </IconButton>
                      <IconButton label="Mover pra baixo" onClick={() => move(index, 1)}>
                        <ChevronDown size={13} />
                      </IconButton>
                      <IconButton label="Editar" onClick={() => startEdit(item)}>
                        <Pencil size={13} />
                      </IconButton>
                      <IconButton label="Excluir" danger onClick={() => handleDelete(item)}>
                        <Trash2 size={13} />
                      </IconButton>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function IconButton({
  children,
  onClick,
  label,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-card-hover ${
        danger ? "hover:text-danger" : "hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}
