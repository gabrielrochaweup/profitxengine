"use client";

import { useRef, useState } from "react";
import { Upload, Dices } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { pickAvatar } from "@/lib/avatar-library";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { Platform } from "@/lib/supabase/types";

interface HeaderEditorProps {
  platform: Platform;
  contactName: string;
  contactAvatarUrl: string | null;
  contactStatus: string;
  statusBarTime: string;
  crmInstanceName: string;
  crmAssigneeName: string;
  crmAssigneeAvatarUrl: string | null;
  crmStatus: string;
  onChange: (
    patch: Partial<{
      contactName: string;
      contactAvatarUrl: string | null;
      contactStatus: string;
      statusBarTime: string;
      crmInstanceName: string;
      crmAssigneeName: string;
      crmAssigneeAvatarUrl: string | null;
      crmStatus: string;
    }>
  ) => void;
}

export function HeaderEditor({
  platform,
  contactName,
  contactAvatarUrl,
  contactStatus,
  statusBarTime,
  crmInstanceName,
  crmAssigneeName,
  crmAssigneeAvatarUrl,
  crmStatus,
  onChange,
}: HeaderEditorProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const assigneeFileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingAssignee, setUploadingAssignee] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const isCrm = platform === "crm";

  async function handleDrawAvatar() {
    setDrawing(true);
    const url = await pickAvatar();
    if (url) {
      onChange({ contactAvatarUrl: url });
    } else {
      toast.error("Nenhuma foto cadastrada no banco de avatares ainda.");
    }
    setDrawing(false);
  }

  async function uploadAvatar(file: File, onDone: (url: string) => void, setBusy: (v: boolean) => void) {
    setBusy(true);
    const supabase = createClient();
    const path = `${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from("conversation-avatars").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("conversation-avatars").getPublicUrl(path);
      onDone(data.publicUrl);
    } else {
      toast.error(`Erro ao enviar a imagem: ${error.message}`);
    }
    setBusy(false);
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {isCrm && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Nome da instância/bot</label>
          <Input
            value={crmInstanceName}
            onChange={(e) => onChange({ crmInstanceName: e.target.value })}
            placeholder="Ex: Suporte PROFITX"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">Nome do contato</label>
        <Input
          value={contactName}
          onChange={(e) => onChange({ contactName: e.target.value })}
          placeholder="Ex: Ana Trader"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">
          {isCrm ? "Ícone do canal/bot" : "Foto de perfil"}
        </label>
        <div className="flex items-center gap-2">
          <Input
            value={contactAvatarUrl ?? ""}
            onChange={(e) => onChange({ contactAvatarUrl: e.target.value || null })}
            placeholder="URL da imagem (ou envie um arquivo)"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadAvatar(file, (url) => onChange({ contactAvatarUrl: url }), setUploading);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Enviar arquivo"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input border border-border-strong text-text-secondary hover:bg-card-hover disabled:opacity-50"
          >
            <Upload size={16} />
          </button>
          <button
            type="button"
            onClick={handleDrawAvatar}
            disabled={drawing}
            title="Sortear avatar do banco de fotos"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input border border-border-strong text-text-secondary hover:bg-card-hover disabled:opacity-50"
          >
            <Dices size={16} />
          </button>
        </div>
        {uploading && <p className="text-xs text-text-muted">Enviando...</p>}
        {drawing && <p className="text-xs text-text-muted">Sorteando...</p>}
      </div>

      {isCrm ? (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Responsável (nome)</label>
            <Input
              value={crmAssigneeName}
              onChange={(e) => onChange({ crmAssigneeName: e.target.value })}
              placeholder="Ex: Carla Suporte"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Avatar do responsável</label>
            <div className="flex items-center gap-2">
              <Input
                value={crmAssigneeAvatarUrl ?? ""}
                onChange={(e) => onChange({ crmAssigneeAvatarUrl: e.target.value || null })}
                placeholder="URL da imagem (ou envie um arquivo)"
              />
              <input
                ref={assigneeFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file)
                    uploadAvatar(file, (url) => onChange({ crmAssigneeAvatarUrl: url }), setUploadingAssignee);
                }}
              />
              <button
                type="button"
                onClick={() => assigneeFileInputRef.current?.click()}
                disabled={uploadingAssignee}
                title="Enviar avatar do responsável"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input border border-border-strong text-text-secondary hover:bg-card-hover disabled:opacity-50"
              >
                <Upload size={16} />
              </button>
            </div>
            {uploadingAssignee && <p className="text-xs text-text-muted">Enviando...</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Status do atendimento</label>
            <Input
              value={crmStatus}
              onChange={(e) => onChange({ crmStatus: e.target.value })}
              placeholder="aberto, pendente, resolvido..."
            />
          </div>
        </>
      ) : (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Status (ex: online, visto por último às 14:02)</label>
            <Input
              value={contactStatus}
              onChange={(e) => onChange({ contactStatus: e.target.value })}
              placeholder="online"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Hora na barra de status do celular</label>
            <Input
              value={statusBarTime}
              onChange={(e) => onChange({ statusBarTime: e.target.value })}
              placeholder="9:41"
            />
          </div>
        </>
      )}
    </div>
  );
}
