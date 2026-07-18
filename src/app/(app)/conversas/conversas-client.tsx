"use client";

import { useState } from "react";
import { Plus, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { PhonePreview } from "./components/phone-preview";
import { ExportCanvas } from "./components/export-canvas";
import { ExportControls } from "./components/export-controls";
import { MessageEditor } from "./components/message-editor";
import { HeaderEditor } from "./components/header-editor";
import { AiGeneratePanel } from "./components/ai-generate-panel";
import { HistoryPanel } from "./components/history-panel";
import type { ConversationMessage, Database, Platform } from "@/lib/supabase/types";

type FakeConversation = Database["public"]["Tables"]["fake_conversations"]["Row"];

interface ConversasClientProps {
  initialConversations: FakeConversation[];
  currentUserId: string;
}

const DEFAULT_STATE = {
  platform: "whatsapp" as Platform,
  showFrame: true,
  title: "",
  tema: "",
  contactName: "Ana Trader",
  contactAvatarUrl: null as string | null,
  contactStatus: "online",
  statusBarTime: "9:41",
  messages: [] as ConversationMessage[],
  crmInstanceName: "",
  crmAssigneeName: "",
  crmAssigneeAvatarUrl: null as string | null,
  crmStatus: "aberto",
};

export function ConversasClient({ initialConversations, currentUserId }: ConversasClientProps) {
  const toast = useToast();
  const [conversations, setConversations] = useState<FakeConversation[]>(initialConversations);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [lastPromptId, setLastPromptId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [platform, setPlatform] = useState<Platform>(DEFAULT_STATE.platform);
  const [showFrame, setShowFrame] = useState(DEFAULT_STATE.showFrame);
  const [title, setTitle] = useState(DEFAULT_STATE.title);
  const [tema, setTema] = useState(DEFAULT_STATE.tema);
  const [contactName, setContactName] = useState(DEFAULT_STATE.contactName);
  const [contactAvatarUrl, setContactAvatarUrl] = useState<string | null>(DEFAULT_STATE.contactAvatarUrl);
  const [contactStatus, setContactStatus] = useState(DEFAULT_STATE.contactStatus);
  const [statusBarTime, setStatusBarTime] = useState(DEFAULT_STATE.statusBarTime);
  const [messages, setMessages] = useState<ConversationMessage[]>(DEFAULT_STATE.messages);
  const [crmInstanceName, setCrmInstanceName] = useState(DEFAULT_STATE.crmInstanceName);
  const [crmAssigneeName, setCrmAssigneeName] = useState(DEFAULT_STATE.crmAssigneeName);
  const [crmAssigneeAvatarUrl, setCrmAssigneeAvatarUrl] = useState<string | null>(DEFAULT_STATE.crmAssigneeAvatarUrl);
  const [crmStatus, setCrmStatus] = useState(DEFAULT_STATE.crmStatus);

  function resetToNew() {
    setCurrentId(null);
    setLastPromptId(null);
    setPlatform(DEFAULT_STATE.platform);
    setShowFrame(DEFAULT_STATE.showFrame);
    setTitle(DEFAULT_STATE.title);
    setTema(DEFAULT_STATE.tema);
    setContactName(DEFAULT_STATE.contactName);
    setContactAvatarUrl(DEFAULT_STATE.contactAvatarUrl);
    setContactStatus(DEFAULT_STATE.contactStatus);
    setStatusBarTime(DEFAULT_STATE.statusBarTime);
    setMessages(DEFAULT_STATE.messages);
    setCrmInstanceName(DEFAULT_STATE.crmInstanceName);
    setCrmAssigneeName(DEFAULT_STATE.crmAssigneeName);
    setCrmAssigneeAvatarUrl(DEFAULT_STATE.crmAssigneeAvatarUrl);
    setCrmStatus(DEFAULT_STATE.crmStatus);
  }

  function loadConversation(conversation: FakeConversation) {
    setCurrentId(conversation.id);
    setLastPromptId(conversation.prompt_id);
    setPlatform(conversation.platform);
    setTitle(conversation.title ?? "");
    setTema(conversation.tema ?? "");
    setContactName(conversation.contact_name ?? "");
    setContactAvatarUrl(conversation.contact_avatar_url);
    setContactStatus(conversation.contact_status ?? "");
    setStatusBarTime("9:41");
    setMessages((conversation.messages as ConversationMessage[]) ?? []);
    setCrmInstanceName(conversation.crm_instance_name ?? "");
    setCrmAssigneeName(conversation.crm_assignee_name ?? "");
    setCrmAssigneeAvatarUrl(conversation.crm_assignee_avatar_url);
    setCrmStatus(conversation.crm_status ?? "aberto");
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      platform,
      title: title || null,
      contact_name: contactName || null,
      contact_avatar_url: contactAvatarUrl,
      contact_status: contactStatus || null,
      messages,
      prompt_id: lastPromptId,
      tema: tema || null,
      export_format: "stories",
      crm_instance_name: crmInstanceName || null,
      crm_assignee_name: crmAssigneeName || null,
      crm_assignee_avatar_url: crmAssigneeAvatarUrl,
      crm_status: crmStatus || null,
      created_by: currentUserId,
    };

    if (currentId) {
      const { data, error } = await supabase
        .from("fake_conversations")
        .update(payload)
        .eq("id", currentId)
        .select()
        .single();
      if (!error && data) {
        setConversations((prev) => prev.map((c) => (c.id === data.id ? data : c)));
        toast.success("Conversa salva.");
      } else {
        toast.error("Erro ao salvar a conversa. Tente novamente.");
      }
    } else {
      const { data, error } = await supabase.from("fake_conversations").insert(payload).select().single();
      if (!error && data) {
        setCurrentId(data.id);
        setConversations((prev) => [data, ...prev]);
        toast.success("Conversa salva.");
      } else {
        toast.error("Erro ao salvar a conversa. Tente novamente.");
      }
    }
    setSaving(false);
  }

  async function handleDelete(conversation: FakeConversation) {
    if (!confirm(`Excluir a conversa "${conversation.title || conversation.contact_name || "sem título"}"?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("fake_conversations").delete().eq("id", conversation.id);
    if (!error) {
      setConversations((prev) => prev.filter((c) => c.id !== conversation.id));
      if (currentId === conversation.id) resetToNew();
    } else {
      toast.error("Erro ao excluir a conversa. Tente novamente.");
    }
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <PlatformToggle platform={platform} onChange={setPlatform} />
          {platform !== "crm" && (
            <label className="flex items-center gap-1.5 text-xs text-text-secondary">
              <input type="checkbox" checked={showFrame} onChange={(e) => setShowFrame(e.target.checked)} />
              Moldura de celular
            </label>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <HistoryPanel conversations={conversations} onSelect={loadConversation} onDelete={handleDelete} />
          <Button type="button" variant="secondary" size="sm" onClick={resetToNew}>
            <Plus size={14} />
            Nova conversa
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
            <Save size={14} />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da conversa (opcional)" />
        <Input value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Tema/tag (ex: cripto, promoção)" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_480px]">
        <div className="space-y-6">
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-medium text-text-primary">Cabeçalho</h3>
            <HeaderEditor
              platform={platform}
              contactName={contactName}
              contactAvatarUrl={contactAvatarUrl}
              contactStatus={contactStatus}
              statusBarTime={statusBarTime}
              crmInstanceName={crmInstanceName}
              crmAssigneeName={crmAssigneeName}
              crmAssigneeAvatarUrl={crmAssigneeAvatarUrl}
              crmStatus={crmStatus}
              onChange={(patch) => {
                if (patch.contactName !== undefined) setContactName(patch.contactName);
                if (patch.contactAvatarUrl !== undefined) setContactAvatarUrl(patch.contactAvatarUrl);
                if (patch.contactStatus !== undefined) setContactStatus(patch.contactStatus);
                if (patch.statusBarTime !== undefined) setStatusBarTime(patch.statusBarTime);
                if (patch.crmInstanceName !== undefined) setCrmInstanceName(patch.crmInstanceName);
                if (patch.crmAssigneeName !== undefined) setCrmAssigneeName(patch.crmAssigneeName);
                if (patch.crmAssigneeAvatarUrl !== undefined) setCrmAssigneeAvatarUrl(patch.crmAssigneeAvatarUrl);
                if (patch.crmStatus !== undefined) setCrmStatus(patch.crmStatus);
              }}
            />
          </Card>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Card className="h-fit p-4">
              <h3 className="mb-3 text-sm font-medium text-text-primary">Gerar com IA</h3>
              <AiGeneratePanel
                platform={platform}
                hasExistingMessages={messages.length > 0}
                onGenerated={(generated, promptId) => {
                  setMessages(generated);
                  setLastPromptId(promptId);
                }}
              />
            </Card>

            <Card className="h-fit p-4">
              <h3 className="mb-3 text-sm font-medium text-text-primary">Mensagens</h3>
              <MessageEditor platform={platform} messages={messages} onChange={setMessages} />
            </Card>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[480px]">
          <Card className="flex flex-col items-center gap-4 overflow-x-auto p-6">
            <ExportCanvas>
              <PhonePreview
                platform={platform}
                showFrame={showFrame}
                contactName={contactName}
                contactAvatarUrl={contactAvatarUrl}
                contactStatus={contactStatus}
                statusBarTime={statusBarTime}
                messages={messages}
                crmInstanceName={crmInstanceName}
                crmAssigneeName={crmAssigneeName}
                crmAssigneeAvatarUrl={crmAssigneeAvatarUrl}
                crmStatus={crmStatus}
              />
            </ExportCanvas>

            <ExportControls platform={platform} />
          </Card>
        </div>
      </div>
    </div>
  );
}

const PLATFORM_LABELS: Record<Platform, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  crm: "CRM/Atendimento",
};

function PlatformToggle({ platform, onChange }: { platform: Platform; onChange: (p: Platform) => void }) {
  return (
    <div className="flex rounded-button border border-border-strong p-0.5">
      {(["whatsapp", "instagram", "crm"] as Platform[]).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`rounded-button px-3 py-1.5 text-xs font-medium transition-colors ${
            platform === p ? "bg-accent text-white" : "text-text-secondary hover:bg-card-hover"
          }`}
        >
          {PLATFORM_LABELS[p]}
        </button>
      ))}
    </div>
  );
}
