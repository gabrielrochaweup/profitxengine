"use client";

import { useState, type ReactNode } from "react";
import { Library, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { PROMPT_CATEGORY_LABEL, PROMPT_CATEGORIES } from "@/lib/prompts";
import type { Database, PromptCategory } from "@/lib/supabase/types";

type Prompt = Database["public"]["Tables"]["prompts"]["Row"];

interface PromptPickerProps {
  category: PromptCategory;
  onSelect: (prompt: Prompt) => void;
  trigger?: ReactNode;
}

/**
 * Seletor de prompts salvos na Biblioteca. Abre num popup com abas de
 * categoria (parte da categoria do contexto, mas permite navegar pelas
 * outras) — usado em todo lugar que tem uma ação de IA (Conversas,
 * Dinâmicas do Dia, Mensagens X1, E-mails) pra reaproveitar prompts já
 * cadastrados em vez de redigitar.
 */
export function PromptPicker({ category, onSelect, trigger }: PromptPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<PromptCategory>(category);
  const [loading, setLoading] = useState(false);
  const [promptsByCategory, setPromptsByCategory] = useState<Partial<Record<PromptCategory, Prompt[]>>>({});
  const [search, setSearch] = useState("");

  async function loadCategory(target: PromptCategory) {
    if (promptsByCategory[target] !== undefined) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("prompts")
      .select("*")
      .eq("category", target)
      .order("usage_count", { ascending: false });
    setPromptsByCategory((prev) => ({ ...prev, [target]: data ?? [] }));
    setLoading(false);
  }

  function handleOpen() {
    setActiveCategory(category);
    setOpen(true);
    loadCategory(category);
  }

  function handleCategoryChange(next: PromptCategory) {
    setActiveCategory(next);
    loadCategory(next);
  }

  const prompts = promptsByCategory[activeCategory];
  const filtered = (prompts ?? []).filter((p) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      p.title.toLowerCase().includes(query) ||
      p.content.toLowerCase().includes(query) ||
      (p.tags ?? []).some((tag) => tag.toLowerCase().includes(query))
    );
  });

  return (
    <>
      <div onClick={handleOpen}>
        {trigger ?? (
          <Button type="button" variant="secondary" size="sm">
            <Library size={14} />
            Adicionar prompt
          </Button>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Biblioteca de Prompts">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {PROMPT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={`rounded-button px-3 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-accent text-white"
                  : "border border-border-strong text-text-secondary hover:bg-card-hover"
              }`}
            >
              {PROMPT_CATEGORY_LABEL[cat]}
            </button>
          ))}
        </div>

        <div className="relative mb-3">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar prompt..."
            className="h-9 w-full rounded-input border border-border bg-input pl-8 pr-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent"
          />
        </div>

        {loading && prompts === undefined ? (
          <p className="py-8 text-center text-sm text-text-muted">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">
            Nenhum prompt de {PROMPT_CATEGORY_LABEL[activeCategory].toLowerCase()} encontrado. Crie um na
            Biblioteca de Prompts.
          </p>
        ) : (
          <div className="max-h-80 space-y-1.5 overflow-y-auto">
            {filtered.map((prompt) => (
              <button
                key={prompt.id}
                type="button"
                onClick={() => {
                  onSelect(prompt);
                  setOpen(false);
                }}
                className="w-full rounded-xl border border-border p-3 text-left transition-colors hover:border-accent hover:bg-card-hover"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-text-primary">{prompt.title}</span>
                  <span className="shrink-0 text-[11px] text-text-muted">{prompt.usage_count}x</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-text-secondary">{prompt.content}</p>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
