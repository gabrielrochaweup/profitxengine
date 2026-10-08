"use client";

import { useState } from "react";
import { Plus, Clock, Paperclip, ListChecks, Pencil, ArrowLeft, ArrowRight, Trash2, Inbox, Columns3 } from "@/components/ui/icones";
import { MenuMais, ItemMenu } from "@/components/ui/menu-mais";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TaskCard } from "./task-card";
import { getUrgencyLevel, URGENCY_TEXT_CLASS, formatDueAt } from "../lib/urgency";
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
  onDuplicateTask: (id: string) => void;
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
  onDuplicateTask,
  onReorderTasks,
}: KanbanBoardProps) {
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  // Cópia local usada só durante o arraste, pra mover o card entre colunas
  // visualmente em tempo real (onDragOver) sem gravar no banco a cada
  // hover — só persiste de verdade uma vez, no drop (handleDragEnd).
  const [previewTasks, setPreviewTasks] = useState<Task[] | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const displayTasks = previewTasks ?? tasks;
  const activeTask = activeId ? displayTasks.find((t) => t.id === activeId) : null;

  function tasksForColumn(columnId: string): Task[] {
    return displayTasks.filter((t) => t.column_id === columnId).sort((a, b) => a.position - b.position);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
    setPreviewTasks(tasks);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeTaskId = String(active.id);
    const overId = String(over.id);
    if (activeTaskId === overId) return;

    setPreviewTasks((current) => {
      const list = current ?? tasks;
      const dragged = list.find((t) => t.id === activeTaskId);
      if (!dragged) return current;

      const overTask = list.find((t) => t.id === overId);
      const overColumnId = overTask ? overTask.column_id : columns.some((c) => c.id === overId) ? overId : null;
      if (!overColumnId) return current;
      if (dragged.column_id === overColumnId && overTask?.id === dragged.id) return current;

      const withoutDragged = list.filter((t) => t.id !== activeTaskId);
      const targetList = withoutDragged
        .filter((t) => t.column_id === overColumnId)
        .sort((a, b) => a.position - b.position);

      let insertIndex = targetList.length;
      if (overTask) {
        const idx = targetList.findIndex((t) => t.id === overTask.id);
        if (idx !== -1) insertIndex = idx;
      }

      targetList.splice(insertIndex, 0, { ...dragged, column_id: overColumnId });
      const reindexedTarget = targetList.map((t, i) => ({ ...t, position: i }));
      const otherTasks = withoutDragged.filter((t) => t.column_id !== overColumnId);
      return [...otherTasks, ...reindexedTarget];
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const finalTasks = previewTasks;
    setPreviewTasks(null);
    if (!finalTasks || !event.over) return;

    // Recalcula a posição final de cada tarefa dentro da sua coluna (o
    // preview do onDragOver já deixa isso quase certo, isso só garante
    // consistência) e só persiste se algo realmente mudou.
    const byColumn = new Map<string, Task[]>();
    finalTasks.forEach((t) => {
      const list = byColumn.get(t.column_id) ?? [];
      list.push(t);
      byColumn.set(t.column_id, list);
    });
    const recomputed: Task[] = [];
    byColumn.forEach((list) => {
      list
        .sort((a, b) => a.position - b.position)
        .forEach((t, i) => recomputed.push({ ...t, position: i }));
    });

    const original = new Map(tasks.map((t) => [t.id, t]));
    const changed = recomputed.some((t) => {
      const orig = original.get(t.id);
      return !orig || orig.column_id !== t.column_id || orig.position !== t.position;
    });
    if (changed) onReorderTasks(recomputed);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setPreviewTasks(null);
      }}
    >
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
            onDuplicateTask={onDuplicateTask}
          />
        ))}

        {canEdit && (
          <div className="w-72 shrink-0">
            {addingColumn ? (
              <div className="flex items-center gap-2 rounded-2xl border border-border-strong bg-card p-2 shadow-card">
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
                className="flex w-full items-center gap-2.5 rounded-2xl border border-dashed border-border-strong px-3 py-3 text-[13px] font-medium text-text-secondary transition-colors hover:border-accent hover:bg-card hover:text-accent-text"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-input">
                  <Columns3 size={14} />
                </span>
                Nova coluna
              </button>
            )}
          </div>
        )}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
        {activeTask && (
          <TaskCardPreview
            task={activeTask}
            attachmentCount={attachments.filter((a) => a.task_id === activeTask.id).length}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}

function TaskCardPreview({ task, attachmentCount }: { task: Task; attachmentCount: number }) {
  const urgency = getUrgencyLevel(task.due_at, task.completed);
  return (
    <div className="flex w-72 cursor-grabbing items-start gap-2 rounded-xl border border-accent bg-card px-3 py-2.5 text-[13px] shadow-popover">
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-text-primary", task.completed && "line-through")}>{task.title}</p>
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
    </div>
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
  onDuplicateTask,
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
  onDuplicateTask: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(column.name);
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  function commitAddTask() {
    if (!newTaskTitle.trim()) return;
    onAddTask(newTaskTitle.trim());
    setNewTaskTitle("");
  }

  const feitas = tasks.filter((t) => t.completed).length;

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-2xl border border-border bg-card p-3 shadow-card">
      {/* Cabeçalho: ícone + nome + quantas já foram feitas, e as ações da
          coluna num menu com o nome de cada uma — antes eram três ícones
          soltos (‹ › ×) e o × parecia "fechar", não "excluir". */}
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-input text-text-tertiary">
            <ListChecks size={14} />
          </span>
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
                if (e.key === "Escape") {
                  setName(column.name);
                  setEditingName(false);
                }
              }}
              className="h-7 text-sm"
            />
          ) : (
            <button
              type="button"
              onClick={() => canEdit && setEditingName(true)}
              title={canEdit ? "Clique pra renomear" : undefined}
              className="min-w-0 flex-1 truncate text-left text-[13px] font-semibold text-text-primary"
            >
              {column.name}
            </button>
          )}
          {!editingName && (
            <span
              title={`${feitas} de ${tasks.length} feitas`}
              className="shrink-0 rounded-md bg-input px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-text-tertiary"
            >
              {feitas}/{tasks.length}
            </span>
          )}
          {canEdit && !editingName && (
            <MenuMais label={`Ações da coluna ${column.name}`}>
              {(fechar) => (
                <>
                  <ItemMenu
                    icone={<Pencil size={13} />}
                    onClick={() => {
                      fechar();
                      setName(column.name);
                      setEditingName(true);
                    }}
                  >
                    Renomear coluna
                  </ItemMenu>
                  {!isFirst && (
                    <ItemMenu
                      icone={<ArrowLeft size={13} />}
                      onClick={() => {
                        fechar();
                        onMove(-1);
                      }}
                    >
                      Mover para a esquerda
                    </ItemMenu>
                  )}
                  {!isLast && (
                    <ItemMenu
                      icone={<ArrowRight size={13} />}
                      onClick={() => {
                        fechar();
                        onMove(1);
                      }}
                    >
                      Mover para a direita
                    </ItemMenu>
                  )}
                  <ItemMenu
                    perigo
                    icone={<Trash2 size={13} />}
                    onClick={() => {
                      fechar();
                      onDelete();
                    }}
                  >
                    Excluir coluna
                  </ItemMenu>
                </>
              )}
            </MenuMais>
          )}
        </div>
        {tasks.length > 0 && (
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-input" aria-hidden>
            <div
              className="h-full rounded-full bg-ok transition-[width] duration-300"
              style={{ width: `${(feitas / tasks.length) * 100}%` }}
            />
          </div>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "min-h-[56px] space-y-2 rounded-xl transition-colors",
          isOver && "bg-accent-soft ring-1 ring-inset ring-accent"
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              canEdit={canEdit}
              attachmentCount={attachments.filter((a) => a.task_id === task.id).length}
              onToggleComplete={(completed) => onToggleComplete(task.id, completed)}
              onOpen={() => onOpenTask(task.id)}
              onDuplicate={() => onDuplicateTask(task.id)}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-border-strong px-3 py-5 text-center">
            <Inbox size={16} className="text-text-muted" />
            <p className="text-[11px] text-text-tertiary">
              {canEdit ? "Sem tarefas. Crie uma ou arraste pra cá." : "Sem tarefas."}
            </p>
          </div>
        )}
      </div>

      {canEdit &&
        (addingTask ? (
          <div className="mt-2.5 space-y-1.5">
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
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-2 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent-text"
          >
            <Plus size={13} />
            Adicionar tarefa
          </button>
        ))}
    </div>
  );
}
