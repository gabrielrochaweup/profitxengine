"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Copy, Trash2, GripVertical, FolderPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/page";
import { AbasDePastas, usePastaNaUrl } from "@/components/ui/abas-de-pastas";
import { useActiveProduct } from "@/components/layout/active-product-context";
import type { Database } from "@/lib/supabase/types";
import { PromptForm } from "./prompt-form";

type Prompt = Database["public"]["Tables"]["prompts"]["Row"];
type PromptCategoryRow = Database["public"]["Tables"]["prompt_categories"]["Row"];

interface PromptsClientProps {
  initialPrompts: Prompt[];
  initialCategories: PromptCategoryRow[];
  currentUserId: string;
}

/*
  Biblioteca de prompts em PASTAS (abas): uma pasta aberta por vez, com os
  prompts dela em grade. As "colunas" de antes continuam sendo as mesmas
  categorias no banco (prompt_categories) — só mudou o jeito de mostrar.
  Arrastar um prompt pra cima de uma aba move ele pra aquela pasta.
*/
export function PromptsClient({ initialPrompts, initialCategories, currentUserId }: PromptsClientProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const { activeProductId } = useActiveProduct();
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [categories, setCategories] = useState<PromptCategoryRow[]>(initialCategories);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [newPromptCategoryId, setNewPromptCategoryId] = useState<string | undefined>(undefined);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [ativaDaUrl, setAtiva] = usePastaNaUrl(initialCategories[0]?.id ?? "");

  // Pasta da URL que não existe mais (excluída, link velho) cai na primeira.
  const ativa = categories.some((c) => c.id === ativaDaUrl) ? ativaDaUrl : (categories[0]?.id ?? "");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return prompts;
    return prompts.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query) ||
        (p.tags ?? []).some((tag) => tag.toLowerCase().includes(query))
    );
  }, [prompts, search]);

  const byCategory = useMemo(() => {
    const map: Record<string, Prompt[]> = {};
    categories.forEach((c) => {
      map[c.id] = [];
    });
    filtered.forEach((p) => {
      if (map[p.category_id]) map[p.category_id].push(p);
    });
    return map;
  }, [filtered, categories]);

  function openNew(categoryId: string) {
    setEditingPrompt(null);
    setNewPromptCategoryId(categoryId);
    setFormOpen(true);
  }

  async function handleDelete(prompt: Prompt) {
    const ok = await confirm({
      title: "Excluir prompt",
      description: `Excluir o prompt "${prompt.title}"?`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const supabase = createClient();
    const { error } = await supabase.from("prompts").delete().eq("id", prompt.id);
    if (!error) {
      setPrompts((prev) => prev.filter((p) => p.id !== prompt.id));
    } else {
      toast.error("Erro ao excluir o prompt. Tente novamente.");
    }
  }

  async function handleDuplicate(prompt: Prompt) {
    if (!activeProductId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("prompts")
      .insert({
        product_id: activeProductId,
        title: `${prompt.title} (cópia)`,
        category_id: prompt.category_id,
        content: prompt.content,
        tags: prompt.tags,
        created_by: currentUserId,
      })
      .select()
      .single();
    if (!error && data) {
      setPrompts((prev) => [data, ...prev]);
    } else {
      toast.error("Erro ao duplicar o prompt. Tente novamente.");
    }
  }

  function handleSaved(saved: Prompt, isNew: boolean) {
    setPrompts((prev) => (isNew ? [saved, ...prev] : prev.map((p) => (p.id === saved.id ? saved : p))));
    setFormOpen(false);
    setEditingPrompt(null);
  }

  async function handleDropOnCategory(categoryId: string) {
    const promptId = draggingId;
    setDraggingId(null);
    if (!promptId) return;

    const prompt = prompts.find((p) => p.id === promptId);
    if (!prompt || prompt.category_id === categoryId) return;

    const previousCategoryId = prompt.category_id;
    setPrompts((prev) => prev.map((p) => (p.id === promptId ? { ...p, category_id: categoryId } : p)));

    const supabase = createClient();
    const { error } = await supabase.from("prompts").update({ category_id: categoryId }).eq("id", promptId);
    if (error) {
      setPrompts((prev) => prev.map((p) => (p.id === promptId ? { ...p, category_id: previousCategoryId } : p)));
      toast.error("Erro ao mover o prompt. Tente novamente.");
      return;
    }
    const destino = categories.find((c) => c.id === categoryId)?.name;
    toast.success(`Prompt movido para "${destino}".`);
  }

  async function handleAddCategory(name: string): Promise<boolean> {
    if (!activeProductId) return false;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("prompt_categories")
      .insert({ product_id: activeProductId, name, position: categories.length, created_by: currentUserId })
      .select()
      .single();
    if (error || !data) {
      toast.error("Erro ao criar a pasta. Tente novamente.");
      return false;
    }
    setCategories((prev) => [...prev, data]);
    setAtiva(data.id);
    return true;
  }

  async function renameCategory(id: string, name: string) {
    const category = categories.find((c) => c.id === id);
    if (!category) return;
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
    const supabase = createClient();
    const { error } = await supabase.from("prompt_categories").update({ name }).eq("id", id);
    if (error) {
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name: category.name } : c)));
      toast.error("Erro ao renomear a pasta. Tente novamente.");
    }
  }

  async function moveCategory(id: string, direction: -1 | 1) {
    const index = categories.findIndex((c) => c.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= categories.length) return;
    const next = [...categories];
    [next[index], next[target]] = [next[target], next[index]];
    const withPositions = next.map((c, i) => ({ ...c, position: i }));
    setCategories(withPositions);
    const supabase = createClient();
    const results = await Promise.all(
      withPositions.map((c) => supabase.from("prompt_categories").update({ position: c.position }).eq("id", c.id))
    );
    if (results.some((r) => r.error)) toast.error("Erro ao reordenar as pastas. Tente novamente.");
  }

  async function deleteCategory(id: string) {
    const category = categories.find((c) => c.id === id);
    if (!category) return;
    // Conta os prompts da pasta sem o filtro da busca: uma busca ativa não
    // pode fazer uma pasta cheia parecer vazia na hora de excluir.
    if (prompts.some((p) => p.category_id === id)) {
      toast.error("Mova ou exclua os prompts dessa pasta antes de excluí-la.");
      return;
    }
    const ok = await confirm({
      title: "Excluir pasta",
      description: `Excluir a pasta "${category.name}"?`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const supabase = createClient();
    const { error } = await supabase.from("prompt_categories").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir a pasta. Tente novamente.");
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  const itens = byCategory[ativa] ?? [];
  const buscando = search.trim().length > 0;
  const emOutras = buscando ? filtered.length - itens.length : 0;

  const busca = (
    <div className="relative w-full min-w-[200px] sm:w-64">
      <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar em todas as pastas…"
        className="h-8 w-full rounded-input bg-input pl-8 pr-3 text-[12px] text-text-primary outline-none placeholder:text-text-muted transition-shadow focus:shadow-[0_0_0_2px_var(--accent)]"
      />
    </div>
  );

  return (
    <div>
      {categories.length === 0 ? (
        <EmptyState
          icone={FolderPlus}
          titulo="Nenhuma pasta ainda"
          descricao="As pastas organizam os prompts por assunto — conversas, e-mails, criativos. Crie a primeira pra começar a guardar."
          acao={
            <Button
              type="button"
              onClick={async () => {
                await handleAddCategory("Geral");
              }}
            >
              <Plus size={14} />
              Criar pasta “Geral”
            </Button>
          }
        />
      ) : (
        <AbasDePastas
          abas={categories.map((c) => ({ id: c.id, nome: c.name, total: (byCategory[c.id] ?? []).length }))}
          ativa={ativa}
          onTrocar={setAtiva}
          onCriar={handleAddCategory}
          onRenomear={renameCategory}
          onMover={moveCategory}
          onExcluir={deleteCategory}
          arrastando={draggingId !== null}
          onSoltar={handleDropOnCategory}
          ferramentas={busca}
          acoesDaAba={
            <Button type="button" size="sm" onClick={() => openNew(ativa)}>
              <Plus size={14} />
              Novo prompt
            </Button>
          }
        >
          {buscando && emOutras > 0 && (
            <p className="mb-3 text-[12px] text-text-tertiary">
              Mais {emOutras} {emOutras === 1 ? "resultado" : "resultados"} em outras pastas — o número em cada aba mostra
              onde.
            </p>
          )}

          {itens.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong px-4 py-10 text-center">
              <p className="text-[13px] text-text-secondary">
                {buscando ? "Nenhum prompt desta pasta bate com a busca." : "Nenhum prompt nesta pasta ainda."}
              </p>
              {!buscando && (
                <Button type="button" size="sm" variant="secondary" className="mt-3" onClick={() => openNew(ativa)}>
                  <Plus size={14} />
                  Criar o primeiro
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {itens.map((prompt) => (
                <Card
                  key={prompt.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggingId(prompt.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => setDraggingId(null)}
                  className={`group flex flex-col p-3.5 transition-opacity ${draggingId === prompt.id ? "opacity-40" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      title="Arraste até uma aba pra mudar de pasta"
                      className="mt-0.5 shrink-0 cursor-grab text-text-muted opacity-60 transition-opacity active:cursor-grabbing group-hover:opacity-100"
                    >
                      <GripVertical size={14} />
                    </span>
                    <h3 className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-text-primary">{prompt.title}</h3>
                    <Badge>{prompt.usage_count}x</Badge>
                  </div>

                  <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-text-secondary">{prompt.content}</p>

                  {prompt.tags && prompt.tags.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {prompt.tags.map((tag) => (
                        <span key={tag} className="rounded-md bg-input px-1.5 py-0.5 text-[11px] text-text-tertiary">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Empurra as ações pro rodapé: cartões da mesma linha alinham embaixo. */}
                  <div className="flex-1" />
                  <div className="mt-3 flex items-center justify-end gap-0.5 border-t border-border pt-2.5">
                    <IconButton onClick={() => handleDuplicate(prompt)} label="Duplicar">
                      <Copy size={13} />
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        setEditingPrompt(prompt);
                        setFormOpen(true);
                      }}
                      label="Editar"
                    >
                      <Pencil size={13} />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(prompt)} label="Excluir" danger>
                      <Trash2 size={13} />
                    </IconButton>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </AbasDePastas>
      )}

      <PromptForm
        open={formOpen}
        prompt={editingPrompt}
        categories={categories}
        currentUserId={currentUserId}
        defaultCategoryId={newPromptCategoryId}
        onClose={() => {
          setFormOpen(false);
          setEditingPrompt(null);
        }}
        onSaved={handleSaved}
      />
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
      className={`flex h-7 w-7 items-center justify-center rounded-lg hover:bg-card-hover ${
        danger ? "text-text-tertiary hover:text-danger" : "text-text-tertiary hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}
