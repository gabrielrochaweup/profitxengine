"use client";

import { useState } from "react";
import { Plus, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { PostEditor } from "./components/post-editor";
import { PostPreview } from "./components/post-preview";
import { PostGeneratePanel } from "./components/post-generate-panel";
import { PostExportControls } from "./components/post-export-controls";
import { PostHistoryPanel } from "./components/post-history-panel";
import { CriativosLivre } from "./components/criativos-livre";
import type { Database, PostDisplayStyle } from "@/lib/supabase/types";

type FakePost = Database["public"]["Tables"]["fake_posts"]["Row"];
type PostTemplate = Database["public"]["Tables"]["post_prompt_templates"]["Row"];

interface GeradorDeCriativosClientProps {
  initialPosts: FakePost[];
  initialTemplates: PostTemplate[];
  currentUserId: string;
}

const DEFAULT_STATE = {
  title: "",
  authorName: "Robson Guerreiro",
  authorHandle: "@robsonprofitx",
  authorAvatarUrl: null as string | null,
  verified: true,
  displayStyle: "paragrafo" as PostDisplayStyle,
  body: "",
  subtitle: "",
  linkCardImageUrl: null as string | null,
  linkCardTitle: "",
  linkCardDescription: "",
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
  const [authorName, setAuthorName] = useState(DEFAULT_STATE.authorName);
  const [authorHandle, setAuthorHandle] = useState(DEFAULT_STATE.authorHandle);
  const [authorAvatarUrl, setAuthorAvatarUrl] = useState<string | null>(DEFAULT_STATE.authorAvatarUrl);
  const [verified, setVerified] = useState(DEFAULT_STATE.verified);
  const [displayStyle, setDisplayStyle] = useState<PostDisplayStyle>(DEFAULT_STATE.displayStyle);
  const [body, setBody] = useState(DEFAULT_STATE.body);
  const [subtitle, setSubtitle] = useState(DEFAULT_STATE.subtitle);
  const [linkCardImageUrl, setLinkCardImageUrl] = useState<string | null>(DEFAULT_STATE.linkCardImageUrl);
  const [linkCardTitle, setLinkCardTitle] = useState(DEFAULT_STATE.linkCardTitle);
  const [linkCardDescription, setLinkCardDescription] = useState(DEFAULT_STATE.linkCardDescription);

  function resetToNew() {
    setCurrentId(null);
    setLastPromptId(null);
    setTitle(DEFAULT_STATE.title);
    setAuthorName(DEFAULT_STATE.authorName);
    setAuthorHandle(DEFAULT_STATE.authorHandle);
    setAuthorAvatarUrl(DEFAULT_STATE.authorAvatarUrl);
    setVerified(DEFAULT_STATE.verified);
    setDisplayStyle(DEFAULT_STATE.displayStyle);
    setBody(DEFAULT_STATE.body);
    setSubtitle(DEFAULT_STATE.subtitle);
    setLinkCardImageUrl(DEFAULT_STATE.linkCardImageUrl);
    setLinkCardTitle(DEFAULT_STATE.linkCardTitle);
    setLinkCardDescription(DEFAULT_STATE.linkCardDescription);
  }

  function loadPost(post: FakePost) {
    setCurrentId(post.id);
    setLastPromptId(post.prompt_id);
    setTitle(post.title ?? "");
    setAuthorName(post.author_name ?? "");
    setAuthorHandle(post.author_handle ?? "");
    setAuthorAvatarUrl(post.author_avatar_url);
    setVerified(post.verified);
    setDisplayStyle(post.display_style);
    setBody(post.body ?? "");
    setSubtitle(post.subtitle ?? "");
    setLinkCardImageUrl(post.link_card_image_url);
    setLinkCardTitle(post.link_card_title ?? "");
    setLinkCardDescription(post.link_card_description ?? "");
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      title: title || null,
      author_name: authorName || null,
      author_handle: authorHandle || null,
      author_avatar_url: authorAvatarUrl,
      verified,
      display_style: displayStyle,
      body: body || null,
      subtitle: subtitle || null,
      link_card_image_url: linkCardImageUrl,
      link_card_title: linkCardTitle || null,
      link_card_description: linkCardDescription || null,
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
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do post (opcional, só pra organizar)"
              className="max-w-xs"
            />
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
                  }}
                />
              </Card>

              <Card className="p-4">
                <PostGeneratePanel
                  onGenerated={(generatedBody, promptId) => {
                    setBody(generatedBody);
                    setLastPromptId(promptId);
                  }}
                />
              </Card>
            </div>

            <div className="mx-auto w-full max-w-[560px]">
              <Card className="flex flex-col items-center gap-4 overflow-x-auto p-6">
                <div id="post-export-content">
                  <PostPreview
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
