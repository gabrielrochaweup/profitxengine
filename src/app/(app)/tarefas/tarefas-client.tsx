"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { sanitizeFileName } from "@/lib/sanitize-filename";
import { KanbanBoard } from "./components/kanban-board";
import { TaskDetailModal } from "./components/task-detail-modal";
import type { Database } from "@/lib/supabase/types";

type TaskColumn = Database["public"]["Tables"]["task_columns"]["Row"];
type Task = Database["public"]["Tables"]["tasks"]["Row"];
type TaskAttachment = Database["public"]["Tables"]["task_attachments"]["Row"];
type TaskAttachmentVariant = Database["public"]["Tables"]["task_attachment_variants"]["Row"];

// Toda tarefa nova já nasce com essas 3 — cobre o caso mais comum (o mesmo
// post em 3 idiomas) sem precisar criar manualmente toda vez. Editável
// (renomear/excluir) depois, como qualquer variação criada na mão.
const DEFAULT_VARIANT_NAMES = ["Português", "Espanhol", "Inglês"];

interface TarefasClientProps {
  productId: string;
  initialColumns: TaskColumn[];
  initialTasks: Task[];
  initialAttachments: TaskAttachment[];
  initialVariants: TaskAttachmentVariant[];
  canEdit: boolean;
  currentUserId: string;
}

