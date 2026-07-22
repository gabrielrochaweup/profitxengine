"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, Pencil, Copy, Trash2, ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import type { Database } from "@/lib/supabase/types";
import { PromptForm } from "./prompt-form";

type Prompt = Database["public"]["Tables"]["prompts"]["Row"];
type PromptCategoryRow = Database["public"]["Tables"]["prompt_categories"]["Row"];

interface PromptsClientProps {
  initialPrompts: Prompt[];
  initialCategories: PromptCategoryRow[];
  currentUserId: string;
  isAdmin: boolean;
}

export function PromptsClient({ initialPrompts, initialCategories, currentUserId, isAdmin }: PromptsClientProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [categories, setCategories] = useState<PromptCategoryRow[]>(initialCategories);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [newPromptCategoryId, setNewPromptCategoryId] = useState<string | undefined>(undefined);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null);
  const [mobileCategoryId, setMobileCategoryId] = useState<string>(initialCategories[0]?.id ?? "");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const newColumnInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingColumn) newColumnInputRef.current?.focus();
  }, [addingColumn]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return prompts;
    return prompts.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query) ||
        (p.tags ?? []).some((tag) => tag.toLowerCase().includes(query))
    );
  }, [prompts, search]);

  const byCategory = useMemo(() => {
    const map: Record<string, Prompt[]> = {};
    categories.forEach((c) => {
      map[c.id] = [];
    });
    filtered.forEach((p) => {
      if (map[p.category_id]) map[p.category_id].push(p);
    });
    return map;
  }, [filtered, categories]);

  function canEdit() {
    return isAdmin;
  }

  function openNew(categoryId: string) {
    setEditingPrompt(null);
    setNewPromptCategoryId(categoryId);
    setFormOpen(true);
  }

  async function handleDelete(prompt: Prompt) {
    const ok = await confirm({
      title: "Excluir prompt",
      description: `Excluir o prompt "${prompt.title}"?`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const supabase = createClient();
    const { error } = await supabase.from("prompts").delete().eq("id", prompt.id);
    if (!error) {
      setPrompts((prev) => prev.filter((p) => p.id !== prompt.id));
    } else {
      toast.error("Erro ao excluir o prompt. Tente novamente.");
    }
  }

  async function handleDuplicate(prompt: Prompt) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("prompts")
      .insert({
        title: `${prompt.title} (cópia)`,
        category_id: prompt.category_id,
        content: prompt.content,
        tags: prompt.tags,
        created_by: currentUserId,
      })
      .select()
      .single();
    if (!error && data) {
      setPrompts((prev) => [data, ...prev]);
    } else {
      toast.error("Erro ao duplicar o prompt. Tente novamente.");
    }
  }

  function handleSaved(saved: Prompt, isNew: boolean) {
    setPrompts((prev) => (isNew ? [saved, ...prev] : prev.map((p) => (p.id === saved.id ? saved : p))));
    setFormOpen(false);
    setEditingPrompt(null);
  }

  async function handleDropOnCategory(categoryId: string) {
    setDragOverCategoryId(null);
    const promptId = draggingId;
    setDraggingId(null);
    if (!promptId) return;

    const prompt = prompts.find((p) => p.id === promptId);
    if (!prompt || prompt.category_id === categoryId) return;
    if (!canEdit()) return;

    const previousCategoryId = prompt.category_id;
    setPrompts((prev) => prev.map((p) => (p.id === promptId ? { ...p, category_id: categoryId } : p)));

    const supabase = createClient();
    const { error } = await supabase.from("prompts").update({ category_id: categoryId }).eq("id", promptId);
    if (error) {
      setPrompts((prev) => prev.map((p) => (p.id === promptId ? { ...p, category_id: previousCategoryId } : p)));
      toast.error("Erro ao mover o prompt. Tente novamente.");
    }
  }

  async function handleAddColumn() {
    const name = newColumnName.trim();
    if (!name) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("prompt_categories")
      .insert({ name, position: categories.length, created_by: currentUserId })
      .select()
      .single();
    if (error || !data) {
      toast.error("Erro ao criar a coluna. Tente novamente.");
      return;
    }
    setCategories((prev) => [...prev, data]);
    setNewColumnName("");
    setAddingColumn(false);
  }

  function startRename(category: PromptCategoryRow) {
    setRenamingId(category.id);
    setRenameValue(category.name);
  }

  async function commitRename(category: PromptCategoryRow) {
    const name = renameValue.trim();
    setRenamingId(null);
    if (!name || name === category.name) return;
    setCategories((prev) => prev.map((c) => (c.id === category.id ? { ...c, name } : c)));
    const supabase = createClient();
    const { error } = await supabase.from("prompt_categories").update({ name }).eq("id", category.id);
    if (error) {
      setCategories((prev) => prev.map((c) => (c.id === category.id ? { ...c, name: category.name } : c)));
      toast.error("Erro ao renomear a coluna. Tente novamente.");
    }
  }

  async function moveColumn(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const next = [...categories];
    [next[index], next[target]] = [next[target], next[index]];
    const withPositions = next.map((c, i) => ({ ...c, position: i }));
    setCategories(withPositions);
    const supabase = createClient();
    const results = await Promise.all(
      withPositions.map((c) => supabase.from("prompt_categories").update({ position: c.position }).eq("id", c.id))
    );
    if (results.some((r) => r.error)) toast.error("Erro ao reordenar as colunas. Tente novamente.");
  }

  async function handleDeleteColumn(category: PromptCategoryRow) {
    if ((byCategory[category.id]?.length ?? 0) > 0) {
      toast.error("Mova ou exclua os prompts dessa coluna antes de excluí-la.");
      return;
    }
    const ok = await confirm({
      title: "Excluir coluna",
      description: `Excluir a coluna "${category.name}"?`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const supabase = createClient();
    const { error } = await supabase.from("prompt_categories").delete().eq("id", category.id);
    if (error) {
      toast.error("Erro ao excluir a coluna. Tente novamente.");
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== category.id));
    if (mobileCategoryId === category.id) {
      setMobileCategoryId(categories.find((c) => c.id !== category.id)?.id ?? "");
    }
  }

  function renderColumn(category: PromptCategoryRow, index: number, strong?: boolean) {
    const items = byCategory[category.id] ?? [];
    return (
      <div
        key={category.id}
        onDragOver={(e) => {
          if (!draggingId) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (dragOverCategoryId !== category.id) setDragOverCategoryId(category.id);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setDragOverCategoryId((prev) => (prev === category.id ? null : prev));
        }}
        onDrop={(e) => {
          e.preventDefault();
          handleDropOnCategory(category.id);
        }}
        className={`flex w-full min-h-0 shrink-0 flex-col rounded-card border p-3 transition-colors sm:w-72 ${
          dragOverCategoryId === category.id
            ? "border-accent bg-accent/5"
            : strong
              ? "border-border-strong bg-card-hover"
              : "border-border bg-card"
        }`}
      >
        <div className="mb-3 flex items-center justify-between gap-1 px-1">
          {renamingId === category.id ? (
            <div className="flex flex-1 items-center gap-1">
              <Input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename(category);
                  if (e.key === "Escape") setRenamingId(null);
                }}
                className="h-7 text-xs"
              />
              <IconButton onClick={() => commitRename(category)} label="Confirmar">
                <Check size={13} />
              </IconButton>
              <IconButton onClick={() => setRenamingId(null)} label="Cancelar">
                <X size={13} />
              </IconButton>
            </div>
          ) : (
            <h2 className="flex min-w-0 items-center gap-2 text-sm font-medium text-text-primary">
              <span className="truncate">{category.name}</span>
              <span className="shrink-0 rounded-button bg-card-hover px-1.5 py-0.5 text-[11px] text-text-muted">
                {items.length}
              </span>
            </h2>
          )}

          {renamingId !== category.id && (
            <div className="flex shrink-0 items-center gap-0.5">
              {isAdmin && (
                <>
                  <IconButton onClick={() => moveColumn(index, -1)} label="Mover pra esquerda">
                    <ChevronLeft size={13} />
                  </IconButton>
                  <IconButton onClick={() => moveColumn(index, 1)} label="Mover pra direita">
                    <ChevronRight size={13} />
                  </IconButton>
                  <IconButton onClick={() => startRename(category)} label="Renomear coluna">
                    <Pencil size={13} />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteColumn(category)} label="Excluir coluna" danger>
                    <Trash2 size={13} />
                  </IconButton>
                  <IconButton onClick={() => openNew(category.id)} label={`Novo prompt de ${category.name}`}>
                    <Plus size={14} />
                  </IconButton>
                </>
              )}
            </div>
          )}
        </div>

        <div className="max-h-[calc(100vh-320px)] space-y-2.5 overflow-y-auto pr-0.5">
          {items.length === 0 ? (
            <p className="rounded-input border border-dashed border-border-strong px-3 py-6 text-center text-xs text-text-muted">
              {dragOverCategoryId === category.id ? "Solte aqui" : "Nenhum prompt aqui ainda."}
            </p>
          ) : (
            items.map((prompt) => (
              <Card
                key={prompt.id}
                draggable={canEdit()}
                onDragStart={(e) => {
                  setDraggingId(prompt.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragEnd={() => {
                  setDraggingId(null);
                  setDragOverCategoryId(null);
                }}
                className={`p-3 transition-opacity ${canEdit() ? "cursor-grab active:cursor-grabbing" : ""} ${
                  draggingId === prompt.id ? "opacity-40" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xs font-medium text-text-primary">{prompt.title}</h3>
                  <Badge>{prompt.usage_count}x</Badge>
                </div>

                <p className="mt-1.5 line-clamp-4 text-xs text-text-secondary">{prompt.content}</p>

                {prompt.tags && prompt.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {prompt.tags.map((tag) => (
                      <span key={tag} className="rounded-button bg-card-hover px-1.5 py-0.5 text-[10px] text-text-muted">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-2 flex items-center justify-end gap-0.5 border-t border-border pt-2">
                  {isAdmin && (
                    <IconButton onClick={() => handleDuplicate(prompt)} label="Duplicar">
                      <Copy size={13} />
                    </IconButton>
                  )}
                  {canEdit() && (
                    <>
                      <IconButton
                        onClick={() => {
                          setEditingPrompt(prompt);
                          setFormOpen(true);
                        }}
                        label="Editar"
                      >
                        <Pencil size={13} />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(prompt)} label="Excluir" danger>
                        <Trash2 size={13} />
                      </IconButton>
                    </>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  const mobileIndex = categories.findIndex((c) => c.id === mobileCategoryId);
  const mobileCategory = categories[mobileIndex] ?? categories[0] ?? null;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, conteúdo ou tag..."
            className="h-10 w-full rounded-input border border-border bg-input pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent"
          />
        </div>

        {isAdmin &&
          (addingColumn ? (
            <div className="flex items-center gap-1">
              <Input
                ref={newColumnInputRef}
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddColumn();
                  if (e.key === "Escape") setAddingColumn(false);
                }}
                placeholder="Nome da coluna"
                className="h-9 w-40 text-sm"
              />
              <Button type="button" size="sm" onClick={handleAddColumn}>
                Criar
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setAddingColumn(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button type="button" variant="secondary" size="sm" onClick={() => setAddingColumn(true)}>
              <Plus size={14} />
              Nova coluna
            </Button>
          ))}
      </div>

      {categories.length === 0 ? (
        <p className="mt-6 rounded-input border border-dashed border-border-strong px-3 py-10 text-center text-sm text-text-muted">
          Nenhuma coluna ainda.{isAdmin ? " Crie a primeira com \"Nova coluna\"." : ""}
        </p>
      ) : (
        <>
          {/* Mobile: uma categoria por vez, escolhida num dropdown */}
          <div className="mt-4 sm:hidden">
            <Select value={mobileCategoryId} onChange={(e) => setMobileCategoryId(e.target.value)}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({(byCategory[category.id] ?? []).length})
                </option>
              ))}
            </Select>
            {mobileCategory && <div className="mt-3">{renderColumn(mobileCategory, mobileIndex, true)}</div>}
          </div>

          {/* Desktop/tablet: board com as colunas lado a lado, rolando na horizontal */}
          <div className="mt-4 hidden gap-4 overflow-x-auto pb-2 sm:flex">
            {categories.map((category, index) => renderColumn(category, index))}
          </div>
        </>
      )}

      <PromptForm
        open={formOpen}
        prompt={editingPrompt}
        categories={categories}
        currentUserId={currentUserId}
        defaultCategoryId={newPromptCategoryId}
        onClose={() => {
          setFormOpen(false);
          setEditingPrompt(null);
        }}
        onSaved={handleSaved}
      />
    </div>
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
