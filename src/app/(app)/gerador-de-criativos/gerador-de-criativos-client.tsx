"use client";

import { useState } from "react";
import { Plus, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { PostEditor } from "./components/post-editor";
import { PostPreview, POST_FORMAT_DIMENSIONS } from "./components/post-preview";
import { PostGeneratePanel } from "./components/post-generate-panel";
import { PostExportControls } from "./components/post-export-controls";
import { PostHistoryPanel } from "./components/post-history-panel";
import { CriativosLivre } from "./components/criativos-livre";
import type { Database, PostAccent, PostDisplayStyle, PostFormat, PostTemplate } from "@/lib/supabase/types";

type FakePost = Database["public"]["Tables"]["fake_posts"]["Row"];
type PostPromptTemplateRow = Database["public"]["Tables"]["post_prompt_templates"]["Row"];

interface GeradorDeCriativosClientProps {
  initialPosts: FakePost[];
  initialTemplates: PostPromptTemplateRow[];
  currentUserId: string;
}

const DEFAULT_STATE = {
  title: "",
  template: "twitter" as PostTemplate,
  authorName: "Robson Guerreiro",
  authorHandle: "@robsonprofitx",
  authorAvatarUrl: null as string | null,
  verified: true,
  displayStyle: "paragrafo" as PostDisplayStyle,
  format: "quadrado" as PostFormat,
  body: "",
  subtitle: "",
  linkCardImageUrl: null as string | null,
  linkCardTitle: "",
  linkCardDescription: "",
  // Defaults tirados direto do herói de lives.escolaprofitx.com — só trocar
  // o número/texto pra sair uma peça nova já no padrão certo.
  profitxBadgeText: "Profissionais lucrando por você no automático",
  profitxHeadline1: "Nós Operamos.",
  profitxHeadline2: "Você Lucra.",
  profitxStatLabel: "TAXA DE ACERTO GERAL DO MÉTODO",
  profitxStatValue: "92%",
  profitxStatCaption: "2.132 operações verificadas",
  profitxFooterLine1: "Resultado real combinado de Lives + IA + Copy Trader.",
  profitxFooterLine2: "Dados auditáveis. Atualizado diariamente.",
  profitxAccent: "dourado" as PostAccent,
};

export function GeradorDeCriativosClient({ initialPosts, currentUserId }: GeradorDeCriativosClientProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const [tab, setTab] = useState<"posts" | "criativos">("posts");

  const [posts, setPosts] = useState<FakePost[]>(initialPosts);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [lastPromptId, setLastPromptId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState(DEFAULT_STATE.title);
  const [template, setTemplate] = useState<PostTemplate>(DEFAULT_STATE.template);
  const [authorName, setAuthorName] = useState(DEFAULT_STATE.authorName);
  const [authorHandle, setAuthorHandle] = useState(DEFAULT_STATE.authorHandle);
  const [authorAvatarUrl, setAuthorAvatarUrl] = useState<string | null>(DEFAULT_STATE.authorAvatarUrl);
  const [verified, setVerified] = useState(DEFAULT_STATE.verified);
  const [displayStyle, setDisplayStyle] = useState<PostDisplayStyle>(DEFAULT_STATE.displayStyle);
  const [format, setFormat] = useState<PostFormat>(DEFAULT_STATE.format);
  const [body, setBody] = useState(DEFAULT_STATE.body);
  const [subtitle, setSubtitle] = useState(DEFAULT_STATE.subtitle);
  const [linkCardImageUrl, setLinkCardImageUrl] = useState<string | null>(DEFAULT_STATE.linkCardImageUrl);
  const [linkCardTitle, setLinkCardTitle] = useState(DEFAULT_STATE.linkCardTitle);
  const [linkCardDescription, setLinkCardDescription] = useState(DEFAULT_STATE.linkCardDescription);
  const [profitxBadgeText, setProfitxBadgeText] = useState(DEFAULT_STATE.profitxBadgeText);
  const [profitxHeadline1, setProfitxHeadline1] = useState(DEFAULT_STATE.profitxHeadline1);
  const [profitxHeadline2, setProfitxHeadline2] = useState(DEFAULT_STATE.profitxHeadline2);
  const [profitxStatLabel, setProfitxStatLabel] = useState(DEFAULT_STATE.profitxStatLabel);
  const [profitxStatValue, setProfitxStatValue] = useState(DEFAULT_STATE.profitxStatValue);
  const [profitxStatCaption, setProfitxStatCaption] = useState(DEFAULT_STATE.profitxStatCaption);
  const [profitxFooterLine1, setProfitxFooterLine1] = useState(DEFAULT_STATE.profitxFooterLine1);
  const [profitxFooterLine2, setProfitxFooterLine2] = useState(DEFAULT_STATE.profitxFooterLine2);
  const [profitxAccent, setProfitxAccent] = useState<PostAccent>(DEFAULT_STATE.profitxAccent);

  function resetToNew() {
    setCurrentId(null);
    setLastPromptId(null);
    setTitle(DEFAULT_STATE.title);
    setTemplate(DEFAULT_STATE.template);
    setAuthorName(DEFAULT_STATE.authorName);
    setAuthorHandle(DEFAULT_STATE.authorHandle);
    setAuthorAvatarUrl(DEFAULT_STATE.authorAvatarUrl);
    setVerified(DEFAULT_STATE.verified);
    setDisplayStyle(DEFAULT_STATE.displayStyle);
    setFormat(DEFAULT_STATE.format);
    setBody(DEFAULT_STATE.body);
    setSubtitle(DEFAULT_STATE.subtitle);
    setLinkCardImageUrl(DEFAULT_STATE.linkCardImageUrl);
    setLinkCardTitle(DEFAULT_STATE.linkCardTitle);
    setLinkCardDescription(DEFAULT_STATE.linkCardDescription);
    setProfitxBadgeText(DEFAULT_STATE.profitxBadgeText);
    setProfitxHeadline1(DEFAULT_STATE.profitxHeadline1);
    setProfitxHeadline2(DEFAULT_STATE.profitxHeadline2);
    setProfitxStatLabel(DEFAULT_STATE.profitxStatLabel);
    setProfitxStatValue(DEFAULT_STATE.profitxStatValue);
    setProfitxStatCaption(DEFAULT_STATE.profitxStatCaption);
    setProfitxFooterLine1(DEFAULT_STATE.profitxFooterLine1);
    setProfitxFooterLine2(DEFAULT_STATE.profitxFooterLine2);
    setProfitxAccent(DEFAULT_STATE.profitxAccent);
  }

  function loadPost(post: FakePost) {
    setCurrentId(post.id);
    setLastPromptId(post.prompt_id);
    setTitle(post.title ?? "");
    setTemplate(post.template);
    setAuthorName(post.author_name ?? "");
    setAuthorHandle(post.author_handle ?? "");
    setAuthorAvatarUrl(post.author_avatar_url);
    setVerified(post.verified);
    setDisplayStyle(post.display_style);
    setFormat(post.format);
    setBody(post.body ?? "");
    setSubtitle(post.subtitle ?? "");
    setLinkCardImageUrl(post.link_card_image_url);
    setLinkCardTitle(post.link_card_title ?? "");
    setLinkCardDescription(post.link_card_description ?? "");
    setProfitxBadgeText(post.profitx_badge_text ?? "");
    setProfitxHeadline1(post.profitx_headline_1 ?? "");
    setProfitxHeadline2(post.profitx_headline_2 ?? "");
    setProfitxStatLabel(post.profitx_stat_label ?? "");
    setProfitxStatValue(post.profitx_stat_value ?? "");
    setProfitxStatCaption(post.profitx_stat_caption ?? "");
    setProfitxFooterLine1(post.profitx_footer_line1 ?? "");
    setProfitxFooterLine2(post.profitx_footer_line2 ?? "");
    setProfitxAccent(post.profitx_accent);
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      title: title || null,
      template,
      author_name: authorName || null,
      author_handle: authorHandle || null,
      author_avatar_url: authorAvatarUrl,
      verified,
      display_style: displayStyle,
      format,
      body: body || null,
      subtitle: subtitle || null,
      link_card_image_url: linkCardImageUrl,
      link_card_title: linkCardTitle || null,
      link_card_description: linkCardDescription || null,
      profitx_badge_text: profitxBadgeText || null,
      profitx_headline_1: profitxHeadline1 || null,
      profitx_headline_2: profitxHeadline2 || null,
      profitx_stat_label: profitxStatLabel || null,
      profitx_stat_value: profitxStatValue || null,
      profitx_stat_caption: profitxStatCaption || null,
      profitx_footer_line1: profitxFooterLine1 || null,
      profitx_footer_line2: profitxFooterLine2 || null,
      profitx_accent: profitxAccent,
      prompt_id: lastPromptId,
      created_by: currentUserId,
    };

    if (currentId) {
      const { data, error } = await supabase
        .from("fake_posts")
        .update(payload)
        .eq("id", currentId)
        .select()
        .single();
      if (!error && data) {
        setPosts((prev) => prev.map((p) => (p.id === data.id ? data : p)));
        toast.success("Post salvo.");
      } else {
        toast.error("Erro ao salvar o post. Tente novamente.");
      }
    } else {
      const { data, error } = await supabase.from("fake_posts").insert(payload).select().single();
      if (!error && data) {
        setCurrentId(data.id);
        setPosts((prev) => [data, ...prev]);
        toast.success("Post salvo.");
      } else {
        toast.error("Erro ao salvar o post. Tente novamente.");
      }
    }
    setSaving(false);
  }

  async function handleDelete(post: FakePost) {
    const ok = await confirm({
      title: "Excluir post",
      description: `Excluir o post "${post.title || post.author_name || "sem título"}"? Essa ação não pode ser desfeita.`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const supabase = createClient();
    const { error } = await supabase.from("fake_posts").delete().eq("id", post.id);
    if (!error) {
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      if (currentId === post.id) resetToNew();
    } else {
      toast.error("Erro ao excluir o post. Tente novamente.");
    }
  }

  return (
    <div className="mt-6">
      <div className="flex gap-1.5 rounded-button border border-border-strong p-0.5 w-fit">
        <TabButton active={tab === "posts"} onClick={() => setTab("posts")}>
          Gerador de Posts
        </TabButton>
        <TabButton active={tab === "criativos"} onClick={() => setTab("criativos")}>
          Criativos
        </TabButton>
      </div>

      {tab === "posts" ? (
        <div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do post (opcional, só pra organizar)"
                className="max-w-xs"
              />
              <Select
                value={template}
                onChange={(e) => setTemplate(e.target.value as PostTemplate)}
                className="h-10 w-40 text-sm"
              >
                <option value="twitter">X (Twitter)</option>
                <option value="profitx">PROFITX Lives</option>
              </Select>
              <Select
                value={format}
                onChange={(e) => setFormat(e.target.value as PostFormat)}
                className="h-10 w-44 text-sm"
              >
                {(Object.keys(POST_FORMAT_DIMENSIONS) as PostFormat[]).map((f) => (
                  <option key={f} value={f}>
                    {POST_FORMAT_DIMENSIONS[f].label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PostHistoryPanel posts={posts} onSelect={loadPost} onDelete={handleDelete} />
              <Button type="button" variant="secondary" size="sm" onClick={resetToNew}>
                <Plus size={14} />
                Novo post
              </Button>
              <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
                <Save size={14} />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_560px]">
            <div className="space-y-6">
              <Card className="p-4">
                <h3 className="mb-3 text-sm font-medium text-text-primary">Conteúdo do post</h3>
                <PostEditor
                  template={template}
                  authorName={authorName}
                  authorHandle={authorHandle}
                  authorAvatarUrl={authorAvatarUrl}
                  verified={verified}
                  displayStyle={displayStyle}
                  body={body}
                  subtitle={subtitle}
                  linkCardImageUrl={linkCardImageUrl}
                  linkCardTitle={linkCardTitle}
                  linkCardDescription={linkCardDescription}
                  profitxBadgeText={profitxBadgeText}
                  profitxHeadline1={profitxHeadline1}
                  profitxHeadline2={profitxHeadline2}
                  profitxStatLabel={profitxStatLabel}
                  profitxStatValue={profitxStatValue}
                  profitxStatCaption={profitxStatCaption}
                  profitxFooterLine1={profitxFooterLine1}
                  profitxFooterLine2={profitxFooterLine2}
                  profitxAccent={profitxAccent}
                  onChange={(patch) => {
                    if (patch.authorName !== undefined) setAuthorName(patch.authorName);
                    if (patch.authorHandle !== undefined) setAuthorHandle(patch.authorHandle);
                    if (patch.authorAvatarUrl !== undefined) setAuthorAvatarUrl(patch.authorAvatarUrl);
                    if (patch.verified !== undefined) setVerified(patch.verified);
                    if (patch.displayStyle !== undefined) setDisplayStyle(patch.displayStyle);
                    if (patch.body !== undefined) setBody(patch.body);
                    if (patch.subtitle !== undefined) setSubtitle(patch.subtitle);
                    if (patch.linkCardImageUrl !== undefined) setLinkCardImageUrl(patch.linkCardImageUrl);
                    if (patch.linkCardTitle !== undefined) setLinkCardTitle(patch.linkCardTitle);
                    if (patch.linkCardDescription !== undefined) setLinkCardDescription(patch.linkCardDescription);
                    if (patch.profitxBadgeText !== undefined) setProfitxBadgeText(patch.profitxBadgeText);
                    if (patch.profitxHeadline1 !== undefined) setProfitxHeadline1(patch.profitxHeadline1);
                    if (patch.profitxHeadline2 !== undefined) setProfitxHeadline2(patch.profitxHeadline2);
                    if (patch.profitxStatLabel !== undefined) setProfitxStatLabel(patch.profitxStatLabel);
                    if (patch.profitxStatValue !== undefined) setProfitxStatValue(patch.profitxStatValue);
                    if (patch.profitxStatCaption !== undefined) setProfitxStatCaption(patch.profitxStatCaption);
                    if (patch.profitxFooterLine1 !== undefined) setProfitxFooterLine1(patch.profitxFooterLine1);
                    if (patch.profitxFooterLine2 !== undefined) setProfitxFooterLine2(patch.profitxFooterLine2);
                    if (patch.profitxAccent !== undefined) setProfitxAccent(patch.profitxAccent);
                  }}
                />
              </Card>

              {template === "twitter" && (
                <Card className="p-4">
                  <PostGeneratePanel
                    onGenerated={(generatedBody, promptId) => {
                      setBody(generatedBody);
                      setLastPromptId(promptId);
                    }}
                  />
                </Card>
              )}
            </div>

            <div className="mx-auto w-full max-w-[560px]">
              <Card className="flex flex-col items-center gap-4 overflow-x-auto p-6">
                <div id="post-export-content">
                  <PostPreview
                    template={template}
                    authorName={authorName}
                    authorHandle={authorHandle}
                    authorAvatarUrl={authorAvatarUrl}
                    verified={verified}
                    displayStyle={displayStyle}
                    format={format}
                    body={body}
                    subtitle={subtitle}
                    linkCardImageUrl={linkCardImageUrl}
                    linkCardTitle={linkCardTitle}
                    linkCardDescription={linkCardDescription}
                    profitxBadgeText={profitxBadgeText}
                    profitxHeadline1={profitxHeadline1}
                    profitxHeadline2={profitxHeadline2}
                    profitxStatLabel={profitxStatLabel}
                    profitxStatValue={profitxStatValue}
                    profitxStatCaption={profitxStatCaption}
                    profitxFooterLine1={profitxFooterLine1}
                    profitxFooterLine2={profitxFooterLine2}
                    profitxAccent={profitxAccent}
                  />
                </div>
                <PostExportControls />
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <CriativosLivre />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-button px-4 py-2 text-sm font-medium transition-colors ${
        active ? "bg-accent text-white" : "text-text-secondary hover:bg-card-hover"
      }`}
    >
      {children}
    </button>
  );
}