export function TarefasClient({
  productId,
  initialColumns,
  initialTasks,
  initialAttachments,
  initialVariants,
  canEdit,
  currentUserId,
}: TarefasClientProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const [columns, setColumns] = useState(initialColumns);
  const [tasks, setTasks] = useState(initialTasks);
  const [attachments, setAttachments] = useState(initialAttachments);
  const [variants, setVariants] = useState(initialVariants);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  async function addColumn(name: string) {
    const position = columns.length;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("task_columns")
      .insert({ product_id: productId, name, position, created_by: currentUserId })
      .select()
      .single();
    if (!error && data) {
      setColumns((prev) => [...prev, data]);
    } else {
      toast.error("Erro ao criar a coluna.");
    }
  }

  async function renameColumn(id: string, name: string) {
    setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
    const supabase = createClient();
    const { error } = await supabase.from("task_columns").update({ name }).eq("id", id);
    if (error) toast.error("Erro ao renomear a coluna.");
  }

  async function deleteColumn(id: string) {
    const column = columns.find((c) => c.id === id);
    if (!column) return;
    const taskCount = tasks.filter((t) => t.column_id === id).length;
    const ok = await confirm({
      title: "Excluir coluna",
      description:
        taskCount > 0
          ? `Excluir "${column.name}" e ${taskCount} tarefa(s) dentro dela? Essa ação não pode ser desfeita.`
          : `Excluir "${column.name}"? Essa ação não pode ser desfeita.`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const supabase = createClient();
    const { error } = await supabase.from("task_columns").delete().eq("id", id);
    if (!error) {
      setColumns((prev) => prev.filter((c) => c.id !== id));
      setTasks((prev) => prev.filter((t) => t.column_id !== id));
    } else {
      toast.error("Erro ao excluir a coluna.");
    }
  }

  function moveColumn(id: string, direction: -1 | 1) {
    const index = columns.findIndex((c) => c.id === id);
    const swapIndex = index + direction;
    if (index === -1 || swapIndex < 0 || swapIndex >= columns.length) return;
    const reordered = [...columns];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
    const withPositions = reordered.map((c, i) => ({ ...c, position: i }));
    setColumns(withPositions);
    const supabase = createClient();
    Promise.all(
      withPositions.map((c) => supabase.from("task_columns").update({ position: c.position }).eq("id", c.id))
    ).then((results) => {
      if (results.some((r) => r.error)) toast.error("Erro ao reordenar as colunas.");
    });
  }

  async function addTask(columnId: string, title: string) {
    const position = tasks.filter((t) => t.column_id === columnId).length;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("tasks")
      .insert({ product_id: productId, column_id: columnId, title, position, created_by: currentUserId })
      .select()
      .single();
    if (!error && data) {
      setTasks((prev) => [...prev, data]);
      const { data: newVariants } = await supabase
        .from("task_attachment_variants")
        .insert(
          DEFAULT_VARIANT_NAMES.map((name, i) => ({
            task_id: data.id,
            product_id: productId,
            name,
            position: i,
            created_by: currentUserId,
          }))
        )
        .select();
      if (newVariants) setVariants((prev) => [...prev, ...newVariants]);
    } else {
      toast.error("Erro ao criar a tarefa.");
    }
  }

  async function updateTask(id: string, patch: Partial<Pick<Task, "title" | "description" | "completed" | "due_at">>) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    const supabase = createClient();
    const { error } = await supabase
      .from("tasks")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error("Erro ao salvar a tarefa.");
  }

  async function duplicateTask(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const position = tasks.filter((t) => t.column_id === task.column_id).length;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        product_id: productId,
        column_id: task.column_id,
        title: `${task.title} (cópia)`,
        description: task.description,
        due_at: task.due_at,
        position,
        created_by: currentUserId,
      })
      .select()
      .single();
    if (!error && data) {
      setTasks((prev) => [...prev, data]);
    } else {
      toast.error("Erro ao duplicar a tarefa.");
    }
  }

  async function deleteTask(id: string) {
    const task = tasks.find((t) => t.id === id);
    const ok = await confirm({
      title: "Excluir tarefa",
      description: `Excluir "${task?.title ?? "essa tarefa"}"? Essa ação não pode ser desfeita.`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const supabase = createClient();
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (!error) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setOpenTaskId(null);
    } else {
      toast.error("Erro ao excluir a tarefa.");
    }
  }

  // Chamado pelo KanbanBoard já com column_id/position recalculados pra
  // todas as tarefas afetadas pelo drag (coluna de origem + destino).
  function reorderTasks(nextTasks: Task[]) {
    setTasks(nextTasks);
    const supabase = createClient();
    Promise.all(
      nextTasks.map((t) =>
        supabase.from("tasks").update({ column_id: t.column_id, position: t.position }).eq("id", t.id)
      )
    ).then((results) => {
      if (results.some((r) => r.error)) toast.error("Erro ao mover a tarefa.");
    });
  }

  async function addAttachment(taskId: string, file: File, variantId: string | null) {
    const supabase = createClient();
    const path = `${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage.from("task-attachments").upload(path, file);
    if (uploadError) {
      toast.error(`Erro ao enviar o arquivo: ${uploadError.message}`);
      return;
    }
    const { data: urlData } = supabase.storage.from("task-attachments").getPublicUrl(path);
    const { data, error } = await supabase
      .from("task_attachments")
      .insert({
        task_id: taskId,
        product_id: productId,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_type: file.type || null,
        variant_id: variantId,
        created_by: currentUserId,
      })
      .select()
      .single();
    if (!error && data) {
      setAttachments((prev) => [...prev, data]);
    } else {
      toast.error("Erro ao salvar o anexo.");
    }
  }

  async function removeAttachment(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("task_attachments").delete().eq("id", id);
    if (!error) {
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    } else {
      toast.error("Erro ao remover o anexo.");
    }
  }

  async function addVariant(taskId: string, name: string): Promise<TaskAttachmentVariant | null> {
    const position = variants.filter((v) => v.task_id === taskId).length;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("task_attachment_variants")
      .insert({ task_id: taskId, product_id: productId, name, position, created_by: currentUserId })
      .select()
      .single();
    if (!error && data) {
      setVariants((prev) => [...prev, data]);
      return data;
    }
    toast.error("Erro ao criar a variação.");
    return null;
  }

  async function renameVariant(id: string, name: string) {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, name } : v)));
    const supabase = createClient();
    const { error } = await supabase.from("task_attachment_variants").update({ name }).eq("id", id);
    if (error) toast.error("Erro ao renomear a variação.");
  }

  async function deleteVariant(id: string) {
    const variant = variants.find((v) => v.id === id);
    const ok = await confirm({
      title: "Excluir variação",
      description: `Excluir "${variant?.name ?? "essa variação"}"? Os anexos dela voltam pra "Todos", nenhum anexo é apagado.`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const supabase = createClient();
    const { error } = await supabase.from("task_attachment_variants").delete().eq("id", id);
    if (!error) {
      setVariants((prev) => prev.filter((v) => v.id !== id));
      setAttachments((prev) => prev.map((a) => (a.variant_id === id ? { ...a, variant_id: null } : a)));
    } else {
      toast.error("Erro ao excluir a variação.");
    }
  }

  const openTask = openTaskId ? (tasks.find((t) => t.id === openTaskId) ?? null) : null;

  return (
    <div className="mt-6">
      <KanbanBoard
        columns={columns}
        tasks={tasks}
        attachments={attachments}
        canEdit={canEdit}
        onAddColumn={addColumn}
        onRenameColumn={renameColumn}
        onDeleteColumn={deleteColumn}
        onMoveColumn={moveColumn}
        onAddTask={addTask}
        onToggleComplete={(id, completed) => updateTask(id, { completed })}
        onOpenTask={setOpenTaskId}
        onDuplicateTask={duplicateTask}
        onReorderTasks={reorderTasks}
      />

      <TaskDetailModal
        task={openTask}
        attachments={openTask ? attachments.filter((a) => a.task_id === openTask.id) : []}
        variants={openTask ? variants.filter((v) => v.task_id === openTask.id).sort((a, b) => a.position - b.position) : []}
        canEdit={canEdit}
        onClose={() => setOpenTaskId(null)}
        onUpdate={(patch) => openTask && updateTask(openTask.id, patch)}
        onDelete={() => openTask && deleteTask(openTask.id)}
        onAddAttachment={(file, variantId) => openTask && addAttachment(openTask.id, file, variantId)}
        onRemoveAttachment={removeAttachment}
        onAddVariant={(name) => (openTask ? addVariant(openTask.id, name) : Promise.resolve(null))}
        onRenameVariant={renameVariant}
        onDeleteVariant={deleteVariant}
      />
    </div>
  );
}
