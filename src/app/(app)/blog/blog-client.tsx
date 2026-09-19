"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Tooltip } from "@/components/ui/tooltip";
import { SubTabs } from "@/components/ui/sub-tabs";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { ContentGrid, EmptyState, Field } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { markdownParaHtml } from "@/lib/blog-render";
import {
  MODOS,
  MODO_LABEL,
  contarPalavras,
  gerarSlug,
  nomeRegistroTxt,
  type BlogDominio,
  type BlogPost,
  type ModoBlog,
} from "@/lib/blog";

// Host onde a Engine responde — é o alvo do proxy e do CNAME. Vem de env
// porque muda entre o domínio da Vercel e um domínio próprio, e um valor
// errado aqui manda o cliente configurar o servidor dele apontando pro nada.
const APP_HOST = process.env.NEXT_PUBLIC_APP_HOST || "profitxengine-one.vercel.app";

const ABAS = [
  { key: "posts", label: "Posts" },
  { key: "dominios", label: "Domínios" },
] as const;
type Aba = (typeof ABAS)[number]["key"];

export function BlogClient({ productId }: { productId: string }) {
  const [aba, setAba] = useState<Aba>("posts");
  const [dominios, setDominios] = useState<BlogDominio[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/blog/dominios?product_id=${productId}`).then((r) => r.json()),
      fetch(`/api/blog/posts?product_id=${productId}`).then((r) => r.json()),
    ])
      .then(([d, p]) => {
        setDominios(d.dominios ?? []);
        setPosts(p.posts ?? []);
      })
      .finally(() => setCarregando(false));
  }, [productId]);

  if (carregando) return <Card className="p-5 text-sm text-text-secondary">Carregando…</Card>;

  return (
    <div className="space-y-6">
      <SubTabs tabs={ABAS} active={aba} onChange={setAba} />
      {aba === "posts" ? (
        <PainelPosts productId={productId} dominios={dominios} posts={posts} setPosts={setPosts} />
      ) : (
        <PainelDominios productId={productId} dominios={dominios} setDominios={setDominios} />
      )}
    </div>
  );
}

/* ------------------------------ posts ------------------------------ */

function PainelPosts({
  productId,
  dominios,
  posts,
  setPosts,
}: {
  productId: string;
  dominios: BlogDominio[];
  posts: BlogPost[];
  setPosts: React.Dispatch<React.SetStateAction<BlogPost[]>>;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [tema, setTema] = useState("");
  const [slug, setSlug] = useState("");
  const [dominioId, setDominioId] = useState<string>(dominios[0]?.id ?? "");
  const [comImagem, setComImagem] = useState(true);
  const [etapa, setEtapa] = useState<null | "texto" | "imagem">(null);
  const [aberto, setAberto] = useState<BlogPost | null>(null);

  const nomeDominio = useMemo(
    () => Object.fromEntries(dominios.map((d) => [d.id, d.nome || d.dominio])),
    [dominios]
  );

  async function gerar() {
    if (!tema.trim() && !slug.trim()) {
      toast.error("Preencha o tema ou a slug.");
      return;
    }

    setEtapa("texto");
    const res = await fetch("/api/blog/gerar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, dominio_id: dominioId || null, tema, slug }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.post) {
      setEtapa(null);
      toast.error(json?.error ?? "Falha ao gerar o post.");
      return;
    }

    let post: BlogPost = json.post;
    setPosts((prev) => [post, ...prev]);
    setTema("");
    setSlug("");

    // A imagem entra depois e não derruba o post: se ela falhar, o texto já
    // está salvo e dá pra gerar a capa de novo pelo editor.
    if (comImagem && typeof json.imagem_prompt === "string") {
      setEtapa("imagem");
      const img = await gerarImagem(json.imagem_prompt);
      if (img) {
        const salvo = await salvarPost(post.id, { imagem_url: img });
        if (salvo) {
          post = salvo;
          setPosts((prev) => prev.map((p) => (p.id === salvo.id ? salvo : p)));
        }
      } else {
        toast.error("O texto ficou pronto, mas a imagem falhou. Dá pra gerar de novo no editor.");
      }
    }

    setEtapa(null);
    setAberto(post);
    toast.success("Post gerado.");
  }

  async function excluir(post: BlogPost) {
    const ok = await confirm({
      title: `Excluir "${post.titulo}"?`,
      description: "O texto e os dados de SEO somem. A imagem continua na Biblioteca de Imagens.",
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/blog/posts/${post.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Falha ao excluir.");
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
  }

  const ocupado = etapa !== null;

  return (
    <>
      <Card className="p-5">
        <div className="mb-1 flex items-center gap-1.5">
          <h3 className="text-base font-semibold text-text-primary">Gerar post</h3>
          <Tooltip text="Entregue o tema em linguagem normal, ou só a slug quando a URL já está decidida. Com a slug, ela é convertida em frase e o post é escrito para aquela página." />
        </div>
        <p className="mb-4 text-xs text-text-secondary">
          Preencha um dos dois. O domínio escolhido define idioma, público e tom de voz do texto.
        </p>

        <div className="space-y-4">
          {/* Tema e slug sao alternativas um do outro: mesma largura, lado a
              lado, pra ficar visivel que se preenche UM dos dois. */}
          <ContentGrid>
            <Field label="Tema" span={6}>
              <Input
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                disabled={ocupado}
                placeholder="Como declarar cripto no imposto de renda"
              />
            </Field>
            <Field label="Ou a slug" hint="(a URL já decidida)" span={6}>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                onBlur={() => setSlug((s) => (s ? gerarSlug(s) : s))}
                disabled={ocupado}
                placeholder="como-declarar-cripto-no-imposto-de-renda"
              />
            </Field>

            <Field label="Domínio" span={4}>
              <Select value={dominioId} onChange={(e) => setDominioId(e.target.value)} disabled={ocupado}>
                <option value="">Sem domínio definido</option>
                {dominios.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome || d.dominio}
                  </option>
                ))}
              </Select>
            </Field>
          </ContentGrid>

          <div className="flex flex-wrap items-center gap-4">
            <Button onClick={gerar} disabled={ocupado}>
              {etapa === "texto" ? "Escrevendo…" : etapa === "imagem" ? "Gerando a capa…" : "Gerar post"}
            </Button>
            <label className="flex items-center gap-2 text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={comImagem}
                onChange={(e) => setComImagem(e.target.checked)}
                disabled={ocupado}
                className="h-3.5 w-3.5 accent-accent"
              />
              Gerar imagem de capa
            </label>
          </div>

          {dominios.length === 0 && (
            <p className="text-[11px] text-warning">
              Nenhum domínio cadastrado ainda. Dá pra gerar assim mesmo, mas o texto sai sem contexto de público
              e tom — cadastre na aba Domínios.
            </p>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 text-base font-semibold text-text-primary">
          Posts {posts.length > 0 && <span className="text-text-muted">({posts.length})</span>}
        </h3>

        {posts.length === 0 ? (
          <EmptyState
            titulo="Nenhum post gerado ainda"
            descricao="Preencha o tema ali em cima e gere o primeiro. Ele nasce como rascunho — nada vai pro ar sem você marcar como publicado."
          />
        ) : (
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
            {posts.map((post) => (
              <div key={post.id} className="flex items-start gap-3 rounded-xl bg-card-hover p-3">
                {post.imagem_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.imagem_url}
                    alt={post.imagem_alt ?? ""}
                    className="h-14 w-20 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-card text-[10px] text-text-muted">
                    sem capa
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium text-text-primary">{post.titulo}</span>
                    <Badge tone={post.status === "publicado" ? "success" : "neutral"}>
                      {post.status === "publicado" ? "publicado" : "rascunho"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-text-muted">
                    {post.dominio_id ? `${nomeDominio[post.dominio_id] ?? "?"} · ` : ""}
                    /{post.slug}
                  </p>
                  <p className="mt-0.5 text-[11px] text-text-muted/70">
                    {contarPalavras(post.conteudo_md)} palavras
                    {post.palavra_chave && ` · ${post.palavra_chave}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setAberto(post)}>
                    Abrir
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => excluir(post)}>
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {aberto && (
        <EditorPost
          post={aberto}
          dominios={dominios}
          onFechar={() => setAberto(null)}
          onSalvo={(p) => {
            setPosts((prev) => prev.map((x) => (x.id === p.id ? p : x)));
            setAberto(p);
          }}
        />
      )}
    </>
  );
}

