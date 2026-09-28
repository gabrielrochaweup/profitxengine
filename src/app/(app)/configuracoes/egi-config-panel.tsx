"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, FileText, RefreshCw, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { LoadingState } from "@/components/ui/loading-state";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useActiveProduct } from "@/components/layout/active-product-context";
import { cn } from "@/lib/utils";

interface Arquivo {
  id: string;
  nome: string;
  conteudo: string;
  ativo: boolean;
  created_at: string;
}

// Arquivo de texto acima disso é quase certamente um PDF convertido mal ou
// uma exportação inteira — e cada caractere vai pro contexto a cada pergunta.
const LIMITE_ARQUIVO = 1_000_000;
const ACEITOS = ".md,.markdown,.txt,text/plain,text/markdown";

// ~4 caracteres por token em português: conta de padaria, mas é o que dá
// noção de custo e de limite sem chamar a API.
function tokens(caracteres: number): string {
  const t = Math.round(caracteres / 4);
  return t >= 1000 ? `~${(t / 1000).toFixed(1).replace(".", ",")} mil tokens` : `~${t} tokens`;
}

function tamanho(caracteres: number): string {
  return caracteres >= 1000 ? `${Math.round(caracteres / 1000)} KB` : `${caracteres} B`;
}

/**
 * Configurações da Egi: o prompt (como ela se comporta) e os arquivos (o que
 * ela sabe).
 *
 * Mudou uma regra? O próprio guia do agente manda atualizar o manual
 * primeiro e o prompt depois — por isso "Substituir" troca o conteúdo de um
 * arquivo sem mudar o lugar dele. Vale na próxima pergunta, sem deploy.
 *
 * Só admin edita: mudar isto muda o que a equipe inteira responde pros
 * alunos. Os outros veem, pra saber de onde vêm as respostas.
 */
