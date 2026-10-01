"use client";

import { useMemo, useState } from "react";
import { Trash2, Pencil, Check, X, ArrowLeft, ArrowRight, Inbox, GripVertical, ImageOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ImagePreviewModal } from "@/components/image-preview-modal";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { AbasDePastas, usePastaNaUrl } from "@/components/ui/abas-de-pastas";
import { useActiveProduct } from "@/components/layout/active-product-context";
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

// Aba fixa (não é uma linha de image_folders) pras imagens que ainda não
// foram organizadas — sempre a primeira, sem renomear/mover/excluir, mas é
// destino válido de arrastar-soltar.
const UNFILED_ID = "unfiled";

interface BibliotecaImagensClientProps {
  initialImages: GeneratedImage[];
  initialFolders: ImageFolder[];
  currentUserId: string;
}

/*
  Biblioteca de imagens em PASTAS (abas). Uma pasta aberta por vez, com as
  imagens dela numa grade que usa a largura toda. Pastas com subpastas (as
  que a geração dentro de uma Dinâmica do Dia cria sozinha: dinâmica >
  horário) mostram as subpastas como pílulas logo abaixo do título.
  Arraste uma imagem até uma aba ou pílula pra mover ela pra lá.
*/
export function BibliotecaImagensClient({ initialImages, initialFolders, currentUserId }: BibliotecaImagensClientProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const { activeProductId } = useActiveProduct();
  const [images, setImages] = useState(initialImages);
  const [folders, setFolders] = useState(initialFolders);
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [draggingImageId, setDraggingImageId] = useState<string | null>(null);
  const [dragOverSubId, setDragOverSubId] = useState<string | null>(null);
  const [ativaDaUrl, setAtiva] = usePastaNaUrl(UNFILED_ID);
  const [subAberta, setSubAberta] = useState<Record<string, string>>({});
  const [renomeandoSub, setRenomeandoSub] = useState<string | null>(null);
  const [nomeSub, setNomeSub] = useState("");

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

  // Só pastas de topo viram abas — pastas com dono (parent_id) são
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

  const ativa =
    ativaDaUrl === UNFILED_ID || topFolders.some((f) => f.id === ativaDaUrl) ? ativaDaUrl : UNFILED_ID;

  /** Total da aba: as imagens da pasta mais as das subpastas dela. */
  function totalDaPasta(id: string): number {
    const filhos = childrenByParent[id] ?? [];
    return (byFolder[id]?.length ?? 0) + filhos.reduce((t, f) => t + (byFolder[f.id]?.length ?? 0), 0);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase.from("generated_images").delete().eq("id", id);
    if (!error) setImages((prev) => prev.filter((img) => img.id !== id));
    else toast.error("Erro ao excluir a imagem. Tente novamente.");
    setDeletingId(null);
  }

  async function handleDropOnFolder(folderId: string) {
    setDragOverSubId(null);
    const imageId = draggingImageId;
    setDraggingImageId(null);
    if (!imageId) return;

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

  async function handleAddFolder(name: string): Promise<boolean> {
    if (!activeProductId) return false;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("image_folders")
      .insert({ product_id: activeProductId, name, position: folders.length, created_by: currentUserId })
      .select()
      .single();
    if (error || !data) {
      toast.error("Erro ao criar a pasta. Tente novamente.");
      return false;
    }
    setFolders((prev) => [...prev, data]);
    setAtiva(data.id);
    return true;
  }

  async function renameFolder(id: string, name: string) {
    const folder = folders.find((f) => f.id === id);
    if (!folder) return;
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
    const supabase = createClient();
    const { error } = await supabase.from("image_folders").update({ name }).eq("id", id);
    if (error) {
      setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name: folder.name } : f)));
      toast.error("Erro ao renomear a pasta. Tente novamente.");
    }
  }

  async function moveFolder(id: string, direction: -1 | 1) {
    const folder = folders.find((f) => f.id === id);
    if (!folder) return;
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

  async function deleteFolder(id: string) {
    const folder = folders.find((f) => f.id === id);
    if (!folder) return;
    const ok = await confirm({
      title: folder.parent_id ? "Excluir subpasta" : "Excluir pasta",
      description: `Excluir "${folder.name}"? Subpastas dentro dela também são excluídas — as imagens voltam pra "Sem pasta", nenhuma imagem é apagada.`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const supabase = createClient();
    const { error } = await supabase.from("image_folders").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir a pasta. Tente novamente.");
      return;
    }
    // O banco já derruba as subpastas em cascata e solta o folder_id das
    // imagens (on delete cascade / set null) — replica isso no estado local.
    const removedIds = new Set([id, ...folders.filter((f) => f.parent_id === id).map((f) => f.id)]);
    setFolders((prev) => prev.filter((f) => !removedIds.has(f.id)));
    setImages((prev) => prev.map((img) => (img.folder_id && removedIds.has(img.folder_id) ? { ...img, folder_id: null } : img)));
  }

  function grade(dropId: string, items: GeneratedImage[]) {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border-strong px-4 py-10 text-center">
          <ImageOff size={18} className="text-text-muted" />
          <p className="text-[13px] text-text-secondary">
            {draggingImageId ? "Solte a imagem numa aba ou pílula pra mover." : "Nenhuma imagem aqui ainda."}
          </p>
          {dropId === UNFILED_ID && !draggingImageId && (
            <p className="max-w-[48ch] text-[12px] text-text-muted">
              Imagem gerada em qualquer módulo cai aqui. Depois é só arrastar até a aba da pasta certa.
            </p>
          )}
        </div>
      );
    }
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8">
        {items.map((img) => (
          <button
            key={img.id}
            type="button"
            draggable
            onDragStart={(e) => {
              setDraggingImageId(img.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragEnd={() => {
              setDraggingImageId(null);
              setDragOverSubId(null);
            }}
            onClick={() => setPreviewImage(img)}
            className={cn(
              "group relative cursor-grab overflow-hidden rounded-xl border border-border bg-card text-left transition-opacity active:cursor-grabbing",
              draggingImageId === img.id ? "opacity-40" : ""
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.image_url} alt={img.prompt} className="aspect-square w-full object-cover" />
            <span className="absolute left-1.5 top-1.5 rounded-md bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <GripVertical size={12} />
            </span>
            <div className="absolute inset-0 flex flex-col justify-between bg-black/70 p-2 opacity-0 transition-opacity group-hover:opacity-100">
              <p className="line-clamp-3 pl-5 text-[10px] text-white/90">{img.prompt}</p>
              <div className="flex items-center justify-between gap-1">
                <span className="truncate rounded-md bg-white/10 px-1.5 py-0.5 text-[9px] text-white/80">
                  {ORIGIN_LABEL[img.context_type]} · {QUALITY_LABEL[img.quality] ?? img.quality}
                </span>
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
                  title="Excluir imagem"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-danger aria-disabled:opacity-50"
                >
                  <Trash2 size={11} />
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  }

  // ── conteúdo da pasta aberta ──
  const filhos = ativa === UNFILED_ID ? [] : (childrenByParent[ativa] ?? []);
  const soltas = byFolder[ativa] ?? [];
  // Com subpastas, a primeira pílula é "Nesta pasta" (as imagens soltas
  // direto nela) só quando existe alguma — senão abre na primeira subpasta.
  const opcoesSub = [
    ...(soltas.length > 0 ? [{ id: ativa, nome: "Nesta pasta", total: soltas.length, ehRaiz: true }] : []),
    ...filhos.map((f) => ({ id: f.id, nome: f.name, total: byFolder[f.id]?.length ?? 0, ehRaiz: false })),
  ];
  const subEscolhida = subAberta[ativa];
  const subAtual =
    filhos.length > 0 ? (opcoesSub.find((o) => o.id === subEscolhida) ?? opcoesSub[0] ?? null) : null;
  const pastaDaSub = subAtual && !subAtual.ehRaiz ? folders.find((f) => f.id === subAtual.id) : null;
  const posSub = pastaDaSub ? filhos.findIndex((f) => f.id === pastaDaSub.id) : -1;

  function confirmarRenomeSub() {
    const nome = nomeSub.trim();
    if (pastaDaSub && nome && nome !== pastaDaSub.name) renameFolder(pastaDaSub.id, nome);
    setRenomeandoSub(null);
  }

  return (
    <div>
      <AbasDePastas
        abas={[
          { id: UNFILED_ID, nome: "Sem pasta", total: byFolder[UNFILED_ID]?.length ?? 0, fixa: true, icone: Inbox },
          ...topFolders.map((f) => ({ id: f.id, nome: f.name, total: totalDaPasta(f.id) })),
        ]}
        ativa={ativa}
        onTrocar={setAtiva}
        onCriar={handleAddFolder}
        onRenomear={renameFolder}
        onMover={moveFolder}
        onExcluir={deleteFolder}
        arrastando={draggingImageId !== null}
        onSoltar={(id) => {
          // Soltar numa aba com subpastas guarda a imagem na própria pasta
          // (aparece em "Nesta pasta") — dá pra mover pra uma subpasta depois.
          handleDropOnFolder(id);
        }}
        placeholderNova="Nome da pasta (ex: PEPE)"
      >
        {filhos.length > 0 && subAtual && (
          <div className="mb-4 space-y-2.5">
            <div role="tablist" aria-label="Subpastas" className="flex flex-wrap gap-1.5">
              {opcoesSub.map((o) => {
                const ehAtual = o.id === subAtual.id;
                const soltandoAqui = draggingImageId !== null && dragOverSubId === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="tab"
                    aria-selected={ehAtual}
                    onClick={() => setSubAberta((prev) => ({ ...prev, [ativa]: o.id }))}
                    onDragOver={(e) => {
                      if (!draggingImageId) return;
                      e.preventDefault();
                      if (dragOverSubId !== o.id) setDragOverSubId(o.id);
                    }}
                    onDragLeave={() => setDragOverSubId((prev) => (prev === o.id ? null : prev))}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDropOnFolder(o.id);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] font-medium transition-colors",
                      soltandoAqui
                        ? "border-accent bg-accent-soft text-text-primary"
                        : ehAtual
                          ? "border-border-strong bg-card text-text-primary"
                          : "border-border text-text-tertiary hover:bg-card hover:text-text-secondary"
                    )}
                  >
                    {o.nome}
                    <span className="rounded bg-input px-1 text-[10px] tabular-nums text-text-tertiary">{o.total}</span>
                  </button>
                );
              })}
            </div>

            {pastaDaSub && (
              <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-text-tertiary">
                <span>Subpasta:</span>
                {renomeandoSub === pastaDaSub.id ? (
                  <span className="flex items-center gap-1">
                    <input
                      autoFocus
                      value={nomeSub}
                      onChange={(e) => setNomeSub(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmarRenomeSub();
                        if (e.key === "Escape") setRenomeandoSub(null);
                      }}
                      className="h-7 w-44 rounded-input bg-input px-2 text-[12px] text-text-primary outline-none focus:shadow-[0_0_0_2px_var(--accent)]"
                    />
                    <MiniBotao rotulo="Salvar nome" onClick={confirmarRenomeSub}>
                      <Check size={13} />
                    </MiniBotao>
                    <MiniBotao rotulo="Cancelar" onClick={() => setRenomeandoSub(null)}>
                      <X size={13} />
                    </MiniBotao>
                  </span>
                ) : (
                  <>
                    <span className="font-medium text-text-secondary">{pastaDaSub.name}</span>
                    <MiniBotao
                      rotulo="Renomear subpasta"
                      onClick={() => {
                        setNomeSub(pastaDaSub.name);
                        setRenomeandoSub(pastaDaSub.id);
                      }}
                    >
                      <Pencil size={12} />
                    </MiniBotao>
                    <MiniBotao rotulo="Mover subpasta para a esquerda" onClick={() => moveFolder(pastaDaSub.id, -1)} disabled={posSub <= 0}>
                      <ArrowLeft size={12} />
                    </MiniBotao>
                    <MiniBotao
                      rotulo="Mover subpasta para a direita"
                      onClick={() => moveFolder(pastaDaSub.id, 1)}
                      disabled={posSub >= filhos.length - 1}
                    >
                      <ArrowRight size={12} />
                    </MiniBotao>
                    <MiniBotao rotulo="Excluir subpasta" onClick={() => deleteFolder(pastaDaSub.id)} perigo>
                      <Trash2 size={12} />
                    </MiniBotao>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {filhos.length > 0 && subAtual ? grade(subAtual.id, byFolder[subAtual.id] ?? []) : grade(ativa, soltas)}
      </AbasDePastas>

      <ImagePreviewModal image={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}

function MiniBotao({
  rotulo,
  onClick,
  disabled,
  perigo,
  children,
}: {
  rotulo: string;
  onClick: () => void;
  disabled?: boolean;
  perigo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={rotulo}
      aria-label={rotulo}
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-card-hover disabled:pointer-events-none disabled:opacity-35",
        perigo ? "text-text-tertiary hover:text-danger" : "text-text-tertiary hover:text-text-primary"
      )}
    >
      {children}
    </button>
  );
}
