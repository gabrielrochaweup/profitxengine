"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Trash2, Pencil, Check, X, Plus, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, FolderOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ImagePreviewModal } from "@/components/image-preview-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import type { Database, ImageContextType } from "@/lib/supabase/types";

type GeneratedImage = Database["public"]["Tables"]["generated_images"]["Row"];
type ImageFolder = Database["public"]["Tables"]["image_folders"]["Row"];

const ORIGIN_LABEL: Record<ImageContextType, string> = {
  dinamica_slot: "Dinâmicas do Dia",
  livre_engagement: "Gerador Livre",
  x1_message: "Mensagens X1",
  email: "E-mails",
  criativo: "Gerador de Criativos",
  carrossel: "Carrossel (Gerador de Criativos)",
};

const QUALITY_LABEL: Record<string, string> = { low: "Baixa", medium: "Média", high: "Alta" };

// Bucket fixo (não é uma linha de image_folders) pra imagens que ainda não
// foram organizadas — sempre a primeira coluna, sem controles de
// renomear/excluir/reordenar, mas é destino válido de arrastar-soltar.
const UNFILED_ID = "unfiled";

interface BibliotecaImagensClientProps {
  initialImages: GeneratedImage[];
  initialFolders: ImageFolder[];
  currentUserId: string;
  isAdmin: boolean;
}

