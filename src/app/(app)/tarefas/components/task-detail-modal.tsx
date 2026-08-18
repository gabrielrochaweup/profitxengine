"use client";

import { useEffect, useRef, useState } from "react";
import { Paperclip, Trash2, X, FileText } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Database } from "@/lib/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];
type TaskAttachment = Database["public"]["Tables"]["task_attachments"]["Row"];

interface TaskDetailModalProps {
  task: Task | null;
  attachments: TaskAttachment[];
  canEdit: boolean;
  onClose: () => void;
  onUpdate: (patch: Partial<Pick<Task, "title" | "description" | "completed">>) => void;
  onDelete: () => void;
  onAddAttachment: (file: File) => void;
  onRemoveAttachment: (id: string) => void;
}

export function TaskDetailModal({
  task,
  attachments,
  canEdit,
  onClose,
  onUpdate,
  onDelete,
  onAddAttachment,
  onRemoveAttachment,
}: TaskDetailModalProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);

  async function handleFileSelected(file: File) {
    setUploading(true);
    await onAddAttachment(file);
    setUploading(false);
  }

  return (
    <Modal open={task !== null} onClose={onClose} title="Detalhes da tarefa" className="max-w-lg">
      {task && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Título</label>
            <Input
              value={title}
              disabled={!canEdit}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => title.trim() && title !== task.title && onUpdate({ title: title.trim() })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Descrição</label>
            <Textarea
              value={description}
              disabled={!canEdit}
              rows={4}
              placeholder="Detalhes da tarefa..."
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => description !== (task.description ?? "") && onUpdate({ description: description || null })}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={task.completed}
              disabled={!canEdit}
              onChange={(e) => onUpdate({ completed: e.target.checked })}
            />
            Tarefa concluída
          </label>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text-secondary">
                Anexos {attachments.length > 0 && `(${attachments.length})`}
              </label>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 text-xs text-accent hover:underline disabled:opacity-50"
                >
                  <Paperclip size={12} />
                  {uploading ? "Enviando..." : "Anexar arquivo"}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelected(file);
                  e.target.value = "";
                }}
              />
            </div>

            {attachments.length === 0 ? (
              <p className="text-xs text-text-muted">Nenhum anexo ainda.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="group relative overflow-hidden rounded-lg border border-border">
                    <a href={attachment.file_url} target="_blank" rel="noreferrer" className="block">
                      {attachment.file_type?.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={attachment.file_url} alt={attachment.file_name} className="h-20 w-full object-cover" />
                      ) : (
                        <div className="flex h-20 w-full flex-col items-center justify-center gap-1 bg-card-hover px-1">
                          <FileText size={20} className="text-text-muted" />
                          <span className="w-full truncate px-1 text-center text-[10px] text-text-muted">
                            {attachment.file_name}
                          </span>
                        </div>
                      )}
                    </a>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => onRemoveAttachment(attachment.id)}
                        title="Remover anexo"
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {canEdit && (
            <div className="flex justify-end border-t border-border pt-3">
              <Button type="button" variant="danger" size="sm" onClick={onDelete}>
                <Trash2 size={14} />
                Excluir tarefa
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
