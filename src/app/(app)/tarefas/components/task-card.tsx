"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Paperclip, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

interface TaskCardProps {
  task: Task;
  canEdit: boolean;
  attachmentCount: number;
  onToggleComplete: (completed: boolean) => void;
  onOpen: () => void;
}

export function TaskCard({ task, canEdit, attachmentCount, onToggleComplete, onOpen }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !canEdit,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-start gap-2 rounded-lg border border-border bg-app px-2.5 py-2 text-sm",
        task.completed && "opacity-60"
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
      <button type="button" onClick={onOpen} className={cn("flex-1 text-left text-text-primary", task.completed && "line-through")}>
        {task.title}
      </button>
      {attachmentCount > 0 && (
        <span className="mt-0.5 flex shrink-0 items-center gap-0.5 text-[11px] text-text-muted">
          <Paperclip size={11} />
          {attachmentCount}
        </span>
      )}
    </div>
  );
}
