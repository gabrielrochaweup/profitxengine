"use client";

import { useRef, useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Image as ImageIcon, X, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import type { ConversationMessage, Platform } from "@/lib/supabase/types";

interface MessageEditorProps {
  platform: Platform;
  messages: ConversationMessage[];
  onChange: (messages: ConversationMessage[]) => void;
}

export function MessageEditor({ platform, messages, onChange }: MessageEditorProps) {
  const toast = useToast();
  const isCrm = platform === "crm";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetIndex, setUploadTargetIndex] = useState<number | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

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

  function openImagePicker(index: number) {
    setUploadTargetIndex(index);
    fileInputRef.current?.click();
  }

  async function handleImageSelected(file: File) {
    if (uploadTargetIndex === null) return;
    const index = uploadTargetIndex;
    setUploadingIndex(index);
    const supabase = createClient();
    const path = `messages/${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from("conversation-avatars").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("conversation-avatars").getPublicUrl(path);
      updateMessage(index, { image_url: data.publicUrl });
    } else {
      toast.error("Erro ao enviar a imagem. Tente novamente.");
    }
    setUploadingIndex(null);
    setUploadTargetIndex(null);
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageSelected(file);
          e.target.value = "";
        }}
      />

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
                  <option value="left">Contato (esquerda)</option>
                  <option value="right">Agente/IA (direita)</option>
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

          {message.image_url ? (
            <div className="mt-2 flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.image_url}
                alt="Imagem da mensagem"
                className="h-14 w-14 shrink-0 rounded-lg border border-border object-cover"
              />
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => openImagePicker(index)}
                  className="flex items-center gap-1.5 rounded-button border border-border-strong px-2 py-1 text-[11px] text-text-secondary hover:bg-card-hover"
                >
                  <Upload size={11} />
                  Trocar
                </button>
                <button
                  type="button"
                  onClick={() => updateMessage(index, { image_url: null })}
                  className="flex items-center gap-1.5 rounded-button border border-border-strong px-2 py-1 text-[11px] text-text-secondary hover:bg-card-hover"
                >
                  <X size={11} />
                  Remover
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-1.5">
              <Input
                defaultValue=""
                onBlur={(e) => {
                  const url = e.target.value.trim();
                  if (url) updateMessage(index, { image_url: url });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
                placeholder="URL da imagem (ou anexe um arquivo)"
                className="h-8 flex-1 text-xs"
              />
              <button
                type="button"
                onClick={() => openImagePicker(index)}
                disabled={uploadingIndex === index}
                title="Anexar imagem (ex: print do aluno)"
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-button border border-dashed border-border-strong px-2.5 text-[11px] text-text-secondary hover:bg-card-hover disabled:opacity-50"
              >
                <ImageIcon size={12} />
                {uploadingIndex === index ? "Enviando..." : "Anexar"}
              </button>
            </div>
          )}

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
