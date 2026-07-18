"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Copy, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { PROMPT_CATEGORY_LABEL, PROMPT_CATEGORIES } from "@/lib/prompts";
import type { Database, PromptCategory } from "@/lib/supabase/types";
import { PromptForm } from "./prompt-form";

type Prompt = Database["public"]["Tables"]["prompts"]["Row"];

interface PromptsClientProps {
  initialPrompts: Prompt[];
  currentUserId: string;
  isAdmin: boolean;
}

export function PromptsClient({ initialPrompts, currentUserId, isAdmin }: PromptsClientProps) {
  const toast = useToast();
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [newPromptCategory, setNewPromptCategory] = useState<PromptCategory>("conversa");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<PromptCategory | null>(null);
  const [mobileCategory, setMobileCategory] = useState<PromptCategory>("conversa");

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
    const map: Record<PromptCategory, Prompt[]> = { conversa: [], mensagem: [], imagem: [], email: [] };
    filtered.forEach((p) => map[p.category].push(p));
    return map;
  }, [filtered]);

  function canEdit() {
    return isAdmin;
  }

  function openNew(category: PromptCategory) {
    setEditingPrompt(null);
    setNewPromptCategory(category);
    setFormOpen(true);
  }

  async function handleDelete(prompt: Prompt) {
    if (!confirm(`Excluir o prompt "${prompt.title}"?`)) return;
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
        category: prompt.category,
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

  async function handleDropOnCategory(category: PromptCategory) {
    setDragOverCategory(null);
    const promptId = draggingId;
    setDraggingId(null);
    if (!promptId) return;

    const prompt = prompts.find((p) => p.id === promptId);
    if (!prompt || prompt.category === category) return;
    if (!canEdit()) return;

    const previousCategory = prompt.category;
    setPrompts((prev) => prev.map((p) => (p.id === promptId ? { ...p, category } : p)));

    const supabase = createClient();
    const { error } = await supabase.from("prompts").update({ category }).eq("id", promptId);
    if (error) {
      setPrompts((prev) => prev.map((p) => (p.id === promptId ? { ...p, category: previousCategory } : p)));
      toast.error("Erro ao mover o prompt. Tente novamente.");
    }
  }

  function renderColumn(category: PromptCategory, strong?: boolean) {
    return (
      <div
        key={category}
        onDragOver={(e) => {
          if (!draggingId) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (dragOverCategory !== category) setDragOverCategory(category);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setDragOverCategory((prev) => (prev === category ? null : prev));
        }}
        onDrop={(e) => {
          e.preventDefault();
          handleDropOnCategory(category);
        }}
        className={`flex min-h-0 flex-col rounded-card border p-3 transition-colors ${
          dragOverCategory === category
            ? "border-accent bg-accent/5"
            : strong
              ? "border-border-strong bg-card-hover"
              : "border-border bg-card"
        }`}
      >
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="flex items-center gap-2 text-sm font-medium text-text-primary">
            {PROMPT_CATEGORY_LABEL[category]}
            <span className="rounded-button bg-card-hover px-1.5 py-0.5 text-[11px] text-text-muted">
              {byCategory[category].length}
            </span>
          </h2>
          {isAdmin && (
            <IconButton onClick={() => openNew(category)} label={`Novo prompt de ${PROMPT_CATEGORY_LABEL[category]}`}>
              <Plus size={14} />
            </IconButton>
          )}
        </div>

        <div className="max-h-[calc(100vh-320px)] space-y-2.5 overflow-y-auto pr-0.5">
          {byCategory[category].length === 0 ? (
            <p className="rounded-input border border-dashed border-border-strong px-3 py-6 text-center text-xs text-text-muted">
              {dragOverCategory === category ? "Solte aqui" : "Nenhum prompt aqui ainda."}
            </p>
          ) : (
            byCategory[category].map((prompt) => (
              <Card
                key={prompt.id}
                draggable={canEdit()}
                onDragStart={(e) => {
                  setDraggingId(prompt.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragEnd={() => {
                  setDraggingId(null);
                  setDragOverCategory(null);
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

  return (
    <div className="mt-6">
      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título, conteúdo ou tag..."
          className="h-10 w-full rounded-input border border-border bg-input pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent"
        />
      </div>

      {/* Mobile: uma categoria por vez, escolhida num dropdown */}
      <div className="mt-4 sm:hidden">
        <Select value={mobileCategory} onChange={(e) => setMobileCategory(e.target.value as PromptCategory)}>
          {PROMPT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {PROMPT_CATEGORY_LABEL[category]} ({byCategory[category].length})
            </option>
          ))}
        </Select>
        <div className="mt-3">{renderColumn(mobileCategory, true)}</div>
      </div>

      {/* Desktop/tablet: board com as 4 colunas lado a lado */}
      <div className="mt-4 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {PROMPT_CATEGORIES.map((category) => renderColumn(category))}
      </div>

      <PromptForm
        open={formOpen}
        prompt={editingPrompt}
        currentUserId={currentUserId}
        defaultCategory={newPromptCategory}
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
