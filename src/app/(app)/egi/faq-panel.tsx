"use client";

import { useMemo, useState } from "react";
import { BookOpen, Check, Copy, MessageSquareQuote, Pencil, Plus, Search, Trash2, X } from "@/components/ui/icones";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { extrairRespostaPronta } from "@/lib/egi/texto";
import { TextoDaEgi } from "./texto-da-egi";

export interface ItemFaq {
  id: string;
  pergunta: string;
  resposta: string;
  created_at: string;
  updated_at: string;
}

function data(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * O banco de respostas da equipe.
 *
 * Cresce sozinho a partir do chat ("Salvar no FAQ") e também aceita entrada
 * manual. É compartilhado: o que um atendente aprova vira referência pra
 * todos — e a Egi lê este FAQ a cada pergunta, então uma resposta salva aqui
 * passa a guiar as próximas.
 */
export function FaqPanel({
  productId,
  itens,
  setItens,
}: {
  productId: string;
  itens: ItemFaq[];
  setItens: (fn: (prev: ItemFaq[]) => ItemFaq[]) => void;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [busca, setBusca] = useState("");
  const [abertoId, setAbertoId] = useState<string | null>(null);
  const [editando, setEditando] = useState<{ id: string | null; pergunta: string; resposta: string } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return itens;
    return itens.filter((f) => f.pergunta.toLowerCase().includes(termo) || f.resposta.toLowerCase().includes(termo));
  }, [itens, busca]);

  async function salvar() {
    if (!editando) return;
    const pergunta = editando.pergunta.trim();
    const resposta = editando.resposta.trim();
    if (!pergunta || !resposta) {
      toast.error("Preencha a pergunta e a resposta.");
      return;
    }
    setSalvando(true);
    const supabase = createClient();
    const agora = new Date().toISOString();
    const { data: salvo, error } = editando.id
      ? await supabase
          .from("egi_faq")
          .update({ pergunta, resposta, updated_at: agora })
          .eq("id", editando.id)
          .select("id, pergunta, resposta, created_at, updated_at")
          .single()
      : await supabase
          .from("egi_faq")
          .insert({ product_id: productId, pergunta, resposta })
          .select("id, pergunta, resposta, created_at, updated_at")
          .single();
    setSalvando(false);
    if (error || !salvo) {
      toast.error("Falha ao salvar.");
      return;
    }
    setItens((prev) => (editando.id ? prev.map((f) => (f.id === salvo.id ? salvo : f)) : [salvo, ...prev]));
    setEditando(null);
    setAbertoId(salvo.id);
  }

  async function excluir(item: ItemFaq) {
    const ok = await confirm({
      title: "Excluir do FAQ",
      description: "Some do FAQ pra toda a equipe, e a Egi deixa de usar essa resposta como referência.",
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const { error } = await createClient().from("egi_faq").delete().eq("id", item.id);
    if (error) {
      toast.error("Falha ao excluir.");
      return;
    }
    setItens((prev) => prev.filter((f) => f.id !== item.id));
  }

  async function copiar(item: ItemFaq) {
    const texto = extrairRespostaPronta(item.resposta) ?? item.resposta;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiadoId(item.id);
      setTimeout(() => setCopiadoId(null), 1600);
    } catch {
      toast.error("O navegador bloqueou a cópia — tente de novo.");
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar no FAQ por pergunta ou resposta"
            className="pl-9"
          />
        </div>
        <Button onClick={() => setEditando({ id: null, pergunta: "", resposta: "" })}>
          <Plus size={14} />
          Nova pergunta
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {editando && (
          <div className="space-y-3 rounded-card border border-accent bg-card p-4">
            <p className="text-[12px] font-semibold text-text-primary">
              {editando.id ? "Editar pergunta do FAQ" : "Nova pergunta no FAQ"}
            </p>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">Pergunta do aluno</label>
              <Textarea
                rows={2}
                value={editando.pergunta}
                onChange={(e) => setEditando((v) => (v ? { ...v, pergunta: e.target.value } : v))}
                placeholder='Ex: "Não recebi o acesso da plataforma"'
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">Resposta aprovada</label>
              <Textarea
                rows={8}
                value={editando.resposta}
                onChange={(e) => setEditando((v) => (v ? { ...v, resposta: e.target.value } : v))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditando(null)} disabled={salvando}>
                Cancelar
              </Button>
              <Button onClick={salvar} disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar no FAQ"}
              </Button>
            </div>
          </div>
        )}

        {filtrados.length === 0 && !editando ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-button bg-frame-soft text-frame-text">
              <BookOpen size={20} />
            </span>
            <p className="text-[14px] font-medium text-text-primary">
              {itens.length === 0 ? "O FAQ ainda está vazio" : "Nada encontrado"}
            </p>
            <p className="mt-1 max-w-[46ch] text-[12px] text-text-tertiary">
              {itens.length === 0
                ? 'Toda resposta boa da Egi pode virar FAQ: é só clicar em "Salvar no FAQ" embaixo dela. Também dá pra cadastrar uma pergunta na mão.'
                : "Nenhuma pergunta ou resposta bate com o que você buscou."}
            </p>
          </div>
        ) : (
          filtrados.map((item) => {
            const aberto = abertoId === item.id;
            return (
              <div key={item.id} className="overflow-hidden rounded-card border border-border bg-card">
                <button
                  type="button"
                  onClick={() => setAbertoId(aberto ? null : item.id)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-card-hover"
                  aria-expanded={aberto}
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-bold text-accent-text">
                    ?
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-[13.5px] font-medium text-text-primary", !aberto && "line-clamp-2")}>
                      {item.pergunta}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-text-tertiary">
                      Salva em {data(item.created_at)}
                      {item.updated_at !== item.created_at && ` · editada em ${data(item.updated_at)}`}
                    </span>
                  </span>
                </button>

                {aberto && (
                  <>
                    <div className="border-t border-border bg-app/40 px-4 py-4">
                      <TextoDaEgi conteudo={item.resposta} />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 border-t border-border px-4 py-2.5">
                      <Button size="sm" onClick={() => copiar(item)}>
                        {copiadoId === item.id ? <Check size={13} /> : extrairRespostaPronta(item.resposta) ? <MessageSquareQuote size={13} /> : <Copy size={13} />}
                        {copiadoId === item.id
                          ? "Copiado"
                          : extrairRespostaPronta(item.resposta)
                            ? "Copiar resposta pro aluno"
                            : "Copiar resposta"}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditando({ id: item.id, pergunta: item.pergunta, resposta: item.resposta })}
                      >
                        <Pencil size={13} />
                        Editar
                      </Button>
                      <Button size="sm" variant="ghost" className="ml-auto text-danger hover:bg-danger-soft hover:text-danger" onClick={() => excluir(item)}>
                        <Trash2 size={13} />
                        Excluir
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setAbertoId(null)} aria-label="Fechar">
                        <X size={13} />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
