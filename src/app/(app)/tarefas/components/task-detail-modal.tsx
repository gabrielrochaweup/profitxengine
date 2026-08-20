"use client";

import { useEffect, useRef, useState } from "react";
import { Paperclip, Trash2, X, FileText, CalendarClock, Circle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getUrgencyLevel, URGENCY_TEXT_CLASS, urgencyLabel, useMinuteTick } from "../lib/urgency";
import type { Database } from "@/lib/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];
type TaskAttachment = Database["public"]["Tables"]["task_attachments"]["Row"];

interface TaskDetailModalProps {
  task: Task | null;
  attachments: TaskAttachment[];
  canEdit: boolean;
  onClose: () => void;
  onUpdate: (patch: Partial<Pick<Task, "title" | "description" | "completed" | "due_at">>) => void;
  onDelete: () => void;
  onAddAttachment: (file: File) => void;
  onRemoveAttachment: (id: string) => void;
}

function dueAtToDateInput(dueAt: string | null): string {
  if (!dueAt) return "";
  const d = new Date(dueAt);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dueAtToTimeInput(dueAt: string | null): string {
  if (!dueAt) return "";
  const d = new Date(dueAt);
  if (Number.isNaN(d.getTime())) return "";
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}

function combineDateTime(dateStr: string, timeStr: string): string | null {
  if (!dateStr) return null;
  const local = new Date(`${dateStr}T${timeStr || "00:00"}:00`);
  if (Number.isNaN(local.getTime())) return null;
  return local.toISOString();
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
  useMinuteTick();
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [dueDate, setDueDate] = useState(dueAtToDateInput(task?.due_at ?? null));
  const [dueTime, setDueTime] = useState(dueAtToTimeInput(task?.due_at ?? null));
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setDueDate(dueAtToDateInput(task?.due_at ?? null));
    setDueTime(dueAtToTimeInput(task?.due_at ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);

  function commitDueAt(nextDate: string, nextTime: string) {
    onUpdate({ due_at: combineDateTime(nextDate, nextTime) });
  }

  async function handleFilesSelected(files: FileList | File[]) {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setUploading(true);
    await Promise.all(fileArray.map((file) => onAddAttachment(file)));
    setUploading(false);
  }

  const urgency = task ? getUrgencyLevel(task.due_at, task.completed) : "none";
  const label = task ? urgencyLabel(task.due_at, task.completed) : null;

  return (
    <Modal open={task !== null} onClose={onClose} title="Detalhes da tarefa" className="max-w-4xl">
      {task && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {/* Coluna 1 — título e descrição */}
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
                  rows={9}
                  placeholder="Detalhes da tarefa..."
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => description !== (task.description ?? "") && onUpdate({ description: description || null })}
                />
              </div>
            </div>

            {/* Coluna 2 — prazo (integrado ao calendário) + urgência */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                  <CalendarClock size={13} />
                  Data
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  disabled={!canEdit}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    commitDueAt(e.target.value, dueTime);
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-secondary">Horário</label>
                <Input
                  type="time"
                  value={dueTime}
                  disabled={!canEdit || !dueDate}
                  onChange={(e) => {
                    setDueTime(e.target.value);
                    commitDueAt(dueDate, e.target.value);
                  }}
                />
              </div>

              {dueDate && (
                <>
                  {label && (
                    <p className={cn("flex items-center gap-1.5 text-xs font-medium", URGENCY_TEXT_CLASS[urgency])}>
                      <Circle size={8} className="shrink-0 fill-current" />
                      {label}
                    </p>
                  )}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setDueDate("");
                        setDueTime("");
                        onUpdate({ due_at: null });
                      }}
                      className="text-xs text-text-muted hover:text-danger hover:underline"
                    >
                      Remover prazo
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Coluna 3 — anexos, com arrastar-e-soltar múltiplos arquivos */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-secondary">
                Anexos {attachments.length > 0 && `(${attachments.length})`}
              </label>

              {canEdit && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (e.dataTransfer.files?.length) handleFilesSelected(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed p-3 text-center transition-colors",
                    dragOver ? "border-accent bg-accent/5" : "border-border-strong hover:bg-card-hover"
                  )}
                >
                  <Paperclip size={14} className="text-text-muted" />
                  <p className="text-[11px] text-text-muted">
                    {uploading ? "Enviando..." : "Arraste arquivos aqui ou clique pra escolher (vários de uma vez)"}
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) handleFilesSelected(e.target.files);
                  e.target.value = "";
                }}
              />

              {attachments.length === 0 ? (
                <p className="text-xs text-text-muted">Nenhum anexo ainda.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
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
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={task.completed}
                disabled={!canEdit}
                onChange={(e) => onUpdate({ completed: e.target.checked })}
              />
              Tarefa concluída
            </label>
            {canEdit && (
              <Button type="button" variant="danger" size="sm" onClick={onDelete}>
                <Trash2 size={14} />
                Excluir tarefa
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
