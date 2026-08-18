"use client";

import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TaskCard } from "./task-card";
import type { Database } from "@/lib/supabase/types";

type TaskColumn = Database["public"]["Tables"]["task_columns"]["Row"];
type Task = Database["public"]["Tables"]["tasks"]["Row"];
type TaskAttachment = Database["public"]["Tables"]["task_attachments"]["Row"];

interface KanbanBoardProps {
  columns: TaskColumn[];
  tasks: Task[];
  attachments: TaskAttachment[];
  canEdit: boolean;
  onAddColumn: (name: string) => void;
  onRenameColumn: (id: string, name: string) => void;
  onDeleteColumn: (id: string) => void;
  onMoveColumn: (id: string, direction: -1 | 1) => void;
  onAddTask: (columnId: string, title: string) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
  onOpenTask: (id: string) => void;
  onReorderTasks: (tasks: Task[]) => void;
}

export function KanbanBoard({
  columns,
  tasks,
  attachments,
  canEdit,
  onAddColumn,
  onRenameColumn,
  onDeleteColumn,
  onMoveColumn,
  onAddTask,
  onToggleComplete,
  onOpenTask,
  onReorderTasks,
}: KanbanBoardProps) {
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function tasksForColumn(columnId: string): Task[] {
    return tasks.filter((t) => t.column_id === columnId).sort((a, b) => a.position - b.position);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    const overTask = tasks.find((t) => t.id === over.id);
    const targetColumnId = overTask
      ? overTask.column_id
      : columns.some((c) => c.id === over.id)
        ? String(over.id)
        : activeTask.column_id;

    const sourceColumnId = activeTask.column_id;
    const sourceList = tasksForColumn(sourceColumnId).filter((t) => t.id !== activeTask.id);
    const targetList = sourceColumnId === targetColumnId ? sourceList : tasksForColumn(targetColumnId);

    let insertIndex = targetList.length;
    if (overTask && overTask.id !== activeTask.id) {
      const foundIndex = targetList.findIndex((t) => t.id === overTask.id);
      if (foundIndex !== -1) insertIndex = foundIndex;
    }

    const movedTask: Task = { ...activeTask, column_id: targetColumnId };
    targetList.splice(insertIndex, 0, movedTask);

    const updatedTargetList = targetList.map((t, i) => ({ ...t, position: i }));
    const updatedSourceList = sourceColumnId === targetColumnId ? [] : sourceList.map((t, i) => ({ ...t, position: i }));

    const changedIds = new Set([...updatedTargetList.map((t) => t.id), ...updatedSourceList.map((t) => t.id)]);
    const untouched = tasks.filter((t) => !changedIds.has(t.id));
    onReorderTasks([...untouched, ...updatedTargetList, ...updatedSourceList]);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex items-start gap-4 overflow-x-auto pb-4">
        {columns.map((column, index) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasksForColumn(column.id)}
            attachments={attachments}
            canEdit={canEdit}
            isFirst={index === 0}
            isLast={index === columns.length - 1}
            onRename={(name) => onRenameColumn(column.id, name)}
            onDelete={() => onDeleteColumn(column.id)}
            onMove={(dir) => onMoveColumn(column.id, dir)}
            onAddTask={(title) => onAddTask(column.id, title)}
            onToggleComplete={onToggleComplete}
            onOpenTask={onOpenTask}
          />
        ))}

        {canEdit && (
          <div className="w-72 shrink-0">
            {addingColumn ? (
              <div className="flex items-center gap-2 rounded-xl border border-border-strong bg-card p-2">
                <Input
                  autoFocus
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="Nome da coluna"
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newColumnName.trim()) {
                      onAddColumn(newColumnName.trim());
                      setNewColumnName("");
                      setAddingColumn(false);
                    }
                    if (e.key === "Escape") setAddingColumn(false);
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (!newColumnName.trim()) return;
                    onAddColumn(newColumnName.trim());
                    setNewColumnName("");
                    setAddingColumn(false);
                  }}
                >
                  Criar
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingColumn(true)}
                className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border-strong px-3 py-2.5 text-sm text-text-secondary hover:bg-card-hover"
              >
                <Plus size={16} />
                Nova coluna
              </button>
            )}
          </div>
        )}
      </div>
    </DndContext>
  );
}

function KanbanColumn({
  column,
  tasks,
  attachments,
  canEdit,
  isFirst,
  isLast,
  onRename,
  onDelete,
  onMove,
  onAddTask,
  onToggleComplete,
  onOpenTask,
}: {
  column: TaskColumn;
  tasks: Task[];
  attachments: TaskAttachment[];
  canEdit: boolean;
  isFirst: boolean;
  isLast: boolean;
  onRename: (name: string) => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  onAddTask: (title: string) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
  onOpenTask: (id: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: column.id });
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(column.name);
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  function commitAddTask() {
    if (!newTaskTitle.trim()) return;
    onAddTask(newTaskTitle.trim());
    setNewTaskTitle("");
  }

  return (
    <div className="w-72 shrink-0 rounded-xl border border-border bg-card p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        {editingName ? (
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              onRename(name.trim() || column.name);
              setEditingName(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            className="h-7 text-sm"
          />
        ) : (
          <button
            type="button"
            onClick={() => canEdit && setEditingName(true)}
            className="flex-1 truncate text-left text-sm font-medium text-text-primary"
          >
            {column.name} <span className="text-text-muted">({tasks.length})</span>
          </button>
        )}
        {canEdit && !editingName && (
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              disabled={isFirst}
              onClick={() => onMove(-1)}
              title="Mover coluna pra esquerda"
              className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:bg-card-hover disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              disabled={isLast}
              onClick={() => onMove(1)}
              title="Mover coluna pra direita"
              className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:bg-card-hover disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              title="Excluir coluna"
              className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:bg-card-hover hover:text-danger"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      <div ref={setNodeRef} className="min-h-[40px] space-y-2">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              canEdit={canEdit}
              attachmentCount={attachments.filter((a) => a.task_id === task.id).length}
              onToggleComplete={(completed) => onToggleComplete(task.id, completed)}
              onOpen={() => onOpenTask(task.id)}
            />
          ))}
        </SortableContext>
      </div>

      {canEdit &&
        (addingTask ? (
          <div className="mt-2 space-y-1.5">
            <Input
              autoFocus
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Título da tarefa"
              className="h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") commitAddTask();
                if (e.key === "Escape") setAddingTask(false);
              }}
            />
            <div className="flex gap-1.5">
              <Button type="button" size="sm" onClick={commitAddTask}>
                Adicionar
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setAddingTask(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingTask(true)}
            className="mt-2 flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-text-secondary hover:bg-card-hover"
          >
            <Plus size={13} />
            Adicionar tarefa
          </button>
        ))}
    </div>
  );
}
