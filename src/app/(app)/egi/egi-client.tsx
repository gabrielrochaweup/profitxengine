"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowUp, BookOpen, Check, MessagesSquare, PanelLeft, Pencil, Plus, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { AvatarDaEgi, BolhaDoUsuario, RespostaDaEgi, type Mensagem } from "./mensagem";
import { FaqPanel, type ItemFaq } from "./faq-panel";

interface Conversa {
  id: string;
  titulo: string;
  created_at: string;
  updated_at: string;
}

type Aba = "conversas" | "faq";

// Exemplos da tela vazia: mostram o jeito certo de usar — colar a pergunta
// do aluno como ele escreveu, não resumir.
const EXEMPLOS = [
  "Comprei ontem e até agora não recebi o acesso da plataforma",
  "O que é o rollover da corretora? Não consigo sacar",
  "Já faz um mês e não tive resultado nenhum, isso não funciona",
];

function quando(iso: string): string {
  const d = new Date(iso);
  const hoje = new Date();
  if (d.toDateString() === hoje.toDateString()) {
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function EgiClient({
  productId,
  conversasIniciais,
  faqInicial,
}: {
  productId: string;
  conversasIniciais: Conversa[];
  faqInicial: ItemFaq[];
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [aba, setAba] = useState<Aba>("conversas");
  const [conversas, setConversas] = useState<Conversa[]>(conversasIniciais);
  const [ativaId, setAtivaId] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [carregandoMensagens, setCarregandoMensagens] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pendente, setPendente] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [renomeandoId, setRenomeandoId] = useState<string | null>(null);
  const [tituloRascunho, setTituloRascunho] = useState("");
  const [listaAberta, setListaAberta] = useState(false);
  const [faq, setFaq] = useState<ItemFaq[]>(faqInicial);
  const fimRef = useRef<HTMLDivElement>(null);
  const campoRef = useRef<HTMLTextAreaElement>(null);

  const ativa = conversas.find((c) => c.id === ativaId) ?? null;

  // Abre a conversa: as mensagens vêm do banco (o RLS só devolve as da
  // própria pessoa).
  useEffect(() => {
    if (!ativaId) {
      setMensagens([]);
      return;
    }
    let vivo = true;
    setCarregandoMensagens(true);
    createClient()
      .from("egi_mensagens")
      .select("id, papel, conteudo, faq_id, created_at")
      .eq("conversa_id", ativaId)
      .order("created_at")
      .then(({ data }) => {
        if (!vivo) return;
        setMensagens((data as Mensagem[]) ?? []);
        setCarregandoMensagens(false);
      });
    return () => {
      vivo = false;
    };
  }, [ativaId]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensagens, pendente]);

  // O campo cresce com o texto até um teto — pergunta de aluno às vezes é
  // um parágrafo inteiro colado.
  useEffect(() => {
    const campo = campoRef.current;
    if (!campo) return;
    campo.style.height = "auto";
    campo.style.height = `${Math.min(campo.scrollHeight, 220)}px`;
  }, [texto]);

  function novaConversa() {
    setAba("conversas");
    setAtivaId(null);
    setErro(null);
    setListaAberta(false);
    setTimeout(() => campoRef.current?.focus(), 0);
  }

  async function enviar(conteudo?: string) {
    const mensagem = (conteudo ?? texto).trim();
    if (!mensagem || enviando) return;
    setEnviando(true);
    setErro(null);
    setPendente(mensagem);
    setTexto("");

    const res = await fetch("/api/egi/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversaId: ativaId, mensagem }),
    });
    const json = await res.json().catch(() => null);
    setEnviando(false);
    setPendente(null);

    if (!res.ok || !json?.conversa) {
      // Nada foi gravado: devolve o texto pro campo pra tentar de novo.
      setErro(json?.error ?? "A Egi não conseguiu responder. Tente de novo.");
      setTexto(mensagem);
      return;
    }

    const conversa = json.conversa as Conversa;
    setConversas((prev) => [conversa, ...prev.filter((c) => c.id !== conversa.id)]);
    if (ativaId !== conversa.id) {
      // Conversa nova: já mostra as duas mensagens; o efeito de abrir busca
      // do banco em seguida e confirma o mesmo conteúdo.
      setMensagens(json.mensagens as Mensagem[]);
      setAtivaId(conversa.id);
    } else {
      setMensagens((prev) => [...prev, ...(json.mensagens as Mensagem[])]);
    }
  }

  function aoTeclar(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  }

  async function salvarNoFaq(mensagem: Mensagem) {
    const res = await fetch("/api/egi/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensagemId: mensagem.id }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.faqId) {
      toast.error(json?.error ?? "Falha ao salvar no FAQ.");
      return;
    }
    setMensagens((prev) => prev.map((m) => (m.id === mensagem.id ? { ...m, faq_id: json.faqId } : m)));
    if (!json.jaSalva) {
      const anterior = [...mensagens].reverse().find((m) => m.papel === "user" && m.created_at < mensagem.created_at);
      const agora = new Date().toISOString();
      setFaq((prev) => [
        { id: json.faqId, pergunta: anterior?.conteudo ?? "", resposta: mensagem.conteudo, created_at: agora, updated_at: agora },
        ...prev,
      ]);
      toast.success("Salva no FAQ — a Egi passa a usar essa resposta como referência.");
    }
  }

  async function renomear(conversa: Conversa) {
    const titulo = tituloRascunho.trim();
    setRenomeandoId(null);
    if (!titulo || titulo === conversa.titulo) return;
    const { error } = await createClient().from("egi_conversas").update({ titulo }).eq("id", conversa.id);
    if (error) {
      toast.error("Falha ao renomear.");
      return;
    }
    setConversas((prev) => prev.map((c) => (c.id === conversa.id ? { ...c, titulo } : c)));
  }

  async function excluir(conversa: Conversa) {
    const ok = await confirm({
      title: "Excluir conversa",
      description: `Excluir "${conversa.titulo}"? As mensagens somem; o que já foi salvo no FAQ continua lá.`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const { error } = await createClient().from("egi_conversas").delete().eq("id", conversa.id);
    if (error) {
      toast.error("Falha ao excluir.");
      return;
    }
    setConversas((prev) => prev.filter((c) => c.id !== conversa.id));
    if (ativaId === conversa.id) setAtivaId(null);
  }

  const vazia = !ativaId && !pendente;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Cabeçalho: quem é a Egi + as duas abas */}
      <div className="flex flex-wrap items-center gap-3">
        <AvatarDaEgi className="h-9 w-9" />
        <div className="min-w-0">
          <h1 className="text-[18px] font-semibold leading-tight text-text-primary">Egi — IA</h1>
          <p className="text-[12px] text-text-tertiary">Respostas de atendimento com base no manual da ProfitX</p>
        </div>
        <div role="radiogroup" className="ml-auto inline-flex rounded-xl bg-input p-1">
          {(
            [
              { key: "conversas", label: "Conversas", icone: MessagesSquare },
              { key: "faq", label: `FAQ${faq.length ? ` · ${faq.length}` : ""}`, icone: BookOpen },
            ] as const
          ).map(({ key, label, icone: Icone }) => (
            <button
              key={key}
              type="button"
              onClick={() => setAba(key)}
              role="radio"
              aria-checked={aba === key}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium transition-colors",
                aba === key ? "bg-card text-text-primary shadow-card" : "text-text-tertiary hover:text-text-secondary"
              )}
            >
              <Icone size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-card bg-card shadow-card">
        {aba === "faq" ? (
          <div className="min-w-0 flex-1">
            <FaqPanel productId={productId} itens={faq} setItens={setFaq} />
          </div>
        ) : (
          <>
            {/* Lista de conversas: fixa no desktop, gaveta no celular */}
            {listaAberta && (
              <div className="absolute inset-0 z-10 bg-black/40 md:hidden" onClick={() => setListaAberta(false)} />
            )}
            <aside
              className={cn(
                "z-20 flex w-72 shrink-0 flex-col border-r border-border bg-card",
                "absolute inset-y-0 left-0 transition-transform md:static md:translate-x-0",
                listaAberta ? "translate-x-0" : "-translate-x-full"
              )}
            >
              <div className="border-b border-border p-3">
                <Button className="w-full" onClick={novaConversa}>
                  <Plus size={15} />
                  Nova conversa
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {conversas.length === 0 ? (
                  <p className="px-3 py-6 text-center text-[12px] text-text-tertiary">
                    Suas conversas com a Egi aparecem aqui. Só você vê as suas.
                  </p>
                ) : (
                  conversas.map((c) => {
                    const selecionada = c.id === ativaId;
                    return (
                      <div
                        key={c.id}
                        className={cn(
                          "group mb-0.5 flex items-center gap-1 rounded-button pr-1 transition-colors",
                          selecionada ? "bg-card-hover" : "hover:bg-card-hover"
                        )}
                      >
                        {renomeandoId === c.id ? (
                          <form
                            className="flex flex-1 items-center gap-1 py-1 pl-1"
                            onSubmit={(e) => {
                              e.preventDefault();
                              renomear(c);
                            }}
                          >
                            <Input
                              value={tituloRascunho}
                              onChange={(e) => setTituloRascunho(e.target.value)}
                              onKeyDown={(e) => e.key === "Escape" && setRenomeandoId(null)}
                              className="h-7 text-xs"
                              autoFocus
                            />
                            <button type="submit" aria-label="Salvar nome" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-button text-text-tertiary hover:text-text-primary">
                              <Check size={14} />
                            </button>
                            <button type="button" aria-label="Cancelar" onClick={() => setRenomeandoId(null)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-button text-text-tertiary hover:text-text-primary">
                              <X size={14} />
                            </button>
                          </form>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setAtivaId(c.id);
                                setErro(null);
                                setListaAberta(false);
                              }}
                              className="min-w-0 flex-1 px-3 py-2 text-left"
                            >
                              <span className={cn("block truncate text-[13px]", selecionada ? "font-medium text-text-primary" : "text-text-secondary")}>
                                {c.titulo}
                              </span>
                              <span className="block text-[10px] text-text-muted">{quando(c.updated_at)}</span>
                            </button>
                            {/* Renomear e excluir: sempre à vista na conversa
                                aberta e no celular; nas outras, ao passar o
                                mouse. */}
                            <div className={cn("flex shrink-0 items-center", selecionada ? "flex" : "flex md:hidden md:group-hover:flex")}>
                              <button
                                type="button"
                                title="Renomear"
                                aria-label="Renomear conversa"
                                onClick={() => {
                                  setTituloRascunho(c.titulo);
                                  setRenomeandoId(c.id);
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-button text-text-tertiary hover:bg-card hover:text-text-primary"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                title="Excluir"
                                aria-label="Excluir conversa"
                                onClick={() => excluir(c)}
                                className="flex h-7 w-7 items-center justify-center rounded-button text-text-tertiary hover:bg-card hover:text-danger"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </aside>

            {/* Chat */}
            <section className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => setListaAberta(true)}
                  aria-label="Ver conversas"
                  className="flex h-8 w-8 items-center justify-center rounded-button text-text-tertiary hover:bg-card-hover hover:text-text-primary md:hidden"
                >
                  <PanelLeft size={16} />
                </button>
                <p className="truncate text-[13px] font-medium text-text-primary">{ativa?.titulo ?? "Nova conversa"}</p>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {vazia ? (
                  <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
                    <AvatarDaEgi className="mb-4 h-12 w-12" />
                    <p className="text-[18px] font-semibold text-text-primary">Olá! Eu sou a Egi.</p>
                    <p className="mt-1.5 max-w-[52ch] text-[13px] leading-relaxed text-text-secondary">
                      Cole a pergunta do aluno <strong className="text-text-primary">exatamente como ele escreveu</strong>. Eu devolvo a
                      resposta pronta pra enviar, com o nível de alerta e os cuidados — tudo com base no manual de atendimento.
                    </p>
                    <div className="mt-6 flex w-full max-w-xl flex-col gap-2">
                      {EXEMPLOS.map((exemplo) => (
                        <button
                          key={exemplo}
                          type="button"
                          onClick={() => enviar(exemplo)}
                          className="rounded-card border border-border bg-card px-4 py-2.5 text-left text-[13px] text-text-secondary transition-colors hover:border-border-strong hover:bg-card-hover hover:text-text-primary"
                        >
                          “{exemplo}”
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
                    {carregandoMensagens && mensagens.length === 0 ? (
                      <p className="text-center text-[12px] text-text-tertiary">Carregando conversa...</p>
                    ) : (
                      mensagens.map((m) =>
                        m.papel === "user" ? (
                          <BolhaDoUsuario key={m.id} conteudo={m.conteudo} />
                        ) : (
                          <RespostaDaEgi key={m.id} mensagem={m} onSalvarNoFaq={salvarNoFaq} />
                        )
                      )
                    )}
                    {pendente && (
                      <>
                        <BolhaDoUsuario conteudo={pendente} />
                        <div className="flex items-center gap-3">
                          <AvatarDaEgi />
                          <span className="flex items-center gap-1.5 text-[13px] text-text-tertiary">
                            Egi está lendo o manual e escrevendo
                            <span className="flex gap-0.5">
                              {[0, 1, 2].map((i) => (
                                <span
                                  key={i}
                                  className="h-1 w-1 animate-bounce rounded-full bg-text-tertiary"
                                  style={{ animationDelay: `${i * 150}ms` }}
                                />
                              ))}
                            </span>
                          </span>
                        </div>
                      </>
                    )}
                    <div ref={fimRef} />
                  </div>
                )}
              </div>

              {/* Campo de mensagem. O recuo à direita é o espaço do botão de
                  ajuda, que mora no canto de baixo. */}
              <div className="border-t border-border p-3 pr-[3.25rem] xl:pr-3">
                <div className="mx-auto max-w-3xl">
                  {erro && <p className="mb-2 rounded-input bg-danger-soft px-3 py-2 text-[12px] text-danger">{erro}</p>}
                  <div className="flex items-end gap-2 rounded-card border border-border bg-input p-2 transition-colors focus-within:border-accent">
                    <textarea
                      ref={campoRef}
                      value={texto}
                      onChange={(e) => setTexto(e.target.value)}
                      onKeyDown={aoTeclar}
                      rows={1}
                      placeholder="Cole aqui a pergunta do aluno…"
                      disabled={enviando}
                      className="max-h-[220px] min-h-[36px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[14px] text-text-primary outline-none placeholder:text-text-muted disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => enviar()}
                      disabled={!texto.trim() || enviando}
                      aria-label="Enviar"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-button bg-accent text-accent-contrast transition-colors hover:bg-accent-hover disabled:opacity-40"
                    >
                      <ArrowUp size={17} />
                    </button>
                  </div>
                  <p className="mt-1.5 text-center text-[10px] text-text-muted">
                    Enter envia · Shift+Enter quebra linha · Confira sempre o nível de alerta antes de enviar ao aluno
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
