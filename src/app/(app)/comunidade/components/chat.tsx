"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { CornerUpLeft, Pencil, Send, Smile, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";
import {
  diaLegivel,
  horaCurta,
  pedacosDoTexto,
  usePertoDoFim,
  type Mensagem,
  type Pessoa,
  type Reacao,
} from "../lib";

const EMOJIS = ["👍", "🎉", "✅", "👀", "🔥", "❤️"];

// Mensagens seguidas da mesma pessoa em até 5 minutos viram um bloco só: o
// nome e o avatar repetidos a cada linha é o que faz um chat parecer um log.
const JANELA_AGRUPAMENTO_MS = 5 * 60 * 1000;

export function Chat({
  mensagens,
  reacoes,
  pessoas,
  meuId,
  souAdminDaSala,
  temMais,
  carregandoMais,
  onCarregarMais,
  onEnviar,
  onEditar,
  onExcluir,
  onReagir,
  acaoChamada,
}: {
  mensagens: Mensagem[];
  reacoes: Reacao[];
  pessoas: Map<string, Pessoa>;
  meuId: string;
  souAdminDaSala: boolean;
  temMais: boolean;
  carregandoMais: boolean;
  onCarregarMais: () => void;
  onEnviar: (conteudo: string, respondeA: string | null) => Promise<void>;
  onEditar: (id: string, conteudo: string) => Promise<void>;
  onExcluir: (id: string) => Promise<void>;
  onReagir: (mensagemId: string, emoji: string) => Promise<void>;
  /** Entrar/sair da chamada, logo acima do campo de mensagem. */
  acaoChamada?: ReactNode;
}) {
  const confirm = useConfirm();
  const listaRef = useRef<HTMLDivElement>(null);
  const campoRef = useRef<HTMLTextAreaElement>(null);
  const { perto, aoRolar } = usePertoDoFim(listaRef);

  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [respondendo, setRespondendo] = useState<Mensagem | null>(null);
  const [editando, setEditando] = useState<Mensagem | null>(null);
  const [rascunhoEdicao, setRascunhoEdicao] = useState("");
  const [emojiAberto, setEmojiAberto] = useState<string | null>(null);
  const [novasAbaixo, setNovasAbaixo] = useState(0);

  const nomes = useMemo(() => Array.from(pessoas.values()).map((p) => p.nome), [pessoas]);
  const ultimaId = mensagens[mensagens.length - 1]?.id;

  // Auto-scroll com juízo: desce sozinho se a pessoa está no fim da lista;
  // se ela subiu pra ler algo, aparece um aviso em vez de arrancar a tela.
  useEffect(() => {
    const el = listaRef.current;
    if (!el || !ultimaId) return;
    if (perto) {
      el.scrollTop = el.scrollHeight;
      setNovasAbaixo(0);
    } else {
      setNovasAbaixo((n) => n + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ultimaId]);

  function irAoFim() {
    const el = listaRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setNovasAbaixo(0);
  }

  async function enviar() {
    const conteudo = texto.trim();
    if (!conteudo || enviando) return;
    setEnviando(true);
    try {
      await onEnviar(conteudo, respondendo?.id ?? null);
      setTexto("");
      setRespondendo(null);
      requestAnimationFrame(irAoFim);
    } finally {
      setEnviando(false);
    }
  }

  function teclaNoCampo(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter envia, Shift+Enter quebra linha — o que a equipe já espera de
    // qualquer chat.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
    if (e.key === "Escape") {
      setRespondendo(null);
    }
  }

  async function confirmarExclusao(m: Mensagem) {
    const ok = await confirm({
      title: "Excluir mensagem",
      description: "A mensagem some da conversa. Quem respondeu a ela continua com a resposta no lugar.",
      confirmLabel: "Excluir",
      danger: true,
    });
    if (ok) await onExcluir(m.id);
  }

  const reacoesPorMensagem = useMemo(() => {
    const mapa = new Map<string, Map<string, string[]>>();
    for (const r of reacoes) {
      const porEmoji = mapa.get(r.message_id) ?? new Map<string, string[]>();
      porEmoji.set(r.emoji, [...(porEmoji.get(r.emoji) ?? []), r.user_id]);
      mapa.set(r.message_id, porEmoji);
    }
    return mapa;
  }, [reacoes]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={listaRef} onScroll={aoRolar} className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {temMais && (
          <div className="mb-3 flex justify-center">
            <Button size="sm" variant="secondary" onClick={onCarregarMais} disabled={carregandoMais}>
              {carregandoMais ? "Carregando…" : "Carregar mensagens anteriores"}
            </Button>
          </div>
        )}

        {mensagens.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-[14px] font-medium text-text-primary">Nenhuma mensagem ainda</p>
            <p className="mt-1 max-w-[46ch] text-[12px] text-text-tertiary">Comece a conversa.</p>
          </div>
        ) : (
          mensagens.map((m, i) => {
            const anterior = mensagens[i - 1];
            const autor = m.autor_id ? pessoas.get(m.autor_id) : undefined;
            const nome = autor?.nome ?? "Alguém";
            const diaMudou =
              !anterior || new Date(anterior.created_at).toDateString() !== new Date(m.created_at).toDateString();
            const agrupada =
              !diaMudou &&
              anterior?.autor_id === m.autor_id &&
              new Date(m.created_at).getTime() - new Date(anterior.created_at).getTime() < JANELA_AGRUPAMENTO_MS;
            const respondida = m.responde_a ? mensagens.find((x) => x.id === m.responde_a) : null;
            const minhas = m.autor_id === meuId;
            const reacoesDela = reacoesPorMensagem.get(m.id);

            return (
              <div key={m.id}>
                {diaMudou && (
                  <div className="my-3 flex items-center gap-3">
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
                      {diaLegivel(m.created_at)}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                )}

                <div className={cn("group relative flex gap-2.5 rounded-card px-2 hover:bg-card-hover", agrupada ? "py-0.5" : "pt-2 pb-0.5")}>
                  {agrupada ? (
                    <span className="w-7 shrink-0 pt-0.5 text-right text-[10px] text-transparent group-hover:text-text-muted">
                      {horaCurta(m.created_at)}
                    </span>
                  ) : (
                    <Avatar nome={nome} id={m.autor_id ?? "?"} />
                  )}

                  <div className="min-w-0 flex-1">
                    {!agrupada && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-[13px] font-semibold text-text-primary">{nome}</span>
                        <span className="text-[10px] text-text-tertiary">{horaCurta(m.created_at)}</span>
                      </div>
                    )}

                    {respondida && (
                      <div className="mt-0.5 flex items-center gap-1.5 border-l-2 border-border-strong pl-2 text-[11px] text-text-tertiary">
                        <CornerUpLeft size={11} className="shrink-0" />
                        <span className="font-medium text-text-secondary">
                          {respondida.autor_id ? (pessoas.get(respondida.autor_id)?.nome ?? "Alguém") : "Alguém"}
                        </span>
                        <span className="truncate">
                          {respondida.excluida_em ? "mensagem excluída" : respondida.conteudo}
                        </span>
                      </div>
                    )}

                    {m.excluida_em ? (
                      <p className="text-[13px] italic text-text-muted">Mensagem excluída</p>
                    ) : editando?.id === m.id ? (
                      <div className="mt-1">
                        <textarea
                          autoFocus
                          value={rascunhoEdicao}
                          onChange={(e) => setRascunhoEdicao(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              onEditar(m.id, rascunhoEdicao.trim()).then(() => setEditando(null));
                            }
                            if (e.key === "Escape") setEditando(null);
                          }}
                          rows={2}
                          className="w-full resize-none rounded-input border border-border bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent"
                        />
                        <div className="mt-1.5 flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => onEditar(m.id, rascunhoEdicao.trim()).then(() => setEditando(null))}
                            disabled={!rascunhoEdicao.trim()}
                          >
                            Salvar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditando(null)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-text-secondary">
                        {pedacosDoTexto(m.conteudo, nomes).map((p, idx) =>
                          p.tipo === "link" ? (
                            <a
                              key={idx}
                              href={p.valor}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent-text hover:underline"
                            >
                              {p.valor}
                            </a>
                          ) : p.tipo === "mencao" ? (
                            <span
                              key={idx}
                              className={cn(
                                "rounded px-0.5 font-medium",
                                p.encontrada ? "bg-accent-soft text-accent-text" : "text-text-secondary"
                              )}
                            >
                              {p.valor}
                            </span>
                          ) : (
                            <span key={idx}>{p.valor}</span>
                          )
                        )}
                        {m.editada_em && <span className="ml-1.5 text-[10px] text-text-muted">(editada)</span>}
                      </p>
                    )}

                    {reacoesDela && reacoesDela.size > 0 && !m.excluida_em && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {Array.from(reacoesDela.entries()).map(([emoji, ids]: [string, string[]]) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => onReagir(m.id, emoji)}
                            title={ids.map((id) => pessoas.get(id)?.nome ?? "?").join(", ")}
                            className={cn(
                              "flex items-center gap-1 rounded-button px-1.5 py-0.5 text-[11px] transition-colors",
                              ids.includes(meuId)
                                ? "bg-accent-soft text-accent-text shadow-[0_0_0_1px_var(--accent)]"
                                : "bg-card-hover text-text-secondary hover:bg-input"
                            )}
                          >
                            <span>{emoji}</span>
                            <span className="tabular-nums">{ids.length}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ações aparecem no hover: uma barra de botões em toda
                      mensagem deixaria a conversa ilegível. */}
                  {!m.excluida_em && editando?.id !== m.id && (
                    <div className="absolute right-2 top-0 hidden items-center gap-0.5 rounded-button border border-border bg-card px-1 py-0.5 shadow-popover group-hover:flex">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setEmojiAberto(emojiAberto === m.id ? null : m.id)}
                          title="Reagir"
                          className="flex h-6 w-6 items-center justify-center rounded text-text-tertiary hover:bg-card-hover hover:text-text-primary"
                        >
                          <Smile size={13} />
                        </button>
                        {emojiAberto === m.id && (
                          <div className="absolute right-0 top-full z-20 mt-1 flex gap-0.5 rounded-button border border-border bg-card p-1 shadow-popover">
                            {EMOJIS.map((e) => (
                              <button
                                key={e}
                                type="button"
                                onClick={() => {
                                  onReagir(m.id, e);
                                  setEmojiAberto(null);
                                }}
                                className="flex h-6 w-6 items-center justify-center rounded text-[13px] hover:bg-card-hover"
                              >
                                {e}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setRespondendo(m);
                          campoRef.current?.focus();
                        }}
                        title="Responder"
                        className="flex h-6 w-6 items-center justify-center rounded text-text-tertiary hover:bg-card-hover hover:text-text-primary"
                      >
                        <CornerUpLeft size={13} />
                      </button>
                      {minhas && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditando(m);
                            setRascunhoEdicao(m.conteudo);
                          }}
                          title="Editar"
                          className="flex h-6 w-6 items-center justify-center rounded text-text-tertiary hover:bg-card-hover hover:text-text-primary"
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                      {(minhas || souAdminDaSala) && (
                        <button
                          type="button"
                          onClick={() => confirmarExclusao(m)}
                          title="Excluir"
                          className="flex h-6 w-6 items-center justify-center rounded text-text-tertiary hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {novasAbaixo > 0 && (
        <button
          type="button"
          onClick={irAoFim}
          className="mx-4 mb-1 rounded-button bg-accent-soft px-3 py-1 text-[11px] font-medium text-accent-text shadow-[0_0_0_1px_var(--accent)]"
        >
          {novasAbaixo} {novasAbaixo === 1 ? "mensagem nova" : "mensagens novas"} — ir para o fim
        </button>
      )}

      <div className="border-t border-border p-3">
        {/* A chamada vem antes do campo: é a ação mais consequente da sala e
            mora onde a mão já está. */}
        {acaoChamada}

        {respondendo && (
          <div className="mb-2 flex items-center gap-2 rounded-input border border-border bg-card-hover px-3 py-1.5 text-[11px]">
            <CornerUpLeft size={12} className="shrink-0 text-text-tertiary" />
            <span className="text-text-tertiary">
              Respondendo a{" "}
              <span className="font-medium text-text-secondary">
                {respondendo.autor_id ? (pessoas.get(respondendo.autor_id)?.nome ?? "Alguém") : "Alguém"}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setRespondendo(null)}
              className="ml-auto text-text-tertiary hover:text-text-primary"
              aria-label="Cancelar resposta"
            >
              <X size={13} />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <textarea
            ref={campoRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={teclaNoCampo}
            rows={1}
            placeholder="Digite uma mensagem…  (Enter envia, Shift+Enter quebra linha)"
            className="max-h-32 min-h-[38px] flex-1 resize-none rounded-input border border-border bg-input px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent"
          />
          <Button onClick={enviar} disabled={!texto.trim() || enviando} aria-label="Enviar">
            <Send size={15} />
          </Button>
        </div>
      </div>
    </div>
  );
}
