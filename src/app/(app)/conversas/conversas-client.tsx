"use client";

import { useEffect, useState } from "react";
import { Plus, Save, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { pickAvatar } from "@/lib/avatar-library";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubTabs } from "@/components/ui/sub-tabs";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { ContentGrid, Field } from "@/components/ui/page";
import { PhonePreview } from "./components/phone-preview";
import { ExportCanvas } from "./components/export-canvas";
import { ExportControls } from "./components/export-controls";
import { MessageEditor } from "./components/message-editor";
import { HeaderEditor } from "./components/header-editor";
import { AiGeneratePanel } from "./components/ai-generate-panel";
import { HistoryPanel } from "./components/history-panel";
import { LocaleCarousel } from "./components/locale-carousel";
import { CLIENT_LOCALES } from "@/lib/supabase/types";
import type {
  ClientLocale,
  ConversationMessage,
  ConversationTranslations,
  Database,
  Platform,
} from "@/lib/supabase/types";

type FakeConversation = Database["public"]["Tables"]["fake_conversations"]["Row"];

interface ConversasClientProps {
  initialConversations: FakeConversation[];
  currentUserId: string;
}

interface LocaleVersion {
  contactName: string;
  contactStatus: string;
  messages: ConversationMessage[];
}

function makeDefaultVersions(): Record<ClientLocale, LocaleVersion> {
  return {
    br: { contactName: "Ana Trader", contactStatus: "online", messages: [] },
    us: { contactName: "", contactStatus: "", messages: [] },
    es: { contactName: "", contactStatus: "", messages: [] },
  };
}

const DEFAULT_STATE = {
  platform: "instagram" as Platform,
  showFrame: false,
  title: "",
  tema: "",
  contactAvatarUrl: null as string | null,
  statusBarTime: "9:41",
  crmInstanceName: "",
  crmAssigneeName: "",
  crmAssigneeAvatarUrl: null as string | null,
  crmStatus: "aberto",
};

