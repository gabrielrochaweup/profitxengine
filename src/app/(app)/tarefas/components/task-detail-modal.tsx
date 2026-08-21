"use client";

import { useEffect, useRef, useState } from "react";
import { Paperclip, Trash2, X, FileText, CalendarClock, Circle, Plus, Pencil, Check, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getUrgencyLevel, URGENCY_TEXT_CLASS, urgencyLabel, useMinuteTick } from "../lib/urgency";
import type { Database } from "@/lib/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];
type TaskAttachment = Database["public"]["Tables"]["task_attachments"]["Row"];
type TaskAttachmentVariant = Database["public"]["Tables"]["task_attachment_variants"]["Row"];

interface TaskDetailModalProps {
  task: Task | null;
  attachments: TaskAttachment[];
  variants: TaskAttachmentVariant[];
  canEdit: boolean;
  onClose: () => void;
  onUpdate: (patch: Partial<Pick<Task, "title" | "description" | "completed" | "due_at">>) => void;
  onDelete: () => void;
  onAddAttachment: (file: File, variantId: string | null) => void;
  onRemoveAttachment: (id: string) => void;
  onReorderAttachments: (attachments: TaskAttachment[]) => void;
  onAddVariant: (name: string) => Promise<TaskAttachmentVariant | null>;
  onRenameVariant: (id: string, name: string) => void;
  onDeleteVariant: (id: string) => void;
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
  variants,
  canEdit,
  onClose,
  onUpdate,
  onDelete,
  onAddAttachment,
  onRemoveAttachment,
  onReorderAttachments,
  onAddVariant,
  onRenameVariant,
  onDeleteVariant,
}: TaskDetailModalProps) {
  useMinuteTick();
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [dueDate, setDueDate] = useState(dueAtToDateInput(task?.due_at ?? null));
  const [dueTime, setDueTime] = useState(dueAtToTimeInput(task?.due_at ?? null));
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null);
  const [addingVariant, setAddingVariant] = useState(false);
  const [newVariantName, setNewVariantName] = useState("");
  const [renamingVariantId, setRenamingVariantId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setDueDate(dueAtToDateInput(task?.due_at ?? null));
    setDueTime(dueAtToTimeInput(task?.due_at ?? null));
    setActiveVariantId(null);
    setAddingVariant(false);
    setRenamingVariantId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);

  function commitDueAt(nextDate: string, nextTime: string) {
    onUpdate({ due_at: combineDateTime(nextDate, nextTime) });
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  // Arrastar só reordena de verdade quando dá pra manter uma sequência
  // coerente: dentro de uma variação específica, ou em "Todos" quando a
  // tarefa não tem nenhuma variação (aí "Todos" é a única lista que existe).
  // Com variações cadastradas, "Todos" mistura sequências independentes —
  // arrastar ali não teria uma ordem única e correta pra persistir.
  const canReorder = activeVariantId !== null || variants.length === 0;
  const variantPosition = new Map(variants.map((v) => [v.id, v.position]));

  const visibleAttachments = (
    activeVariantId === null ? attachments : attachments.filter((a) => a.variant_id === activeVariantId)
  )
    .slice()
    .sort((a, b) => {
      const av = a.variant_id ? (variantPosition.get(a.variant_id) ?? 0) : -1;
      const bv = b.variant_id ? (variantPosition.get(b.variant_id) ?? 0) : -1;
      if (av !== bv) return av - bv;
      return a.position - b.position;
    });
  const activeVariantName = variants.find((v) => v.id === activeVariantId)?.name ?? null;

  function handleAttachmentDragEnd(event: DragEndEvent) {
    if (!canReorder) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = visibleAttachments.findIndex((a) => a.id === active.id);
    const newIndex = visibleAttachments.findIndex((a) => a.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(visibleAttachments, oldIndex, newIndex).map((a, i) => ({ ...a, position: i }));
    onReorderAttachments(reordered);
  }

  async function handleFilesSelected(files: FileList | File[]) {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setUploading(true);
    await Promise.all(fileArray.map((file) => onAddAttachment(file, activeVariantId)));
    setUploading(false);
  }

  async function commitNewVariant() {
    const name = newVariantName.trim();
    setAddingVariant(false);
    setNewVariantName("");
    if (!name) return;
    const created = await onAddVariant(name);
    if (created) setActiveVariantId(created.id);
  }

  function startRenameVariant(variant: TaskAttachmentVariant) {
    setRenamingVariantId(variant.id);
    setRenameValue(variant.name);
  }

  function commitRenameVariant(variant: TaskAttachmentVariant) {
    const name = renameValue.trim();
    setRenamingVariantId(null);
    if (name && name !== variant.name) onRenameVariant(variant.id, name);
  }

  const urgency = task ? getUrgencyLevel(task.due_at, task.completed) : "none";
  const label = task ? urgencyLabel(task.due_at, task.completed) : null;

  return (
    <Modal open={task !== null} onClose={onClose} title="Detalhes da tarefa" className="max-w-6xl">
      {task && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Coluna 1 — título e descrição */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="flex h-4 items-center text-xs font-medium text-text-secondary">Título</label>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="flex h-4 items-center gap-1.5 text-xs font-medium text-text-secondary">
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
                  <label className="flex h-4 items-center text-xs font-medium text-text-secondary">Horário</label>
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
            <div className="flex min-h-0 flex-col space-y-2">
              <label className="flex h-4 items-center text-xs font-medium text-text-secondary">
                Anexos {attachments.length > 0 && `(${attachments.length})`}
              </label>

              {(variants.length > 0 || canEdit) && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveVariantId(null)}
                    className={cn(
                      "rounded-button px-2 py-1 text-[11px] font-medium transition-colors",
                      activeVariantId === null
                        ? "bg-accent text-white"
                        : "border border-border-strong text-text-secondary hover:bg-card-hover"
                    )}
                  >
                    Todos
                  </button>
                  {variants.map((variant) =>
                    renamingVariantId === variant.id ? (
                      <Input
                        key={variant.id}
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => commitRenameVariant(variant)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                          if (e.key === "Escape") setRenamingVariantId(null);
                        }}
                        className="h-6 w-24 text-[11px]"
                      />
                    ) : (
                      <span key={variant.id} className="inline-flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => setActiveVariantId(variant.id)}
                          className={cn(
                            "rounded-button px-2 py-1 text-[11px] font-medium transition-colors",
                            activeVariantId === variant.id
                              ? "bg-accent text-white"
                              : "border border-border-strong text-text-secondary hover:bg-card-hover"
                          )}
                        >
                          {variant.name}
                        </button>
                        {canEdit && activeVariantId === variant.id && (
                          <>
                            <button
                              type="button"
                              onClick={() => startRenameVariant(variant)}
                              title="Renomear variação"
                              className="text-text-muted hover:text-text-primary"
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteVariant(variant.id)}
                              title="Excluir variação"
                              className="text-text-muted hover:text-danger"
                            >
                              <X size={11} />
                            </button>
                          </>
                        )}
                      </span>
                    )
                  )}
                  {canEdit &&
                    (addingVariant ? (
                      <span className="inline-flex items-center gap-0.5">
                        <Input
                          autoFocus
                          value={newVariantName}
                          onChange={(e) => setNewVariantName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitNewVariant();
                            if (e.key === "Escape") {
                              setAddingVariant(false);
                              setNewVariantName("");
                            }
                          }}
                          placeholder="Nome da variação"
                          className="h-6 w-28 text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={commitNewVariant}
                          title="Confirmar"
                          className="text-text-muted hover:text-success"
                        >
                          <Check size={13} />
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAddingVariant(true)}
                        title="Nova variação"
                        className="flex h-6 w-6 items-center justify-center rounded-button border border-dashed border-border-strong text-text-muted hover:bg-card-hover"
                      >
                        <Plus size={12} />
                      </button>
                    ))}
                </div>
              )}

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
                    "flex shrink-0 cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed p-3 text-center transition-colors",
                    dragOver ? "border-accent bg-accent/5" : "border-border-strong hover:bg-card-hover"
                  )}
                >
                  <Paperclip size={14} className="text-text-muted" />
                  <p className="text-[11px] text-text-muted">
                    {uploading
                      ? "Enviando..."
                      : `Arraste arquivos aqui ou clique pra escolher (vários de uma vez)${activeVariantName ? ` — vai pra "${activeVariantName}"` : ""}`}
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

              {/* Altura travada — a lista de anexos rola por dentro em vez de
                  esticar o popup inteiro quando tem muito arquivo. */}
              <div className="max-h-64 overflow-y-auto pr-0.5">
                {visibleAttachments.length === 0 ? (
                  <p className="text-xs text-text-muted">
                    {activeVariantName ? `Nenhum anexo em "${activeVariantName}" ainda.` : "Nenhum anexo ainda."}
                  </p>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleAttachmentDragEnd}>
                    <SortableContext
                      items={visibleAttachments.map((a) => a.id)}
                      strategy={rectSortingStrategy}
                      disabled={!canEdit || !canReorder}
                    >
                      <div className="grid grid-cols-2 gap-2">
                        {visibleAttachments.map((attachment, index) => {
                          const attachmentVariant =
                            activeVariantId === null && attachment.variant_id
                              ? variants.find((v) => v.id === attachment.variant_id)
                              : null;
                          return (
                            <AttachmentThumb
                              key={attachment.id}
                              attachment={attachment}
                              index={index}
                              variantName={attachmentVariant?.name ?? null}
                              showPosition={canReorder}
                              canDrag={canEdit && canReorder}
                              canRemove={canEdit}
                              onRemove={() => onRemoveAttachment(attachment.id)}
                            />
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
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

function AttachmentThumb({
  attachment,
  index,
  variantName,
  showPosition,
  canDrag,
  canRemove,
  onRemove,
}: {
  attachment: TaskAttachment;
  index: number;
  variantName: string | null;
  showPosition: boolean;
  canDrag: boolean;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: attachment.id,
    disabled: !canDrag,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative overflow-hidden rounded-lg border border-border"
    >
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
      {showPosition && (
        <span className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-[9px] font-medium text-white">
          {index + 1}
        </span>
      )}
      {variantName && (
        <span className="absolute bottom-1 left-1 rounded-button bg-black/60 px-1.5 py-0.5 text-[9px] text-white">
          {variantName}
        </span>
      )}
      {canDrag && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          title="Arrastar pra reordenar"
          className="absolute bottom-1 right-1 flex h-5 w-5 cursor-grab touch-none items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
        >
          <GripVertical size={11} />
        </button>
      )}
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          title="Remover anexo"
          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}
