"use client";

import { useState } from "react";
import { History, Search, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type { Database } from "@/lib/supabase/types";

type FakePost = Database["public"]["Tables"]["fake_posts"]["Row"];

interface PostHistoryPanelProps {
  posts: FakePost[];
  onSelect: (post: FakePost) => void;
  onDelete: (post: FakePost) => void;
}

export function PostHistoryPanel({ posts, onSelect, onDelete }: PostHistoryPanelProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = posts.filter((p) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      (p.title ?? "").toLowerCase().includes(query) ||
      (p.author_name ?? "").toLowerCase().includes(query) ||
      (p.body ?? "").toLowerCase().includes(query)
    );
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-button border border-border-strong px-4 py-2 text-sm text-text-primary hover:bg-card-hover"
      >
        <History size={16} />
        Meus posts ({posts.length})
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Posts salvos">
        <div className="relative mb-3">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, autor ou texto..."
            className="h-9 w-full rounded-input border border-border bg-input pl-8 pr-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">Nenhum post salvo ainda.</p>
        ) : (
          <div className="max-h-80 space-y-1.5 overflow-y-auto">
            {filtered.map((post) => (
              <div
                key={post.id}
                className="flex items-center gap-2 rounded-xl border border-border p-3 hover:border-accent hover:bg-card-hover"
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelect(post);
                    setOpen(false);
                  }}
                  className="flex-1 text-left"
                >
                  <span className="text-sm font-medium text-text-primary">
                    {post.title || post.author_name || "Sem título"}
                  </span>
                  <p className="mt-0.5 line-clamp-1 text-xs text-text-muted">{post.body || "Sem texto"}</p>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(post)}
                  title="Excluir"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-card-hover hover:text-danger"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
