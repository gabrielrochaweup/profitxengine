"use client";

import { useState, type ReactNode } from "react";
import { Library, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { PROMPT_CATEGORY_LABEL } from "@/lib/prompts";
import type { Database, PromptCategory } from "@/lib/supabase/types";

type Prompt = Database["public"]["Tables"]["prompts"]["Row"];

interface PromptPickerProps {
  category: PromptCategory;
  onSelect: (prompt: Prompt) => void;
  trigger?: ReactNode;
}

/**
 * Seletor de prompts salvos na Biblioteca, filtrado por categoria.
 * Usado dentro de Conversas, Calendário de Engajamento e E-mails para
 * reaproveitar prompts já cadastrados em vez de redigitar.
 */
export function PromptPicker({ category, onSelect, trigger }: PromptPickerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prompts, setPrompts] = useState<Prompt[] | null>(null);
  const [search, setSearch] = useState("");

  async function handleOpen() {
    setOpen(true);
    if (prompts === null) {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("prompts")
        .select("*")
        .eq("category", category)
        .order("usage_count", { ascending: false });
      setPrompts(data ?? []);
      setLoading(false);
    }
  }

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
            Usar prompt salvo
          </Button>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Prompts salvos — ${PROMPT_CATEGORY_LABEL[category]}`}
      >
        <div className="relative mb-3">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar prompt..."
            className="h-9 w-full rounded-input border border-border bg-input pl-8 pr-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent"
          />
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-text-muted">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">
            Nenhum prompt de {PROMPT_CATEGORY_LABEL[category].toLowerCase()} encontrado. Crie um na
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