async function gerarImagem(prompt: string): Promise<string | null> {
  const res = await fetch("/api/ai/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ module: "imagem", prompt, aspectRatio: "16:9", quality: "medium" }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) return null;
  return typeof json?.url === "string" ? json.url : typeof json?.imageUrl === "string" ? json.imageUrl : null;
}

async function salvarPost(id: string, campos: Record<string, unknown>): Promise<BlogPost | null> {
  const res = await fetch(`/api/blog/posts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(campos),
  });
  const json = await res.json().catch(() => null);
  return res.ok && json?.post ? (json.post as BlogPost) : null;
}

/**
 * O post depois de gerado: tudo editável à mão.
 *
 * O que a IA entrega é rascunho, não resultado final — então o texto abre num
 * editor de verdade (com uma prévia do que vai pro ar, porque Markdown cru
 * não mostra o que a página vai parecer) e a capa deixa de ser uma imagem
 * pregada no post: dá pra mexer no prompt e gerar de novo, mandar outra do
 * computador, apontar uma URL, jogar a imagem pro meio do texto ou tirar.
 */
function EditorPost({
  post,
  dominios,
  onFechar,
  onSalvo,
}: {
  post: BlogPost;
  dominios: BlogDominio[];
  onFechar: () => void;
  onSalvo: (p: BlogPost) => void;
}) {
  const toast = useToast();
  const textoRef = useRef<HTMLTextAreaElement>(null);
  const [campos, setCampos] = useState({
    titulo: post.titulo,
    slug: post.slug,
    meta_descricao: post.meta_descricao ?? "",
    palavra_chave: post.palavra_chave ?? "",
    conteudo_md: post.conteudo_md,
    dominio_id: post.dominio_id ?? "",
    imagem_alt: post.imagem_alt ?? "",
    imagem_prompt: post.imagem_prompt ?? "",
  });
  const [salvando, setSalvando] = useState(false);
  const [modo, setModo] = useState<"editar" | "visualizar">("editar");
  const [anterior, setAnterior] = useState<string | null>(null);

  function set<K extends keyof typeof campos>(k: K, v: string) {
    setCampos((prev) => ({ ...prev, [k]: v }));
  }

  async function salvar(status?: "rascunho" | "publicado") {
    setSalvando(true);
    const p = await salvarPost(post.id, {
      ...campos,
      dominio_id: campos.dominio_id || null,
      ...(status ? { status } : {}),
    });
    setSalvando(false);
    if (!p) {
      toast.error("Falha ao salvar.");
      return;
    }
    onSalvo(p);
    toast.success(status === "publicado" ? "Post marcado como publicado." : "Salvo.");
  }

  /**
   * Trocar a imagem grava na hora, sem esperar o botão Salvar.
   *
   * Gerar custa dinheiro e enviar arquivo sobe byte: fechar o modal depois
   * disso e perder a imagem seria perder trabalho já pago. O texto continua
   * no fluxo normal de salvar.
   */
  async function aplicarImagem(url: string | null) {
    setAnterior(post.imagem_url);
    const p = await salvarPost(post.id, {
      imagem_url: url,
      imagem_alt: campos.imagem_alt || null,
      imagem_prompt: campos.imagem_prompt || null,
    });
    if (!p) {
      toast.error("A imagem não foi salva no post.");
      return;
    }
    onSalvo(p);
  }

  /** Joga a capa pro meio do texto, onde o cursor estiver. */
  function inserirNoTexto(url: string) {
    const el = textoRef.current;
    const texto = campos.conteudo_md;
    const pos = el && el.selectionStart > 0 ? el.selectionStart : texto.length;
    const marcacao = `![${campos.imagem_alt || ""}](${url})`;
    const novo = `${texto.slice(0, pos).replace(/\s+$/, "")}\n\n${marcacao}\n\n${texto.slice(pos).replace(/^\s+/, "")}`;
    set("conteudo_md", novo);
    setModo("editar");
    toast.success("Imagem colocada no texto — clique em Salvar pra valer.");
  }

  // Limites do Google: título some no resultado acima de ~60, descrição
  // acima de ~158. Mostrar a contagem evita descobrir isso depois de
  // publicado.
  const tituloLongo = campos.titulo.length > 60;
  const metaFora =
    campos.meta_descricao.length > 0 && (campos.meta_descricao.length < 140 || campos.meta_descricao.length > 158);

  return (
    <Modal open onClose={onFechar} title="Editar post" className="max-w-3xl">
      <div className="space-y-3">
        <PainelCapa
          post={post}
          prompt={campos.imagem_prompt}
          alt={campos.imagem_alt}
          anterior={anterior}
          onPrompt={(v) => set("imagem_prompt", v)}
          onAlt={(v) => set("imagem_alt", v)}
          onImagem={aplicarImagem}
          onInserirNoTexto={inserirNoTexto}
        />

        <div>
          <label className="mb-1 flex items-center justify-between text-[11px] font-medium text-text-secondary">
            <span>Título</span>
            <span className={tituloLongo ? "text-warning" : ""}>{campos.titulo.length}/60</span>
          </label>
          <Input value={campos.titulo} onChange={(e) => set("titulo", e.target.value)} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-text-secondary">Slug</label>
            <Input
              value={campos.slug}
              onChange={(e) => set("slug", e.target.value)}
              onBlur={() => set("slug", gerarSlug(campos.slug))}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-text-secondary">Domínio</label>
            <Select value={campos.dominio_id} onChange={(e) => set("dominio_id", e.target.value)}>
              <option value="">Sem domínio definido</option>
              {dominios.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome || d.dominio}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <label className="mb-1 flex items-center justify-between text-[11px] font-medium text-text-secondary">
            <span>Meta descrição</span>
            <span className={metaFora ? "text-warning" : ""}>{campos.meta_descricao.length}/158</span>
          </label>
          <Textarea rows={2} value={campos.meta_descricao} onChange={(e) => set("meta_descricao", e.target.value)} />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-text-secondary">Palavra-chave</label>
          <Input value={campos.palavra_chave} onChange={(e) => set("palavra_chave", e.target.value)} />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className="text-[11px] font-medium text-text-secondary">Conteúdo (Markdown)</label>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-text-muted">{contarPalavras(campos.conteudo_md)} palavras</span>
              {/* Markdown cru não mostra o que a página vai parecer, e é nela
                  que o texto vai ser lido. */}
              <div className="flex overflow-hidden rounded-button border border-border">
                {(["editar", "visualizar"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModo(m)}
                    className={
                      modo === m
                        ? "bg-card-hover px-2 py-0.5 text-[11px] font-medium text-text-primary"
                        : "px-2 py-0.5 text-[11px] text-text-tertiary hover:text-text-primary"
                    }
                  >
                    {m === "editar" ? "Editar" : "Visualizar"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {modo === "editar" ? (
            <Textarea
              ref={textoRef}
              rows={16}
              value={campos.conteudo_md}
              onChange={(e) => set("conteudo_md", e.target.value)}
              className="font-mono text-xs"
            />
          ) : (
            <div
              className="max-h-[460px] overflow-y-auto rounded-input border border-border bg-input p-4 text-[13px] leading-relaxed text-text-secondary [&_a]:text-accent-text [&_blockquote]:border-l-2 [&_blockquote]:border-border-strong [&_blockquote]:pl-3 [&_blockquote]:text-text-tertiary [&_code]:rounded [&_code]:bg-card-hover [&_code]:px-1 [&_figcaption]:mt-1 [&_figcaption]:text-center [&_figcaption]:text-[11px] [&_figcaption]:text-text-tertiary [&_figure]:my-3 [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-[15px] [&_h2]:font-semibold [&_h2]:text-text-primary [&_h3]:mb-1.5 [&_h3]:mt-3 [&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:text-text-primary [&_img]:rounded-card [&_li]:mb-1 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_strong]:text-text-primary [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: markdownParaHtml(campos.conteudo_md) }}
            />
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onFechar}>
            Fechar
          </Button>
          <Button variant="secondary" onClick={() => salvar()} disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar"}
          </Button>
          <Button onClick={() => salvar("publicado")} disabled={salvando}>
            Salvar e marcar como publicado
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * A capa do post, com as rédeas na mão.
 *
 * O prompt fica visível e editável porque é ele que decide a imagem: sem ele
 * à vista, "gerar de novo" é jogar a mesma moeda pra cima e torcer. Com ele,
 * muda-se uma palavra e vê-se o efeito.
 */
function PainelCapa({
  post,
  prompt,
  alt,
  anterior,
  onPrompt,
  onAlt,
  onImagem,
  onInserirNoTexto,
}: {
  post: BlogPost;
  prompt: string;
  alt: string;
  anterior: string | null;
  onPrompt: (v: string) => void;
  onAlt: (v: string) => void;
  onImagem: (url: string | null) => Promise<void>;
  onInserirNoTexto: (url: string) => void;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const arquivoRef = useRef<HTMLInputElement>(null);
  const [ocupado, setOcupado] = useState<null | "gerando" | "enviando">(null);
  const [urlAberta, setUrlAberta] = useState(false);
  const [url, setUrl] = useState("");

  async function gerarDeNovo() {
    if (!prompt.trim()) {
      toast.error("Escreva o prompt da imagem primeiro.");
      return;
    }
    setOcupado("gerando");
    const nova = await gerarImagem(prompt.trim());
    if (!nova) {
      setOcupado(null);
      toast.error("A imagem não foi gerada. Tente de novo ou ajuste o prompt.");
      return;
    }
    await onImagem(nova);
    setOcupado(null);
    toast.success("Capa nova.");
  }

  async function enviarArquivo(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Só imagem.");
      return;
    }
    setOcupado("enviando");
    const supabase = createClient();
    const caminho = `${post.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const { error } = await supabase.storage.from("blog-images").upload(caminho, file);
    if (error) {
      setOcupado(null);
      toast.error("Falha ao enviar a imagem.");
      return;
    }
    const { data } = supabase.storage.from("blog-images").getPublicUrl(caminho);
    await onImagem(data.publicUrl);
    setOcupado(null);
    toast.success("Capa trocada.");
  }

  async function remover() {
    const ok = await confirm({
      title: "Tirar a capa",
      description: "O post fica sem imagem de capa. O texto e o prompt continuam aqui.",
      confirmLabel: "Tirar",
      danger: true,
    });
    if (!ok) return;
    await onImagem(null);
  }

  const travado = ocupado !== null;

  return (
    <div className="rounded-card border border-border bg-card-hover/40 p-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="sm:w-56 sm:shrink-0">
          {post.imagem_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.imagem_url}
              alt={post.imagem_alt ?? ""}
              className="aspect-video w-full rounded-card object-cover"
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-card border border-dashed border-border text-[11px] text-text-muted">
              sem capa
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-[11px] font-medium text-text-secondary">
            Prompt da imagem <span className="text-text-muted/70">(em inglês funciona melhor)</span>
          </label>
          <Textarea
            rows={3}
            value={prompt}
            onChange={(e) => onPrompt(e.target.value)}
            placeholder="editorial cover photo, natural light, no text, no logo"
            className="text-xs"
          />

          <label className="mb-1 mt-2 block text-[11px] font-medium text-text-secondary">
            Texto alternativo <span className="text-text-muted/70">(o que o Google e o leitor de tela leem)</span>
          </label>
          <Input value={alt} onChange={(e) => onAlt(e.target.value)} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Button size="sm" onClick={gerarDeNovo} disabled={travado}>
          {ocupado === "gerando" ? "Gerando…" : post.imagem_url ? "Gerar de novo" : "Gerar capa"}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => arquivoRef.current?.click()} disabled={travado}>
          {ocupado === "enviando" ? "Enviando…" : "Enviar do computador"}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setUrlAberta((v) => !v)} disabled={travado}>
          Usar uma URL
        </Button>
        {post.imagem_url && (
          <>
            <Button size="sm" variant="ghost" onClick={() => onInserirNoTexto(post.imagem_url!)} disabled={travado}>
              Colocar no texto
            </Button>
            <Button size="sm" variant="ghost" onClick={remover} disabled={travado}>
              Tirar capa
            </Button>
          </>
        )}
        {anterior && anterior !== post.imagem_url && (
          // Gerar de novo é jogada de dado: a imagem anterior pode ser melhor
          // que a nova, e sem isso ela estaria perdida.
          <Button size="sm" variant="ghost" onClick={() => onImagem(anterior)} disabled={travado}>
            Voltar pra anterior
          </Button>
        )}
      </div>

      {urlAberta && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="min-w-0 flex-1"
          />
          <Button
            size="sm"
            variant="secondary"
            disabled={!/^https?:\/\//.test(url.trim()) || travado}
            onClick={async () => {
              await onImagem(url.trim());
              setUrl("");
              setUrlAberta(false);
            }}
          >
            Usar
          </Button>
        </div>
      )}

      <input
        ref={arquivoRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) enviarArquivo(file);
        }}
      />
    </div>
  );
}