export function ConversasClient({ initialConversations, currentUserId }: ConversasClientProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const [conversations, setConversations] = useState<FakeConversation[]>(initialConversations);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [lastPromptId, setLastPromptId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [headerOpen, setHeaderOpen] = useState(false);

  const [platform, setPlatform] = useState<Platform>(DEFAULT_STATE.platform);
  const [showFrame, setShowFrame] = useState(DEFAULT_STATE.showFrame);
  const [title, setTitle] = useState(DEFAULT_STATE.title);
  const [tema, setTema] = useState(DEFAULT_STATE.tema);
  const [contactAvatarUrl, setContactAvatarUrl] = useState<string | null>(DEFAULT_STATE.contactAvatarUrl);
  const [statusBarTime, setStatusBarTime] = useState(DEFAULT_STATE.statusBarTime);
  const [versions, setVersions] = useState<Record<ClientLocale, LocaleVersion>>(makeDefaultVersions());
  const [activeLocale, setActiveLocale] = useState<ClientLocale>("br");
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
    setContactAvatarUrl(DEFAULT_STATE.contactAvatarUrl);
    setStatusBarTime(DEFAULT_STATE.statusBarTime);
    setVersions(makeDefaultVersions());
    setActiveLocale("br");
    setCrmInstanceName(DEFAULT_STATE.crmInstanceName);
    setCrmAssigneeName(DEFAULT_STATE.crmAssigneeName);
    setCrmAssigneeAvatarUrl(DEFAULT_STATE.crmAssigneeAvatarUrl);
    setCrmStatus(DEFAULT_STATE.crmStatus);
    pickAvatar().then((url) => {
      if (url) setContactAvatarUrl(url);
    });
  }

  // Já chega com um avatar sorteado do banco de fotos, sem precisar clicar em "Nova conversa" primeiro.
  useEffect(() => {
    pickAvatar().then((url) => {
      if (url) setContactAvatarUrl(url);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadConversation(conversation: FakeConversation) {
    const translations = (conversation.translations as ConversationTranslations | null) ?? {};
    setCurrentId(conversation.id);
    setLastPromptId(conversation.prompt_id);
    setPlatform(conversation.platform);
    setTitle(conversation.title ?? "");
    setTema(conversation.tema ?? "");
    setContactAvatarUrl(conversation.contact_avatar_url);
    setStatusBarTime("9:41");
    setVersions({
      br: {
        contactName: conversation.contact_name ?? "",
        contactStatus: conversation.contact_status ?? "",
        messages: (conversation.messages as ConversationMessage[]) ?? [],
      },
      us: {
        contactName: translations.us?.contact_name ?? "",
        contactStatus: translations.us?.contact_status ?? "",
        messages: translations.us?.messages ?? [],
      },
      es: {
        contactName: translations.es?.contact_name ?? "",
        contactStatus: translations.es?.contact_status ?? "",
        messages: translations.es?.messages ?? [],
      },
    });
    setActiveLocale("br");
    setCrmInstanceName(conversation.crm_instance_name ?? "");
    setCrmAssigneeName(conversation.crm_assignee_name ?? "");
    setCrmAssigneeAvatarUrl(conversation.crm_assignee_avatar_url);
    setCrmStatus(conversation.crm_status ?? "aberto");
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const translations: ConversationTranslations = {
      us: {
        contact_name: versions.us.contactName || null,
        contact_status: versions.us.contactStatus || null,
        messages: versions.us.messages,
      },
      es: {
        contact_name: versions.es.contactName || null,
        contact_status: versions.es.contactStatus || null,
        messages: versions.es.messages,
      },
    };
    const payload = {
      platform,
      title: title || null,
      contact_name: versions.br.contactName || null,
      contact_avatar_url: contactAvatarUrl,
      contact_status: versions.br.contactStatus || null,
      messages: versions.br.messages,
      translations,
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
    const ok = await confirm({
      title: "Excluir conversa",
      description: `Excluir a conversa "${conversation.title || conversation.contact_name || "sem título"}"? Essa ação não pode ser desfeita.`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const supabase = createClient();
    const { error } = await supabase.from("fake_conversations").delete().eq("id", conversation.id);
    if (!error) {
      setConversations((prev) => prev.filter((c) => c.id !== conversation.id));
      if (currentId === conversation.id) resetToNew();
    } else {
      toast.error("Erro ao excluir a conversa. Tente novamente.");
    }
  }

  const active = versions[activeLocale];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <PlatformToggle platform={platform} onChange={setPlatform} />
          {platform !== "crm" && (
            <label className="flex items-center gap-1.5 text-xs text-text-secondary">
              <input type="checkbox" checked={showFrame} onChange={(e) => setShowFrame(e.target.checked)} />
              Moldura de celular (opcional)
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

      {/* Estes dois campos só tinham placeholder. Placeholder some quando se
          digita: dois minutos depois ninguém sabe qual caixa era qual. */}
      <ContentGrid className="mt-4">
        <Field label="Título da conversa" hint="(opcional)" span={6}>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: objeção de preço" />
        </Field>
        <Field label="Tema/tag" span={6}>
          <Input value={tema} onChange={(e) => setTema(e.target.value)} placeholder="cripto, promoção..." />
        </Field>
      </ContentGrid>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_480px]">
        <div className="space-y-6">
          <Card className="p-4">
            <button
              type="button"
              onClick={() => setHeaderOpen((v) => !v)}
              className="flex w-full items-center justify-between"
            >
              <h3 className="text-[15px] font-semibold text-text-primary">Cabeçalho</h3>
              {headerOpen ? (
                <ChevronUp size={16} className="text-text-tertiary" />
              ) : (
                <ChevronDown size={16} className="text-text-tertiary" />
              )}
            </button>
            {headerOpen && (
              <div className="mt-3">
                <HeaderEditor
                  platform={platform}
                  contactName={active.contactName}
                  contactAvatarUrl={contactAvatarUrl}
                  contactStatus={active.contactStatus}
                  statusBarTime={statusBarTime}
                  crmInstanceName={crmInstanceName}
                  crmAssigneeName={crmAssigneeName}
                  crmAssigneeAvatarUrl={crmAssigneeAvatarUrl}
                  crmStatus={crmStatus}
                  onChange={(patch) => {
                    if (patch.contactName !== undefined || patch.contactStatus !== undefined) {
                      setVersions((prev) => ({
                        ...prev,
                        [activeLocale]: {
                          ...prev[activeLocale],
                          ...(patch.contactName !== undefined ? { contactName: patch.contactName } : {}),
                          ...(patch.contactStatus !== undefined ? { contactStatus: patch.contactStatus } : {}),
                        },
                      }));
                    }
                    if (patch.contactAvatarUrl !== undefined) setContactAvatarUrl(patch.contactAvatarUrl);
                    if (patch.statusBarTime !== undefined) setStatusBarTime(patch.statusBarTime);
                    if (patch.crmInstanceName !== undefined) setCrmInstanceName(patch.crmInstanceName);
                    if (patch.crmAssigneeName !== undefined) setCrmAssigneeName(patch.crmAssigneeName);
                    if (patch.crmAssigneeAvatarUrl !== undefined) setCrmAssigneeAvatarUrl(patch.crmAssigneeAvatarUrl);
                    if (patch.crmStatus !== undefined) setCrmStatus(patch.crmStatus);
                  }}
                />
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Card className="h-fit p-4">
              <AiGeneratePanel
                platform={platform}
                hasExistingMessages={CLIENT_LOCALES.some((loc) => versions[loc].messages.length > 0)}
                onGenerated={(byLocale, promptId) => {
                  setLastPromptId(promptId);
                  setVersions((prev) => {
                    const next = { ...prev };
                    for (const loc of CLIENT_LOCALES) {
                      const generated = byLocale[loc];
                      if (!generated) continue;
                      // O handle só faz sentido no Instagram — no WhatsApp/CRM esse mesmo
                      // campo (contactStatus) significa "online/visto por último".
                      const contactStatus =
                        platform === "instagram" && generated.contactHandle
                          ? generated.contactHandle.startsWith("@")
                            ? generated.contactHandle
                            : `@${generated.contactHandle}`
                          : prev[loc].contactStatus;
                      next[loc] = {
                        contactName: generated.contactName ?? prev[loc].contactName,
                        contactStatus,
                        messages: generated.messages,
                      };
                    }
                    return next;
                  });
                  setActiveLocale("br");
                }}
              />
            </Card>

            <Card className="h-fit p-4">
              <h3 className="mb-3 text-[15px] font-semibold text-text-primary">Mensagens</h3>
              <MessageEditor
                platform={platform}
                messages={active.messages}
                onChange={(messages) =>
                  setVersions((prev) => ({ ...prev, [activeLocale]: { ...prev[activeLocale], messages } }))
                }
              />
            </Card>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[480px]">
          <Card className="flex flex-col items-center gap-4 p-6">
            <div className="w-full overflow-x-auto">
              <ExportCanvas>
                <PhonePreview
                  platform={platform}
                  showFrame={showFrame}
                  contactName={active.contactName}
                  contactAvatarUrl={contactAvatarUrl}
                  contactStatus={active.contactStatus}
                  statusBarTime={statusBarTime}
                  messages={active.messages}
                  crmInstanceName={crmInstanceName}
                  crmAssigneeName={crmAssigneeName}
                  crmAssigneeAvatarUrl={crmAssigneeAvatarUrl}
                  crmStatus={crmStatus}
                />
              </ExportCanvas>
            </div>

            <div className="flex w-full items-center justify-between gap-2">
              <ExportControls platform={platform} />
              <LocaleCarousel active={activeLocale} onChange={setActiveLocale} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

const PLATFORM_TABS = [
  { key: "whatsapp", label: "WhatsApp" },
  { key: "instagram", label: "Instagram" },
  { key: "crm", label: "CRM/Atendimento" },
] as const;

function PlatformToggle({ platform, onChange }: { platform: Platform; onChange: (p: Platform) => void }) {
  return <SubTabs tabs={PLATFORM_TABS} active={platform} onChange={onChange} />;
}