export function BibliotecaImagensClient({
  initialImages,
  initialFolders,
  currentUserId,
  isAdmin,
}: BibliotecaImagensClientProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const [images, setImages] = useState(initialImages);
  const [folders, setFolders] = useState(initialFolders);
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [draggingImageId, setDraggingImageId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [mobileFolderId, setMobileFolderId] = useState<string>(UNFILED_ID);
  const [expandedSubfolders, setExpandedSubfolders] = useState<Record<string, string | null>>({});
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingFolder) newFolderInputRef.current?.focus();
  }, [addingFolder]);

  const byFolder = useMemo(() => {
    const map: Record<string, GeneratedImage[]> = { [UNFILED_ID]: [] };
    folders.forEach((f) => {
      map[f.id] = [];
    });
    images.forEach((img) => {
      const key = img.folder_id && map[img.folder_id] ? img.folder_id : UNFILED_ID;
      map[key].push(img);
    });
    return map;
  }, [images, folders]);

  // Só pastas de topo viram colunas — pastas com dono (parent_id) são
  // subpastas por horário, criadas automaticamente pela geração de imagem
  // dentro de uma Dinâmica do Dia (nome da dinâmica > horário do slot).
  const topFolders = useMemo(
    () => folders.filter((f) => !f.parent_id).sort((a, b) => a.position - b.position),
    [folders]
  );
  const childrenByParent = useMemo(() => {
    const map: Record<string, ImageFolder[]> = {};
    folders.forEach((f) => {
      if (f.parent_id) (map[f.parent_id] ??= []).push(f);
    });
    Object.values(map).forEach((list) => list.sort((a, b) => a.position - b.position));
    return map;
  }, [folders]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase.from("generated_images").delete().eq("id", id);
    if (!error) setImages((prev) => prev.filter((img) => img.id !== id));
    setDeletingId(null);
  }

  async function handleDropOnFolder(folderId: string) {
    setDragOverFolderId(null);
    const imageId = draggingImageId;
    setDraggingImageId(null);
    if (!imageId || !isAdmin) return;

    const nextFolderId = folderId === UNFILED_ID ? null : folderId;
    const image = images.find((img) => img.id === imageId);
    if (!image || image.folder_id === nextFolderId) return;

    const previousFolderId = image.folder_id;
    setImages((prev) => prev.map((img) => (img.id === imageId ? { ...img, folder_id: nextFolderId } : img)));

    const supabase = createClient();
    const { error } = await supabase.from("generated_images").update({ folder_id: nextFolderId }).eq("id", imageId);
    if (error) {
      setImages((prev) => prev.map((img) => (img.id === imageId ? { ...img, folder_id: previousFolderId } : img)));
      toast.error("Erro ao mover a imagem. Tente novamente.");
    }
  }

  async function handleAddFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("image_folders")
      .insert({ name, position: folders.length, created_by: currentUserId })
      .select()
      .single();
    if (error || !data) {
      toast.error("Erro ao criar a pasta. Tente novamente.");
      return;
    }
    setFolders((prev) => [...prev, data]);
    setNewFolderName("");
    setAddingFolder(false);
  }

  function startRename(folder: ImageFolder) {
    setRenamingId(folder.id);
    setRenameValue(folder.name);
  }

  async function commitRename(folder: ImageFolder) {
    const name = renameValue.trim();
    setRenamingId(null);
    if (!name || name === folder.name) return;
    setFolders((prev) => prev.map((f) => (f.id === folder.id ? { ...f, name } : f)));
    const supabase = createClient();
    const { error } = await supabase.from("image_folders").update({ name }).eq("id", folder.id);
    if (error) {
      setFolders((prev) => prev.map((f) => (f.id === folder.id ? { ...f, name: folder.name } : f)));
      toast.error("Erro ao renomear a pasta. Tente novamente.");
    }
  }

  async function moveFolder(folder: ImageFolder, direction: -1 | 1) {
    const siblings = folders.filter((f) => f.parent_id === folder.parent_id).sort((a, b) => a.position - b.position);
    const index = siblings.findIndex((f) => f.id === folder.id);
    const target = index + direction;
    if (target < 0 || target >= siblings.length) return;
    const next = [...siblings];
    [next[index], next[target]] = [next[target], next[index]];
    const withPositions = next.map((f, i) => ({ ...f, position: i }));
    setFolders((prev) => prev.map((f) => withPositions.find((w) => w.id === f.id) ?? f));
    const supabase = createClient();
    const results = await Promise.all(
      withPositions.map((f) => supabase.from("image_folders").update({ position: f.position }).eq("id", f.id))
    );
    if (results.some((r) => r.error)) toast.error("Erro ao reordenar as pastas. Tente novamente.");
  }

  async function handleDeleteFolder(folder: ImageFolder) {
    const ok = await confirm({
      title: "Excluir pasta",
      description: `Excluir a pasta "${folder.name}"? Subpastas dentro dela também são excluídas — as imagens (dela e das subpastas) voltam pra "Sem pasta", nenhuma imagem é apagada.`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const supabase = createClient();
    const { error } = await supabase.from("image_folders").delete().eq("id", folder.id);
    if (error) {
      toast.error("Erro ao excluir a pasta. Tente novamente.");
      return;
    }
    // O banco já derruba as subpastas em cascata e solta o folder_id das
    // imagens (on delete cascade / set null) — replica isso no estado local.
    const removedIds = new Set([folder.id, ...folders.filter((f) => f.parent_id === folder.id).map((f) => f.id)]);
    setFolders((prev) => prev.filter((f) => !removedIds.has(f.id)));
    setImages((prev) => prev.map((img) => (img.folder_id && removedIds.has(img.folder_id) ? { ...img, folder_id: null } : img)));
    if (mobileFolderId && removedIds.has(mobileFolderId)) setMobileFolderId(UNFILED_ID);
  }

  function renderImageGrid(dropId: string, items: GeneratedImage[]) {
    if (items.length === 0) {
      return (
        <p className="rounded-input border border-dashed border-border-strong px-3 py-8 text-center text-[11px] text-text-muted">
          {dragOverFolderId === dropId ? "Solte aqui" : "Vazia."}
        </p>
      );
    }
    return (
      <div className="grid grid-cols-3 gap-1.5">
        {items.map((img) => {
          const canDelete = isAdmin || img.created_by === currentUserId;
          return (
            <button
              key={img.id}
              type="button"
              draggable={isAdmin}
              onDragStart={(e) => {
                setDraggingImageId(img.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={() => {
                setDraggingImageId(null);
                setDragOverFolderId(null);
              }}
              onClick={() => setPreviewImage(img)}
              className={cn(
                "group relative overflow-hidden rounded-lg border border-border text-left transition-opacity",
                isAdmin ? "cursor-grab active:cursor-grabbing" : "",
                draggingImageId === img.id ? "opacity-40" : ""
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.image_url} alt={img.prompt} className="aspect-square w-full object-cover" />
              <div className="absolute inset-0 flex flex-col justify-between bg-black/70 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="line-clamp-3 text-[9px] text-white/90">{img.prompt}</p>
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate rounded-button bg-white/10 px-1 py-0.5 text-[8px] text-white/70">
                    {ORIGIN_LABEL[img.context_type]} · {QUALITY_LABEL[img.quality] ?? img.quality}
                  </span>
                  {canDelete && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(img.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                          handleDelete(img.id);
                        }
                      }}
                      aria-disabled={deletingId === img.id}
                      title="Excluir"
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-danger aria-disabled:opacity-50"
                    >
                      <Trash2 size={10} />
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  function renderColumn(id: string, name: string, folder: ImageFolder | null, strong?: boolean) {
    const items = byFolder[id] ?? [];
    const children = childrenByParent[id] ?? [];
    const hasChildren = children.length > 0;
    return (
      <div
        key={id}
        onDragOver={(e) => {
          if (hasChildren || !draggingImageId) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (dragOverFolderId !== id) setDragOverFolderId(id);
        }}
        onDragLeave={(e) => {
          if (hasChildren) return;
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setDragOverFolderId((prev) => (prev === id ? null : prev));
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (hasChildren) return;
          handleDropOnFolder(id);
        }}
        className={cn(
          "flex w-full min-h-0 shrink-0 flex-col overflow-hidden rounded-card border p-3 transition-colors sm:w-80",
          dragOverFolderId === id
            ? "border-accent bg-accent/5"
            : strong
              ? "border-border-strong bg-card-hover"
              : "border-border bg-card"
        )}
      >
        <div className="mb-3 flex items-center justify-between gap-1">
          {renamingId === id ? (
            <div className="flex flex-1 items-center gap-1">
              <Input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename(folder as ImageFolder);
                  if (e.key === "Escape") setRenamingId(null);
                }}
                className="h-7 text-xs"
              />
              <IconButton onClick={() => commitRename(folder as ImageFolder)} label="Confirmar">
                <Check size={13} />
              </IconButton>
              <IconButton onClick={() => setRenamingId(null)} label="Cancelar">
                <X size={13} />
              </IconButton>
            </div>
          ) : (
            <h2 className="flex min-w-0 items-center gap-2 text-sm font-medium text-text-primary">
              {id === UNFILED_ID && <FolderOpen size={14} className="shrink-0 text-text-muted" />}
              <span className="truncate">{name}</span>
              <span className="shrink-0 rounded-button bg-accent/15 px-1.5 py-0.5 text-[11px] font-medium text-accent">
                {hasChildren ? children.length : items.length}
              </span>
            </h2>
          )}

          {renamingId !== id && isAdmin && folder && (
            <div className="flex shrink-0 items-center gap-0.5">
              <IconButton onClick={() => moveFolder(folder, -1)} label="Mover pra esquerda">
                <ChevronLeft size={13} />
              </IconButton>
              <IconButton onClick={() => moveFolder(folder, 1)} label="Mover pra direita">
                <ChevronRight size={13} />
              </IconButton>
              <IconButton onClick={() => startRename(folder)} label="Renomear pasta">
                <Pencil size={13} />
              </IconButton>
              <IconButton onClick={() => handleDeleteFolder(folder)} label="Excluir pasta" danger>
                <Trash2 size={13} />
              </IconButton>
            </div>
          )}
        </div>

        <div className="max-h-[calc(100vh-320px)] overflow-y-auto pr-0.5">
          {hasChildren ? (
            <div className="flex flex-col gap-1.5">
              {children.map((child) => {
                const isOpen = expandedSubfolders[id] === child.id;
                const childItems = byFolder[child.id] ?? [];
                return (
                  <div key={child.id} className="rounded-lg border border-border">
                    <div
                      onDragOver={(e) => {
                        if (!draggingImageId) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (dragOverFolderId !== child.id) setDragOverFolderId(child.id);
                      }}
                      onDragLeave={(e) => {
                        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                        setDragOverFolderId((prev) => (prev === child.id ? null : prev));
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDropOnFolder(child.id);
                      }}
                      className={cn(
                        "flex items-center justify-between gap-1 rounded-lg px-2 py-1.5 transition-colors",
                        dragOverFolderId === child.id ? "bg-accent/10" : "hover:bg-card-hover"
                      )}
                    >
                      {renamingId === child.id ? (
                        <div className="flex flex-1 items-center gap-1">
                          <Input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitRename(child);
                              if (e.key === "Escape") setRenamingId(null);
                            }}
                            className="h-7 text-xs"
                          />
                          <IconButton onClick={() => commitRename(child)} label="Confirmar">
                            <Check size={13} />
                          </IconButton>
                          <IconButton onClick={() => setRenamingId(null)} label="Cancelar">
                            <X size={13} />
                          </IconButton>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedSubfolders((prev) => ({ ...prev, [id]: isOpen ? null : child.id }))
                          }
                          className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-xs font-medium text-text-primary"
                        >
                          <ChevronRight
                            size={13}
                            className={cn("shrink-0 text-text-muted transition-transform", isOpen && "rotate-90")}
                          />
                          <span className="truncate">{child.name}</span>
                          <span className="shrink-0 rounded-button bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                            {childItems.length}
                          </span>
                        </button>
                      )}

                      {renamingId !== child.id && isAdmin && (
                        <div className="flex shrink-0 items-center gap-0.5">
                          <IconButton onClick={() => moveFolder(child, -1)} label="Mover pra cima">
                            <ChevronUp size={13} />
                          </IconButton>
                          <IconButton onClick={() => moveFolder(child, 1)} label="Mover pra baixo">
                            <ChevronDown size={13} />
                          </IconButton>
                          <IconButton onClick={() => startRename(child)} label="Renomear subpasta">
                            <Pencil size={13} />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteFolder(child)} label="Excluir subpasta" danger>
                            <Trash2 size={13} />
                          </IconButton>
                        </div>
                      )}
                    </div>
                    {isOpen && <div className="border-t border-border p-2">{renderImageGrid(child.id, childItems)}</div>}
                  </div>
                );
              })}
            </div>
          ) : (
            renderImageGrid(id, items)
          )}
        </div>
      </div>
    );
  }

  const mobileColumns = [{ id: UNFILED_ID, name: "Sem pasta" }, ...topFolders.map((f) => ({ id: f.id, name: f.name }))];
  const mobileFolder = mobileColumns.find((c) => c.id === mobileFolderId) ?? mobileColumns[0];

  return (
    <div className="mt-4">
      {isAdmin && (
        <div className="mb-3 flex justify-end">
          {addingFolder ? (
            <div className="flex items-center gap-1">
              <Input
                ref={newFolderInputRef}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddFolder();
                  if (e.key === "Escape") setAddingFolder(false);
                }}
                placeholder="Nome da pasta (ex: PEPE)"
                className="h-9 w-44 text-sm"
              />
              <Button type="button" size="sm" onClick={handleAddFolder}>
                Criar
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setAddingFolder(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button type="button" variant="secondary" size="sm" onClick={() => setAddingFolder(true)}>
              <Plus size={14} />
              Nova pasta
            </Button>
          )}
        </div>
      )}

      {/* Mobile: uma pasta por vez, escolhida num dropdown */}
      <div className="sm:hidden">
        <Select value={mobileFolderId} onChange={(e) => setMobileFolderId(e.target.value)}>
          {mobileColumns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({(byFolder[c.id] ?? []).length})
            </option>
          ))}
        </Select>
        {mobileFolder && (
          <div className="mt-3">
            {renderColumn(
              mobileFolder.id,
              mobileFolder.name,
              mobileFolder.id === UNFILED_ID ? null : (topFolders.find((f) => f.id === mobileFolder.id) ?? null),
              true
            )}
          </div>
        )}
      </div>

      {/* Desktop/tablet: pastas lado a lado, rolando na horizontal */}
      <div className="hidden gap-4 overflow-x-auto pb-2 sm:flex">
        {renderColumn(UNFILED_ID, "Sem pasta", null)}
        {topFolders.map((folder) => renderColumn(folder.id, folder.name, folder))}
      </div>

      <ImagePreviewModal image={previewImage} onClose={() => setPreviewImage(null)} />
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
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-lg hover:bg-card-hover",
        danger ? "text-text-muted hover:text-danger" : "text-text-muted hover:text-text-primary"
      )}
    >
      {children}
    </button>
  );
}
