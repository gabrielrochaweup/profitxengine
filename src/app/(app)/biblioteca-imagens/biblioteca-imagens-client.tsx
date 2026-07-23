"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Trash2, Pencil, Check, X, Plus, ChevronLeft, ChevronRight, FolderOpen } from "lucide-react";
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

  async function moveFolder(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= folders.length) return;
    const next = [...folders];
    [next[index], next[target]] = [next[target], next[index]];
    const withPositions = next.map((f, i) => ({ ...f, position: i }));
    setFolders(withPositions);
    const supabase = createClient();
    const results = await Promise.all(
      withPositions.map((f) => supabase.from("image_folders").update({ position: f.position }).eq("id", f.id))
    );
    if (results.some((r) => r.error)) toast.error("Erro ao reordenar as pastas. Tente novamente.");
  }

  async function handleDeleteFolder(folder: ImageFolder) {
    const ok = await confirm({
      title: "Excluir pasta",
      description: `Excluir a pasta "${folder.name}"? As imagens dela voltam pra "Sem pasta" — nenhuma imagem é apagada.`,
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
    setFolders((prev) => prev.filter((f) => f.id !== folder.id));
    setImages((prev) => prev.map((img) => (img.folder_id === folder.id ? { ...img, folder_id: null } : img)));
    if (mobileFolderId === folder.id) setMobileFolderId(UNFILED_ID);
  }

  function renderColumn(id: string, name: string, index: number | null, strong?: boolean) {
    const items = byFolder[id] ?? [];
    const folder = index !== null ? folders[index] : null;
    return (
      <div
        key={id}
        onDragOver={(e) => {
          if (!draggingImageId) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (dragOverFolderId !== id) setDragOverFolderId(id);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setDragOverFolderId((prev) => (prev === id ? null : prev));
        }}
        onDrop={(e) => {
          e.preventDefault();
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
                {items.length}
              </span>
            </h2>
          )}

          {renamingId !== id && isAdmin && folder && (
            <div className="flex shrink-0 items-center gap-0.5">
              <IconButton onClick={() => moveFolder(index as number, -1)} label="Mover pra esquerda">
                <ChevronLeft size={13} />
              </IconButton>
              <IconButton onClick={() => moveFolder(index as number, 1)} label="Mover pra direita">
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

        <div className="grid max-h-[calc(100vh-320px)] grid-cols-3 gap-1.5 overflow-y-auto pr-0.5">
          {items.length === 0 ? (
            <p className="col-span-3 rounded-input border border-dashed border-border-strong px-3 py-8 text-center text-[11px] text-text-muted">
              {dragOverFolderId === id ? "Solte aqui" : "Vazia."}
            </p>
          ) : (
            items.map((img) => {
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
            })
          )}
        </div>
      </div>
    );
  }

  const mobileColumns = [{ id: UNFILED_ID, name: "Sem pasta" }, ...folders.map((f) => ({ id: f.id, name: f.name }))];
  const mobileIndex = folders.findIndex((f) => f.id === mobileFolderId);
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
              mobileFolder.id === UNFILED_ID ? null : mobileIndex,
              true
            )}
          </div>
        )}
      </div>

      {/* Desktop/tablet: pastas lado a lado, rolando na horizontal */}
      <div className="hidden gap-4 overflow-x-auto pb-2 sm:flex">
        {renderColumn(UNFILED_ID, "Sem pasta", null)}
        {folders.map((folder, index) => renderColumn(folder.id, folder.name, index))}
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