/* ----------------------------- domínios ----------------------------- */

function PainelDominios({
  productId,
  dominios,
  setDominios,
}: {
  productId: string;
  dominios: BlogDominio[];
  setDominios: React.Dispatch<React.SetStateAction<BlogDominio[]>>;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [criando, setCriando] = useState(false);
  const [verificando, setVerificando] = useState<string | null>(null);

  async function verificar(d: BlogDominio) {
    setVerificando(d.id);
    const res = await fetch(`/api/blog/dominios/${d.id}/verificar`, { method: "POST" });
    setVerificando(null);
    const json = await res.json().catch(() => null);
    if (json?.verificado && json.dominio) {
      setDominios((prev) => prev.map((x) => (x.id === d.id ? json.dominio : x)));
      toast.success("Domínio verificado.");
      return;
    }
    toast.error(json?.erro ?? "Não foi possível verificar.");
  }

  async function excluir(d: BlogDominio) {
    const ok = await confirm({
      title: `Excluir ${d.dominio}?`,
      description: "Os posts feitos para ele continuam guardados, mas ficam sem domínio.",
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/blog/dominios/${d.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Falha ao excluir.");
      return;
    }
    setDominios((prev) => prev.filter((x) => x.id !== d.id));
  }

  return (
    <Card className="p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <h3 className="text-base font-semibold text-text-primary">Domínios</h3>
          <Tooltip text="Cada domínio guarda o contexto que entra no prompt (idioma, público, tom) e prova de posse por registro TXT — a mesma prova que o Google Search Console pede." />
        </div>
        <Button size="sm" onClick={() => setCriando(true)}>
          Novo domínio
        </Button>
      </div>
      <p className="mb-4 text-xs text-text-secondary">
        Onde os posts vão morar. A verificação por DNS prova que o domínio é seu antes de publicar nele.
      </p>

      {dominios.length === 0 ? (
        <EmptyState
          titulo="Nenhum domínio cadastrado"
          descricao="O domínio guarda idioma, público e tom de voz — e o post sai com essa voz. Sem ele, o texto sai genérico."
          acao={<Button onClick={() => setCriando(true)}>Cadastrar domínio</Button>}
        />
      ) : (
        <div className="space-y-2">
          {dominios.map((d) => (
            <div key={d.id} className="rounded-xl bg-card-hover p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">{d.nome || d.dominio}</span>
                    <Badge tone={d.verificado ? "success" : "warning"}>
                      {d.verificado ? "verificado" : "não verificado"}
                    </Badge>
                    <Badge tone="neutral">{d.modo === "subdiretorio" ? "subdiretório" : "subdomínio"}</Badge>
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-text-muted">
                    {d.dominio}
                    {d.caminho} · {d.idioma}
                  </p>
                  {(d.publico_alvo || d.tom) && (
                    <p className="mt-0.5 text-[11px] text-text-muted/70">
                      {[d.publico_alvo, d.tom].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!d.verificado && (
                    <Button size="sm" variant="secondary" onClick={() => verificar(d)} disabled={verificando === d.id}>
                      {verificando === d.id ? "Checando…" : "Verificar"}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => excluir(d)}>
                    Excluir
                  </Button>
                </div>
              </div>

              {!d.verificado && (
                <Bloco titulo="1. Prove que o domínio é seu — crie este TXT no DNS e clique em Verificar">
                  <Linha rotulo="Nome" valor={nomeRegistroTxt(d.dominio)} />
                  <Linha rotulo="Valor" valor={d.token_verificacao} />
                </Bloco>
              )}

              <Bloco
                titulo={
                  d.modo === "subdiretorio"
                    ? `${d.verificado ? "" : "2. "}Aponte ${d.dominio}${d.caminho} pra cá no servidor do site`
                    : `${d.verificado ? "" : "2. "}Aponte ${d.dominio} pra cá no DNS`
                }
              >
                {d.modo === "subdiretorio" ? (
                  <>
                    <p className="mb-2 text-[11px] text-text-secondary">
                      No nginx do site, dentro do server do domínio:
                    </p>
                    <pre className="overflow-x-auto whitespace-pre rounded bg-app p-2 font-mono text-[11px] text-text-primary">
{`location ${d.caminho}/ {
  proxy_pass https://${APP_HOST}/blog-publico/${d.dominio}/;
  proxy_set_header Host ${APP_HOST};
}`}
                    </pre>
                  </>
                ) : (
                  <>
                    <p className="mb-2 text-[11px] text-text-secondary">Registro CNAME no DNS:</p>
                    <Linha rotulo="Nome" valor={d.dominio} />
                    <Linha rotulo="Aponta para" valor={APP_HOST} />
                    <p className="mt-2 text-[11px] text-warning">
                      Esse domínio também precisa ser adicionado no projeto da Vercel, senão ela responde antes
                      de chegar aqui.
                    </p>
                  </>
                )}
              </Bloco>
            </div>
          ))}
        </div>
      )}

      {criando && (
        <FormularioDominio
          productId={productId}
          onFechar={() => setCriando(false)}
          onSalvo={(d) => {
            setDominios((prev) => [...prev, d]);
            setCriando(false);
          }}
        />
      )}
    </Card>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-lg bg-card p-3">
      <p className="mb-2 text-[11px] font-medium text-text-secondary">{titulo}</p>
      {children}
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <p className="break-all font-mono text-[11px]">
      <span className="text-text-muted">{rotulo}: </span>
      <span className="text-text-primary">{valor}</span>
    </p>
  );
}

function FormularioDominio({
  productId,
  onFechar,
  onSalvo,
}: {
  productId: string;
  onFechar: () => void;
  onSalvo: (d: BlogDominio) => void;
}) {
  const toast = useToast();
  const [campos, setCampos] = useState({
    dominio: "",
    nome: "",
    modo: "subdiretorio" as ModoBlog,
    caminho: "/blog",
    idioma: "pt-BR",
    publico_alvo: "",
    tom: "",
  });
  const [salvando, setSalvando] = useState(false);

  function set<K extends keyof typeof campos>(k: K, v: (typeof campos)[K]) {
    setCampos((prev) => ({ ...prev, [k]: v }));
  }

  async function salvar() {
    setSalvando(true);
    const res = await fetch("/api/blog/dominios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...campos, product_id: productId }),
    });
    setSalvando(false);
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.dominio) {
      toast.error(json?.error ?? "Falha ao salvar.");
      return;
    }
    onSalvo(json.dominio);
  }

  return (
    <Modal open onClose={onFechar} title="Novo domínio">
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-text-secondary">Domínio</label>
            <Input value={campos.dominio} onChange={(e) => set("dominio", e.target.value)} placeholder="escolaprofitx.com" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-text-secondary">
              Nome <span className="text-text-muted/70">(opcional)</span>
            </label>
            <Input value={campos.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Escola ProfitX" />
          </div>
        </div>

        <div>
          <label className="mb-1 flex items-center gap-1 text-[11px] font-medium text-text-secondary">
            Como o blog chega no site
            <Tooltip text="Subdiretório concentra a autoridade no domínio principal, mas exige mexer no servidor do site. Subdomínio só precisa de um CNAME, e o Google trata o conteúdo como site vizinho. Use subdiretório onde você controla o servidor." />
          </label>
          <Select value={campos.modo} onChange={(e) => set("modo", e.target.value as ModoBlog)}>
            {MODOS.map((m) => (
              <option key={m} value={m}>
                {MODO_LABEL[m]}
              </option>
            ))}
          </Select>
          <p className="mt-1 text-[11px] text-text-muted/70">
            {campos.modo === "subdiretorio"
              ? "Você vai colar um bloco no nginx do site. Melhor pro Google."
              : "Você vai criar um CNAME. Mais fácil, mas o conteúdo não soma no domínio principal."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-text-secondary">
              {campos.modo === "subdiretorio" ? "Caminho do blog" : "Caminho (deixe / no subdomínio)"}
            </label>
            <Input value={campos.caminho} onChange={(e) => set("caminho", e.target.value)} placeholder="/blog" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-text-secondary">Idioma</label>
            <Input value={campos.idioma} onChange={(e) => set("idioma", e.target.value)} placeholder="pt-BR" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-text-secondary">
            Quem lê <span className="text-text-muted/70">(entra no prompt)</span>
          </label>
          <Input
            value={campos.publico_alvo}
            onChange={(e) => set("publico_alvo", e.target.value)}
            placeholder="Iniciantes em trading, entre 25 e 45 anos, que nunca operaram"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-text-secondary">
            Tom de voz <span className="text-text-muted/70">(entra no prompt)</span>
          </label>
          <Input value={campos.tom} onChange={(e) => set("tom", e.target.value)} placeholder="Direto, sem jargão, sem promessa de ganho" />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onFechar}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
