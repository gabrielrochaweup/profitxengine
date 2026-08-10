"use client";

import { useRef, useState } from "react";
import { Upload, Dices } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { pickAvatar } from "@/lib/avatar-library";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import type { PostAccent, PostDisplayStyle, PostTemplate } from "@/lib/supabase/types";

export interface PostEditorPatch {
  authorName: string;
  authorHandle: string;
  authorAvatarUrl: string | null;
  verified: boolean;
  displayStyle: PostDisplayStyle;
  body: string;
  subtitle: string;
  linkCardImageUrl: string | null;
  linkCardTitle: string;
  linkCardDescription: string;
  profitxBadgeText: string;
  profitxHeadline1: string;
  profitxHeadline2: string;
  profitxStatLabel: string;
  profitxStatValue: string;
  profitxStatCaption: string;
  profitxFooterLine1: string;
  profitxFooterLine2: string;
  profitxAccent: PostAccent;
}

interface PostEditorProps extends PostEditorPatch {
  template: PostTemplate;
  onChange: (patch: Partial<PostEditorPatch>) => void;
}

export function PostEditor({
  template,
  authorName,
  authorHandle,
  authorAvatarUrl,
  verified,
  displayStyle,
  body,
  subtitle,
  linkCardImageUrl,
  linkCardTitle,
  linkCardDescription,
  profitxBadgeText,
  profitxHeadline1,
  profitxHeadline2,
  profitxStatLabel,
  profitxStatValue,
  profitxStatCaption,
  profitxFooterLine1,
  profitxFooterLine2,
  profitxAccent,
  onChange,
}: PostEditorProps) {
  const toast = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const linkImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLinkImage, setUploadingLinkImage] = useState(false);
  const [drawingAvatar, setDrawingAvatar] = useState(false);

  async function uploadImage(file: File, onDone: (url: string) => void, setBusy: (v: boolean) => void) {
    setBusy(true);
    const supabase = createClient();
    const path = `${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from("conversation-avatars").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("conversation-avatars").getPublicUrl(path);
      onDone(data.publicUrl);
    } else {
      toast.error("Erro ao enviar a imagem. Tente novamente.");
    }
    setBusy(false);
  }

  async function handleDrawAvatar() {
    setDrawingAvatar(true);
    const url = await pickAvatar();
    if (url) {
      onChange({ authorAvatarUrl: url });
    } else {
      toast.error("Nenhuma foto cadastrada no banco de avatares ainda.");
    }
    setDrawingAvatar(false);
  }

  if (template === "profitx") {
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Badge (topo)</label>
          <Input
            value={profitxBadgeText}
            onChange={(e) => onChange({ profitxBadgeText: e.target.value })}
            placeholder="Ex: Profissionais lucrando por você no automático"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Título — linha 1 (branca)</label>
            <Input
              value={profitxHeadline1}
              onChange={(e) => onChange({ profitxHeadline1: e.target.value })}
              placeholder="Ex: Nós Operamos."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Título — linha 2 (cor de destaque)</label>
            <Input
              value={profitxHeadline2}
              onChange={(e) => onChange({ profitxHeadline2: e.target.value })}
              placeholder="Ex: Você Lucra."
            />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-dashed border-border-strong p-3">
          <p className="text-xs font-medium text-text-secondary">Card de estatística</p>
          <Input
            value={profitxStatLabel}
            onChange={(e) => onChange({ profitxStatLabel: e.target.value })}
            placeholder="Rótulo — ex: TAXA DE ACERTO GERAL DO MÉTODO"
            className="text-xs"
          />
          <Input
            value={profitxStatValue}
            onChange={(e) => onChange({ profitxStatValue: e.target.value })}
            placeholder="Número grande — ex: 92%"
            className="text-xs"
          />
          <Input
            value={profitxStatCaption}
            onChange={(e) => onChange({ profitxStatCaption: e.target.value })}
            placeholder="Legenda — ex: 2.132 operações verificadas"
            className="text-xs"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Rodapé — linha 1</label>
            <Input
              value={profitxFooterLine1}
              onChange={(e) => onChange({ profitxFooterLine1: e.target.value })}
              placeholder="Ex: Resultado real combinado de Lives + IA + Copy Trader."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Rodapé — linha 2</label>
            <Input
              value={profitxFooterLine2}
              onChange={(e) => onChange({ profitxFooterLine2: e.target.value })}
              placeholder="Ex: Dados auditáveis. Atualizado diariamente."
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Cor de destaque</label>
          <Select
            value={profitxAccent}
            onChange={(e) => onChange({ profitxAccent: e.target.value as PostAccent })}
          >
            <option value="dourado">Dourado</option>
            <option value="azul">Azul</option>
            <option value="verde">Verde</option>
          </Select>
        </div>

        <p className="text-[11px] text-text-muted">
          A logo da PROFITX aparece automaticamente no rodapé — não é editável, fica sempre no mesmo lugar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Nome do autor</label>
          <Input
            value={authorName}
            onChange={(e) => onChange({ authorName: e.target.value })}
            placeholder="Ex: Robson Guerreiro"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">@handle</label>
          <Input
            value={authorHandle}
            onChange={(e) => onChange({ authorHandle: e.target.value })}
            placeholder="Ex: @robsonprofitx"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">Foto de perfil</label>
        <div className="flex items-center gap-2">
          <Input
            value={authorAvatarUrl ?? ""}
            onChange={(e) => onChange({ authorAvatarUrl: e.target.value || null })}
            placeholder="URL da imagem (ou envie um arquivo)"
          />
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadImage(file, (url) => onChange({ authorAvatarUrl: url }), setUploadingAvatar);
            }}
          />
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            title="Enviar arquivo"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input border border-border-strong text-text-secondary hover:bg-card-hover disabled:opacity-50"
          >
            <Upload size={16} />
          </button>
          <button
            type="button"
            onClick={handleDrawAvatar}
            disabled={drawingAvatar}
            title="Sortear avatar do banco de fotos"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input border border-border-strong text-text-secondary hover:bg-card-hover disabled:opacity-50"
          >
            <Dices size={16} />
          </button>
        </div>
        {uploadingAvatar && <p className="text-xs text-text-muted">Enviando...</p>}
        {drawingAvatar && <p className="text-xs text-text-muted">Sorteando...</p>}
      </div>

      <label className="flex items-center gap-1.5 text-xs text-text-secondary">
        <input type="checkbox" checked={verified} onChange={(e) => onChange({ verified: e.target.checked })} />
        Selo de verificado
      </label>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">Estilo do texto</label>
        <Select
          value={displayStyle}
          onChange={(e) => onChange({ displayStyle: e.target.value as PostDisplayStyle })}
        >
          <option value="paragrafo">Parágrafo</option>
          <option value="titulo_grande">Título grande em destaque</option>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">Corpo do post</label>
        <Textarea
          value={body}
          onChange={(e) => onChange({ body: e.target.value })}
          rows={5}
          placeholder="Escreva o texto do post..."
        />
        <p className="text-[11px] text-text-muted">
          Sintaxe: <code>**negrito**</code>, <code>*itálico*</code>, <code>==destaque verde==</code>
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">Subtítulo (opcional)</label>
        <Input
          value={subtitle}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder="Linha menor abaixo do texto principal"
        />
      </div>

      <div className="space-y-3 rounded-lg border border-dashed border-border-strong p-3">
        <p className="text-xs font-medium text-text-secondary">Card de link (opcional)</p>
        <div className="flex items-center gap-2">
          <Input
            value={linkCardImageUrl ?? ""}
            onChange={(e) => onChange({ linkCardImageUrl: e.target.value || null })}
            placeholder="URL da imagem do card"
            className="text-xs"
          />
          <input
            ref={linkImageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadImage(file, (url) => onChange({ linkCardImageUrl: url }), setUploadingLinkImage);
            }}
          />
          <button
            type="button"
            onClick={() => linkImageInputRef.current?.click()}
            disabled={uploadingLinkImage}
            title="Enviar arquivo"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input border border-border-strong text-text-secondary hover:bg-card-hover disabled:opacity-50"
          >
            <Upload size={14} />
          </button>
        </div>
        {uploadingLinkImage && <p className="text-xs text-text-muted">Enviando...</p>}
        <Input
          value={linkCardTitle}
          onChange={(e) => onChange({ linkCardTitle: e.target.value })}
          placeholder="Título do card (fonte serifada)"
          className="text-xs"
        />
        <Input
          value={linkCardDescription}
          onChange={(e) => onChange({ linkCardDescription: e.target.value })}
          placeholder="Descrição do card"
          className="text-xs"
        />
      </div>
    </div>
  );
}
