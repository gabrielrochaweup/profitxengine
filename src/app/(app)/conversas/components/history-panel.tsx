"use client";

import { useState } from "react";
import { History, Search, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/lib/supabase/types";

type FakeConversation = Database["public"]["Tables"]["fake_conversations"]["Row"];

interface HistoryPanelProps {
  conversations: FakeConversation[];
  onSelect: (conversation: FakeConversation) => void;
  onDelete: (conversation: FakeConversation) => void;
}

export function HistoryPanel({ conversations, onSelect, onDelete }: HistoryPanelProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      (c.title ?? "").toLowerCase().includes(query) ||
      (c.contact_name ?? "").toLowerCase().includes(query) ||
      (c.tema ?? "").toLowerCase().includes(query)
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
        Minhas conversas ({conversations.length})
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Conversas salvas">
        <div className="relative mb-3">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, contato ou tema..."
            className="h-9 w-full rounded-input border border-border bg-input pl-8 pr-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">Nenhuma conversa salva ainda.</p>
        ) : (
          <div className="max-h-80 space-y-1.5 overflow-y-auto">
            {filtered.map((conversation) => (
              <div
                key={conversation.id}
                className="flex items-center gap-2 rounded-xl border border-border p-3 hover:border-accent hover:bg-card-hover"
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelect(conversation);
                    setOpen(false);
                  }}
                  className="flex-1 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">
                      {conversation.title || conversation.contact_name || "Sem título"}
                    </span>
                    <Badge>
                      {conversation.platform === "whatsapp"
                        ? "WhatsApp"
                        : conversation.platform === "instagram"
                          ? "Instagram"
                          : "CRM"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {(conversation.messages as unknown[]).length} mensagens
                    {conversation.tema ? ` · ${conversation.tema}` : ""}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(conversation)}
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
