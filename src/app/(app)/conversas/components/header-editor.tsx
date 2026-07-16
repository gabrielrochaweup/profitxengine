"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";

interface HeaderEditorProps {
  contactName: string;
  contactAvatarUrl: string | null;
  contactStatus: string;
  statusBarTime: string;
  onChange: (patch: Partial<{
    contactName: string;
    contactAvatarUrl: string | null;
    contactStatus: string;
    statusBarTime: string;
  }>) => void;
}

export function HeaderEditor({
  contactName,
  contactAvatarUrl,
  contactStatus,
  statusBarTime,
  onChange,
}: HeaderEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const supabase = createClient();
    const path = `${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from("conversation-avatars").upload(path, file);

    if (!error) {
      const { data } = supabase.storage.from("conversation-avatars").getPublicUrl(path);
      onChange({ contactAvatarUrl: data.publicUrl });
    }
    setUploading(false);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">Nome do contato</label>
        <Input
          value={contactName}
          onChange={(e) => onChange({ contactName: e.target.value })}
          placeholder="Ex: Ana Trader"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">Foto de perfil</label>
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
            onChange={handleFileSelected}
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
        </div>
        {uploading && <p className="text-xs text-text-muted">Enviando...</p>}
      </div>

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
    </div>
  );
}