export function EgiConfigPanel({ isAdmin }: { isAdmin: boolean }) {
  const { activeProductId } = useActiveProduct();
  const toast = useToast();
  const confirm = useConfirm();
  const [carregando, setCarregando] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [promptSalvo, setPromptSalvo] = useState("");
  const [salvandoPrompt, setSalvandoPrompt] = useState(false);
  const [arquivos, setArquivos] = useState<Arquivo[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [vendo, setVendo] = useState<Arquivo | null>(null);
  const novoRef = useRef<HTMLInputElement>(null);
  const substituirRef = useRef<HTMLInputElement>(null);
  const [substituindo, setSubstituindo] = useState<Arquivo | null>(null);

  useEffect(() => {
    if (!activeProductId) return;
    const supabase = createClient();
    Promise.all([
      supabase.from("egi_config").select("prompt").eq("product_id", activeProductId).maybeSingle(),
      supabase
        .from("egi_arquivos")
        .select("id, nome, conteudo, ativo, created_at")
        .eq("product_id", activeProductId)
        .order("created_at"),
    ]).then(([{ data: config }, { data: lista }]) => {
      setPrompt(config?.prompt ?? "");
      setPromptSalvo(config?.prompt ?? "");
      setArquivos(lista ?? []);
      setCarregando(false);
    });
  }, [activeProductId]);

  async function salvarPrompt() {
    if (!activeProductId) return;
    setSalvandoPrompt(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("egi_config").upsert(
      { product_id: activeProductId, prompt, updated_by: user?.id ?? null, updated_at: new Date().toISOString() },
      { onConflict: "product_id" }
    );
    setSalvandoPrompt(false);
    if (error) {
      toast.error("Falha ao salvar o prompt.");
      return;
    }
    setPromptSalvo(prompt);
    toast.success("Prompt salvo — vale a partir da próxima pergunta.");
  }

  async function lerArquivo(arquivo: File): Promise<string | null> {
    if (arquivo.size > LIMITE_ARQUIVO) {
      toast.error(`"${arquivo.name}" passa de 1 MB. Use um arquivo de texto (.md ou .txt) mais enxuto.`);
      return null;
    }
    const texto = await arquivo.text();
    if (!texto.trim()) {
      toast.error(`"${arquivo.name}" está vazio.`);
      return null;
    }
    return texto;
  }

  async function adicionar(lista: FileList | null) {
    if (!lista || !activeProductId) return;
    setEnviando(true);
    const supabase = createClient();
    for (const arquivo of Array.from(lista)) {
      const conteudo = await lerArquivo(arquivo);
      if (!conteudo) continue;
      const { data, error } = await supabase
        .from("egi_arquivos")
        .insert({ product_id: activeProductId, nome: arquivo.name, conteudo })
        .select("id, nome, conteudo, ativo, created_at")
        .single();
      if (error || !data) toast.error(`Falha ao anexar "${arquivo.name}".`);
      else setArquivos((prev) => [...prev, data]);
    }
    setEnviando(false);
    if (novoRef.current) novoRef.current.value = "";
  }

  async function substituir(lista: FileList | null) {
    const alvo = substituindo;
    setSubstituindo(null);
    if (!lista?.[0] || !alvo) return;
    const conteudo = await lerArquivo(lista[0]);
    if (substituirRef.current) substituirRef.current.value = "";
    if (!conteudo) return;
    const { error } = await createClient()
      .from("egi_arquivos")
      .update({ conteudo, nome: lista[0].name })
      .eq("id", alvo.id);
    if (error) {
      toast.error("Falha ao substituir.");
      return;
    }
    setArquivos((prev) => prev.map((a) => (a.id === alvo.id ? { ...a, conteudo, nome: lista[0].name } : a)));
    toast.success(`"${alvo.nome}" atualizado — vale a partir da próxima pergunta.`);
  }

  async function alternar(arquivo: Arquivo) {
    const ativo = !arquivo.ativo;
    const { error } = await createClient().from("egi_arquivos").update({ ativo }).eq("id", arquivo.id);
    if (error) {
      toast.error("Falha ao atualizar.");
      return;
    }
    setArquivos((prev) => prev.map((a) => (a.id === arquivo.id ? { ...a, ativo } : a)));
  }

  async function excluir(arquivo: Arquivo) {
    const ok = await confirm({
      title: "Excluir arquivo",
      description: `Excluir "${arquivo.nome}"? A Egi deixa de saber o que está nele a partir da próxima pergunta. Se for só por um tempo, desative em vez de excluir.`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const { error } = await createClient().from("egi_arquivos").delete().eq("id", arquivo.id);
    if (error) {
      toast.error("Falha ao excluir.");
      return;
    }
    setArquivos((prev) => prev.filter((a) => a.id !== arquivo.id));
  }

  if (carregando) {
    return (
      <Card>
        <LoadingState message="Carregando a Egi..." />
      </Card>
    );
  }

  const totalContexto = prompt.length + arquivos.filter((a) => a.ativo).reduce((soma, a) => soma + a.conteudo.length, 0);
  const alterado = prompt !== promptSalvo;

  return (
    <div className="space-y-4">
      {!isAdmin && (
        <p className="rounded-input bg-card-hover px-3 py-2 text-[12px] text-text-tertiary">
          Só administradores alteram o prompt e os arquivos — mudar isto muda o que a equipe inteira responde pros alunos.
        </p>
      )}

      {/* Prompt */}
      <Card className="p-5">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-medium text-text-primary">Prompt</h3>
          <span className="text-[11px] text-text-tertiary">
            {prompt.length.toLocaleString("pt-BR")} caracteres · {tokens(prompt.length)}
          </span>
        </div>
        <p className="mb-3 text-xs text-text-secondary">
          Como a Egi se comporta: quem ela é, o formato da resposta, o que nunca pode dizer. Os arquivos abaixo e o FAQ
          entram depois, automaticamente.
        </p>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={16}
          disabled={!isAdmin}
          className="font-mono text-[12px] leading-relaxed"
        />
        {isAdmin && (
          <div className="mt-3 flex items-center justify-end gap-2">
            {alterado && (
              <>
                <span className="text-[11px] text-warning">Alterações não salvas</span>
                <Button variant="ghost" size="sm" onClick={() => setPrompt(promptSalvo)}>
                  Descartar
                </Button>
              </>
            )}
            <Button size="sm" onClick={salvarPrompt} disabled={!alterado || salvandoPrompt}>
              {salvandoPrompt ? "Salvando..." : "Salvar prompt"}
            </Button>
          </div>
        )}
      </Card>

      {/* Arquivos */}
      <Card className="p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-medium text-text-primary">Arquivos da base de conhecimento</h3>
            <p className="mt-0.5 text-xs text-text-secondary">
              O que a Egi sabe. Vão inteiros pra IA a cada pergunta — texto (.md ou .txt).
            </p>
          </div>
          {isAdmin && (
            <>
              <input ref={novoRef} type="file" accept={ACEITOS} multiple className="hidden" onChange={(e) => adicionar(e.target.files)} />
              <Button size="sm" variant="secondary" onClick={() => novoRef.current?.click()} disabled={enviando}>
                <Upload size={13} />
                {enviando ? "Anexando..." : "Anexar arquivo"}
              </Button>
            </>
          )}
        </div>

        <input ref={substituirRef} type="file" accept={ACEITOS} className="hidden" onChange={(e) => substituir(e.target.files)} />

        {arquivos.length === 0 ? (
          <p className="rounded-card border border-dashed border-border px-4 py-6 text-center text-[12px] text-text-tertiary">
            Nenhum arquivo anexado. Sem base de conhecimento, a Egi responde só com o que está no prompt.
          </p>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-card border border-border">
            {arquivos.map((a) => (
              <div key={a.id} className={cn("flex flex-wrap items-center gap-3 px-4 py-3", !a.ativo && "opacity-60")}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-button bg-accent-soft text-accent-text">
                  <FileText size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-text-primary">{a.nome}</p>
                  <p className="text-[11px] text-text-tertiary">
                    {tamanho(a.conteudo.length)} · {tokens(a.conteudo.length)}
                    {!a.ativo && " · desativado (a Egi não está usando)"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button size="sm" variant="ghost" onClick={() => setVendo(a)}>
                    <Eye size={13} />
                    Ver
                  </Button>
                  {isAdmin && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSubstituindo(a);
                          substituirRef.current?.click();
                        }}
                      >
                        <RefreshCw size={13} />
                        Substituir
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => alternar(a)}>
                        {a.ativo ? "Desativar" : "Ativar"}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-danger hover:bg-danger-soft hover:text-danger" onClick={() => excluir(a)}>
                        <Trash2 size={13} />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className={cn("mt-3 text-[11px]", totalContexto > 400_000 ? "text-warning" : "text-text-tertiary")}>
          Tamanho do que a Egi lê a cada pergunta (prompt + arquivos ativos): {tokens(totalContexto)}, fora o FAQ.
          {totalContexto > 400_000 && " Está grande — respostas ficam mais lentas e caras; desative o que não for essencial."}
        </p>
      </Card>

      <Modal open={!!vendo} onClose={() => setVendo(null)} title={vendo?.nome ?? ""} className="max-w-3xl">
        {vendo && (
          <pre className="max-h-[65vh] overflow-auto whitespace-pre-wrap rounded-input bg-input p-4 font-mono text-[12px] leading-relaxed text-text-secondary">
            {vendo.conteudo}
          </pre>
        )}
      </Modal>
    </div>
  );
}
