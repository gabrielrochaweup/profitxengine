"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Copy, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PromptCategory | "todas">("todas");
  const [formOpen, setFormOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  const filtered = useMemo(() => {
    return prompts.filter((p) => {
      const matchesCategory = categoryFilter === "todas" || p.category === categoryFilter;
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        p.title.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query) ||
        (p.tags ?? []).some((tag) => tag.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [prompts, search, categoryFilter]);

  function canEdit(prompt: Prompt) {
    return isAdmin || prompt.created_by === currentUserId;
  }

  async function handleDelete(prompt: Prompt) {
    if (!confirm(`Excluir o prompt "${prompt.title}"?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("prompts").delete().eq("id", prompt.id);
    if (!error) {
      setPrompts((prev) => prev.filter((p) => p.id !== prompt.id));
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
    }
  }

  function handleSaved(saved: Prompt, isNew: boolean) {
    setPrompts((prev) => (isNew ? [saved, ...prev] : prev.map((p) => (p.id === saved.id ? saved : p))));
    setFormOpen(false);
    setEditingPrompt(null);
  }

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <FilterTab
            active={categoryFilter === "todas"}
            label="Todas"
            onClick={() => setCategoryFilter("todas")}
          />
          {PROMPT_CATEGORIES.map((category) => (
            <FilterTab
              key={category}
              active={categoryFilter === category}
              label={PROMPT_CATEGORY_LABEL[category]}
              onClick={() => setCategoryFilter(category)}
            />
          ))}
        </div>

        <Button
          onClick={() => {
            setEditingPrompt(null);
            setFormOpen(true);
          }}
        >
          <Plus size={16} />
          Novo prompt
        </Button>
      </div>

      <div className="relative mt-4 max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título, conteúdo ou tag..."
          className="h-10 w-full rounded-input border border-border bg-input pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="mt-6 px-6 py-16 text-center text-sm text-text-muted">
          Nenhum prompt encontrado. Crie o primeiro com o botão &quot;Novo prompt&quot;.
        </Card>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((prompt) => (
            <Card key={prompt.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium text-text-primary">{prompt.title}</h3>
                <Badge>{PROMPT_CATEGORY_LABEL[prompt.category]}</Badge>
              </div>

              <p className="mt-2 line-clamp-4 flex-1 text-sm text-text-secondary">{prompt.content}</p>

              {prompt.tags && prompt.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {prompt.tags.map((tag) => (
                    <span key={tag} className="rounded-button bg-card-hover px-2 py-0.5 text-[11px] text-text-muted">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-text-muted">Usado {prompt.usage_count}x</span>
                <div className="flex items-center gap-1">
                  <IconButton onClick={() => handleDuplicate(prompt)} label="Duplicar">
                    <Copy size={14} />
                  </IconButton>
                  {canEdit(prompt) && (
                    <>
                      <IconButton
                        onClick={() => {
                          setEditingPrompt(prompt);
                          setFormOpen(true);
                        }}
                        label="Editar"
                      >
                        <Pencil size={14} />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(prompt)} label="Excluir" danger>
                        <Trash2 size={14} />
                      </IconButton>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <PromptForm
        open={formOpen}
        prompt={editingPrompt}
        currentUserId={currentUserId}
        onClose={() => {
          setFormOpen(false);
          setEditingPrompt(null);
        }}
        onSaved={handleSaved}
      />
    </div>
  );
}

function FilterTab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-button px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-accent text-white"
          : "border border-border-strong text-text-secondary hover:bg-card-hover"
      }`}
    >
      {label}
    </button>
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
