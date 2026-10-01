"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Paperclip, GripVertical, Clock, Copy, Circle, CheckCircle2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUrgencyLevel, URGENCY_TEXT_CLASS, formatDueAt, useMinuteTick } from "../lib/urgency";
import type { Database } from "@/lib/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

interface TaskCardProps {
  task: Task;
  canEdit: boolean;
  attachmentCount: number;
  onToggleComplete: (completed: boolean) => void;
  onOpen: () => void;
  onDuplicate: () => void;
}

/*
  Cartão de tarefa. Cada controle diz o que faz:
    ⋮⋮  alça de arrastar — sempre visível (fraca), não escondida até o hover
    ○/✓ marcar como feita — no lugar do checkbox nativo, que mal aparecia
    título  abre a tarefa; "Abrir" e "Duplicar" também aparecem no hover
*/
export function TaskCard({ task, canEdit, attachmentCount, onToggleComplete, onOpen, onDuplicate }: TaskCardProps) {
  useMinuteTick();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !canEdit,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const urgency = getUrgencyLevel(task.due_at, task.completed);
  const temMeta = !!task.due_at || attachmentCount > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-xl border px-2.5 py-2.5 transition-colors",
        task.completed
          ? "border-border bg-app opacity-70 hover:opacity-100"
          : "border-border bg-app hover:border-border-strong hover:bg-card-hover"
      )}
    >
      <div className="flex items-start gap-1.5">
        {canEdit && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            title="Arraste pra mover"
            aria-label="Arrastar tarefa"
            className="mt-0.5 shrink-0 cursor-grab touch-none text-text-muted opacity-40 transition-opacity active:cursor-grabbing group-hover:opacity-100"
          >
            <GripVertical size={14} />
          </button>
        )}
        <button
          type="button"
          disabled={!canEdit}
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(!task.completed);
          }}
          title={task.completed ? "Desmarcar (voltar a pendente)" : "Marcar como feita"}
          aria-label={task.completed ? "Desmarcar tarefa" : "Marcar tarefa como feita"}
          aria-pressed={task.completed}
          className={cn(
            "mt-px shrink-0 transition-colors disabled:cursor-default",
            task.completed ? "text-ok" : "text-text-muted hover:text-ok"
          )}
        >
          {task.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
        </button>
        <button
          type="button"
          onClick={onOpen}
          title="Abrir tarefa"
          className={cn(
            "line-clamp-2 min-w-0 flex-1 text-left text-[13px] leading-snug",
            task.completed ? "text-text-tertiary line-through" : "text-text-primary"
          )}
        >
          {task.title}
        </button>
      </div>

      <div className={cn("mt-1.5 flex items-center gap-2.5", canEdit ? "pl-[42px]" : "pl-[22px]", !temMeta && !canEdit && "hidden")}>
        {task.due_at && (
          <span
            title="Prazo"
            className={cn("flex items-center gap-1 text-[11px] tabular-nums", URGENCY_TEXT_CLASS[urgency])}
          >
            <Clock size={11} />
            {formatDueAt(task.due_at)}
          </span>
        )}
        {attachmentCount > 0 && (
          <span title={`${attachmentCount} anexo(s)`} className="flex items-center gap-1 text-[11px] text-text-muted">
            <Paperclip size={11} />
            {attachmentCount}
          </span>
        )}
        <span className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            onClick={onOpen}
            title="Abrir tarefa"
            aria-label="Abrir tarefa"
            className="flex h-6 w-6 items-center justify-center rounded-md text-text-muted hover:bg-card hover:text-text-primary"
          >
            <Maximize2 size={12} />
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              title="Duplicar tarefa"
              aria-label="Duplicar tarefa"
              className="flex h-6 w-6 items-center justify-center rounded-md text-text-muted hover:bg-card hover:text-text-primary"
            >
              <Copy size={12} />
            </button>
          )}
        </span>
      </div>
    </div>
  );
}
