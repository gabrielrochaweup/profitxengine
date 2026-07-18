"use client";

import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ConversationMessage, Platform } from "@/lib/supabase/types";

interface MessageEditorProps {
  platform: Platform;
  messages: ConversationMessage[];
  onChange: (messages: ConversationMessage[]) => void;
}

export function MessageEditor({ platform, messages, onChange }: MessageEditorProps) {
  const isCrm = platform === "crm";
  function updateMessage(index: number, patch: Partial<ConversationMessage>) {
    const next = messages.map((m, i) => (i === index ? { ...m, ...patch } : m));
    onChange(next);
  }

  function addMessage() {
    const last = messages[messages.length - 1];
    onChange([
      ...messages,
      {
        sender: last?.sender === "right" ? "left" : "right",
        text: "",
        time: "12:00",
        read_status: "read",
      },
    ]);
  }

  function removeMessage(index: number) {
    onChange(messages.filter((_, i) => i !== index));
  }

  function moveMessage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= messages.length) return;
    const next = [...messages];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {messages.length === 0 && (
        <p className="rounded-input border border-dashed border-border-strong px-3 py-6 text-center text-sm text-text-muted">
          Nenhuma mensagem ainda. Adicione manualmente ou gere com IA.
        </p>
      )}

      {messages.map((message, index) => (
        <div key={index} className="rounded-xl border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <Select
              value={message.sender}
              onChange={(e) => updateMessage(index, { sender: e.target.value as "left" | "right" })}
              className="h-8 w-32 text-xs"
            >
              {isCrm ? (
                <>
                  <option value="left">Agente/IA (esquerda)</option>
                  <option value="right">Contato (direita)</option>
                </>
              ) : (
                <>
                  <option value="left">Contato (esquerda)</option>
                  <option value="right">Você (direita)</option>
                </>
              )}
            </Select>

            <div className="flex items-center gap-1">
              <IconButton label="Mover para cima" onClick={() => moveMessage(index, -1)}>
                <ArrowUp size={14} />
              </IconButton>
              <IconButton label="Mover para baixo" onClick={() => moveMessage(index, 1)}>
                <ArrowDown size={14} />
              </IconButton>
              <IconButton label="Excluir" danger onClick={() => removeMessage(index)}>
                <Trash2 size={14} />
              </IconButton>
            </div>
          </div>

          <Textarea
            value={message.text}
            onChange={(e) => updateMessage(index, { text: e.target.value })}
            rows={2}
            placeholder="Texto da mensagem"
            className="mt-2"
          />

          <div className="mt-2 flex gap-2">
            <Input
              value={message.time}
              onChange={(e) => updateMessage(index, { time: e.target.value })}
              placeholder="14:32"
              className="h-8 w-24 text-xs"
            />
            {!isCrm && message.sender === "right" && (
              <Select
                value={message.read_status ?? "read"}
                onChange={(e) =>
                  updateMessage(index, { read_status: e.target.value as ConversationMessage["read_status"] })
                }
                className="h-8 flex-1 text-xs"
              >
                <option value="sent">Enviada</option>
                <option value="delivered">Entregue</option>
                <option value="read">Lida</option>
              </Select>
            )}
          </div>
        </div>
      ))}

      <Button type="button" variant="secondary" size="sm" onClick={addMessage} className="w-full">
        <Plus size={14} />
        Adicionar mensagem
      </Button>
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
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-6 w-6 items-center justify-center rounded-lg text-text-muted hover:bg-card-hover ${
        danger ? "hover:text-danger" : "hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}
