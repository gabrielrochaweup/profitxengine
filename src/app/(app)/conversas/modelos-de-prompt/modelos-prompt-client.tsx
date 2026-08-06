"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import type { Database } from "@/lib/supabase/types";

type PromptPartTable =
  | "testimonial_prompt_templates"
  | "testimonial_prompt_styles"
  | "testimonial_prompt_variations"
  | "testimonial_prompt_image_variants";
type PromptPartRow = { id: string; name: string; body: string; position: number };

interface ModelosPromptClientProps {
  initialTemplates: Database["public"]["Tables"]["testimonial_prompt_templates"]["Row"][];
  initialStyles: Database["public"]["Tables"]["testimonial_prompt_styles"]["Row"][];
  initialVariations: Database["public"]["Tables"]["testimonial_prompt_variations"]["Row"][];
  initialImageVariants: Database["public"]["Tables"]["testimonial_prompt_image_variants"]["Row"][];
  currentUserId: string;
  isAdmin: boolean;
}

export function ModelosPromptClient({
  initialTemplates,
  initialStyles,
  initialVariations,
  initialImageVariants,
  currentUserId,
  isAdmin,
}: ModelosPromptClientProps) {
  return (
    <div className="mt-6 space-y-8">
      <PromptPartSection
        table="testimonial_prompt_templates"
        title="Cenários"
        description="Use [ESTILO] pro bloco de qualidade do português, [VARIACAO] pra variação de interação, [IMAGEM] pra variante com/sem imagem e [ITEM 1] pro detalhe específico opcional."
        newLabel="Novo cenário"
        initialItems={initialTemplates}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />
      <PromptPartSection
        table="testimonial_prompt_styles"
        title="Qualidade do Português"
        description="Texto que substitui [ESTILO] no cenário — instrução de como o cliente escreve (bem escrito, mediano, etc.)."
        newLabel="Novo estilo"
        initialItems={initialStyles}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />
      <PromptPartSection
        table="testimonial_prompt_variations"
        title="Variações de Interação"
        description="Texto que substitui [VARIACAO] no cenário — como o cliente interage (pergunta inicial, pé atrás, emojis, etc.)."
        newLabel="Nova variação"
        initialItems={initialVariations}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />
      <PromptPartSection
        table="testimonial_prompt_image_variants"
        title="Com ou Sem Imagem"
        description="Texto que substitui [IMAGEM] no cenário — se o cliente menciona mandar um print/comprovante junto ou não."
        newLabel="Nova variante"
        initialItems={initialImageVariants}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
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
  isAdmin,
}: {
  table: PromptPartTable;
  title: string;
  description: string;
  newLabel: string;
  initialItems: PromptPartRow[];
  currentUserId: string;
  isAdmin: boolean;
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
    const supabase = createClient();
    const { data, error } = await supabase
      .from(table)
      .insert({ name: "Novo item", body: "", position: items.length, created_by: currentUserId })
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
        <div>
          <h2 className="text-base font-medium text-text-primary">{title}</h2>
          <p className="mt-1 text-xs text-text-muted">{description}</p>
        </div>
        {isAdmin && (
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
                  {isAdmin && (
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
