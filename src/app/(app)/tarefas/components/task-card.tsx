"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Paperclip, GripVertical, Clock, Copy } from "lucide-react";
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-start gap-2 rounded-lg border px-2.5 py-2 text-sm transition-colors",
        task.completed
          ? "border-border bg-app opacity-60 hover:bg-card-hover/40"
          : "border-border bg-app hover:border-border-strong hover:bg-card-hover"
      )}
    >
      {canEdit && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-0.5 shrink-0 cursor-grab touch-none text-text-muted opacity-0 group-hover:opacity-100"
        >
          <GripVertical size={14} />
        </button>
      )}
      <input
        type="checkbox"
        checked={task.completed}
        disabled={!canEdit}
        onChange={(e) => onToggleComplete(e.target.checked)}
        onClick={(e) => e.stopPropagation()}
        className="mt-1 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onOpen}
          className={cn("block w-full truncate text-left text-text-primary", task.completed && "line-through")}
        >
          {task.title}
        </button>
        {task.due_at && (
          <span className={cn("mt-0.5 flex items-center gap-1 text-[10px]", URGENCY_TEXT_CLASS[urgency])}>
            <Clock size={9} />
            {formatDueAt(task.due_at)}
          </span>
        )}
      </div>
      {attachmentCount > 0 && (
        <span className="mt-0.5 flex shrink-0 items-center gap-0.5 text-[11px] text-text-muted">
          <Paperclip size={11} />
          {attachmentCount}
        </span>
      )}
      {canEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          title="Duplicar tarefa"
          className="mt-0.5 shrink-0 text-text-muted opacity-0 hover:text-text-primary group-hover:opacity-100"
        >
          <Copy size={12} />
        </button>
      )}
    </div>
  );
}
