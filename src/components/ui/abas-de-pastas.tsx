"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Folder,
  FolderOpen,
  FolderPlus,
  Pencil,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface AbaDePasta {
  id: string;
  nome: string;
  total: number;
  /** Aba que não se renomeia, move nem exclui (ex: "Sem pasta"). */
  fixa?: boolean;
  icone?: LucideIcon;
}

/**
 * Bibliotecas organizadas como pastas em abas.
 *
 * Uma pasta aberta por vez, com o conteúdo inteiro dela à vista — em vez de
 * colunas espremidas lado a lado rolando na horizontal. As abas também são
 * destino de arrastar: solte um item numa aba pra mover ele pra lá.
 *
 * As ações da pasta aberta (renomear, mudar de lugar, excluir) ficam numa
 * barra com rótulo, embaixo das abas, e não em quatro ícones soltos em cada
 * coluna.
 */
export function AbasDePastas({
  abas,
  ativa,
  onTrocar,
  onCriar,
  onRenomear,
  onMover,
  onExcluir,
  arrastando,
  onSoltar,
  rotuloNova = "Nova pasta",
  placeholderNova = "Nome da pasta",
  acoesDaAba,
  ferramentas,
  children,
}: {
  abas: AbaDePasta[];
  ativa: string;
  onTrocar: (id: string) => void;
  onCriar: (nome: string) => Promise<boolean> | boolean;
  onRenomear: (id: string, nome: string) => void;
  onMover: (id: string, direcao: -1 | 1) => void;
  onExcluir: (id: string) => void;
  /** Tem item sendo arrastado agora — as abas viram alvo de soltar. */
  arrastando: boolean;
  onSoltar: (id: string) => void;
  rotuloNova?: string;
  placeholderNova?: string;
  /** Ação principal da pasta aberta (ex: "Novo prompt"). */
  acoesDaAba?: ReactNode;
  /** Busca/filtros, à direita da barra de abas. */
  ferramentas?: ReactNode;
  children: ReactNode;
}) {
  const [criando, setCriando] = useState(false);
  const [nomeNovo, setNomeNovo] = useState("");
  const [renomeando, setRenomeando] = useState(false);
  const [nomeEditado, setNomeEditado] = useState("");
  const [alvo, setAlvo] = useState<string | null>(null);
  const inputNovoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (criando) inputNovoRef.current?.focus();
  }, [criando]);
  useEffect(() => {
    setRenomeando(false);
  }, [ativa]);
  useEffect(() => {
    if (!arrastando) setAlvo(null);
  }, [arrastando]);

  const indiceAtiva = abas.findIndex((a) => a.id === ativa);
  const atual = abas[indiceAtiva] ?? null;
  const editaveis = abas.filter((a) => !a.fixa);
  const posicaoEditavel = atual ? editaveis.findIndex((a) => a.id === atual.id) : -1;

  async function criar() {
    const nome = nomeNovo.trim();
    if (!nome) return;
    const ok = await onCriar(nome);
    if (ok) {
      setNomeNovo("");
      setCriando(false);
    }
  }

  function confirmarRenome() {
    const nome = nomeEditado.trim();
    if (atual && nome && nome !== atual.nome) onRenomear(atual.id, nome);
    setRenomeando(false);
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      {/* ── Abas ── */}
      {/* As abas QUEBRAM em linhas, não rolam pro lado: com 11 pastas, metade
          ficava escondida atrás de uma rolagem horizontal — justamente o tipo
          de opção escondida que essa tela existe pra evitar. */}
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2 border-b border-border p-2 sm:p-3">
        <div role="tablist" aria-label="Pastas" className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {abas.map((aba) => {
            const ehAtiva = aba.id === ativa;
            const Icone = aba.icone ?? (ehAtiva ? FolderOpen : Folder);
            const soltandoAqui = arrastando && alvo === aba.id;
            return (
              <button
                key={aba.id}
                type="button"
                role="tab"
                aria-selected={ehAtiva}
                onClick={() => onTrocar(aba.id)}
                onDragOver={(e) => {
                  if (!arrastando) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (alvo !== aba.id) setAlvo(aba.id);
                }}
                onDragLeave={() => setAlvo((prev) => (prev === aba.id ? null : prev))}
                onDrop={(e) => {
                  e.preventDefault();
                  setAlvo(null);
                  onSoltar(aba.id);
                }}
                title={arrastando ? `Soltar em "${aba.nome}"` : aba.nome}
                className={cn(
                  "flex max-w-[15rem] shrink-0 items-center gap-2 rounded-xl border px-3 py-1.5 text-[13px] font-medium transition-colors",
                  soltandoAqui
                    ? "border-accent bg-accent-soft text-text-primary"
                    : ehAtiva
                      ? "border-border-strong bg-app text-text-primary shadow-card"
                      : arrastando
                        ? "border-dashed border-border-strong text-text-secondary"
                        : "border-transparent text-text-tertiary hover:bg-card-hover hover:text-text-secondary"
                )}
              >
                <Icone size={15} className={cn("shrink-0", ehAtiva ? "text-accent-text" : "text-text-muted")} />
                <span className="truncate">{aba.nome}</span>
                <span
                  className={cn(
                    "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                    ehAtiva ? "bg-accent-soft text-accent-text" : "bg-input text-text-tertiary"
                  )}
                >
                  {aba.total}
                </span>
              </button>
            );
          })}

          {criando ? (
            <div className="ml-1 flex shrink-0 items-center gap-1">
              <input
                ref={inputNovoRef}
                value={nomeNovo}
                onChange={(e) => setNomeNovo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") criar();
                  if (e.key === "Escape") setCriando(false);
                }}
                placeholder={placeholderNova}
                className="h-8 w-44 rounded-input bg-input px-2.5 text-[12px] text-text-primary outline-none placeholder:text-text-muted focus:shadow-[0_0_0_2px_var(--accent)]"
              />
              <BotaoIcone rotulo="Criar" onClick={criar}>
                <Check size={14} />
              </BotaoIcone>
              <BotaoIcone rotulo="Cancelar" onClick={() => setCriando(false)}>
                <X size={14} />
              </BotaoIcone>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCriando(true)}
              className="ml-1 flex shrink-0 items-center gap-1.5 rounded-xl border border-dashed border-border-strong px-2.5 py-1.5 text-[12px] font-medium text-text-tertiary transition-colors hover:border-accent hover:text-accent-text"
            >
              <FolderPlus size={14} />
              {rotuloNova}
            </button>
          )}
        </div>
        {ferramentas && (
          <div className="order-first flex w-full items-center gap-2 sm:order-none sm:w-auto sm:shrink-0">{ferramentas}</div>
        )}
      </div>

      {/* ── Pasta aberta ── */}
      <div className="bg-app p-3 sm:p-4">
        {atual && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {renomeando ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  value={nomeEditado}
                  onChange={(e) => setNomeEditado(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmarRenome();
                    if (e.key === "Escape") setRenomeando(false);
                  }}
                  className="h-8 w-56 rounded-input bg-input px-2.5 text-[13px] text-text-primary outline-none focus:shadow-[0_0_0_2px_var(--accent)]"
                />
                <BotaoIcone rotulo="Salvar nome" onClick={confirmarRenome}>
                  <Check size={14} />
                </BotaoIcone>
                <BotaoIcone rotulo="Cancelar" onClick={() => setRenomeando(false)}>
                  <X size={14} />
                </BotaoIcone>
              </div>
            ) : (
              <h2 className="flex min-w-0 items-center gap-2 text-[15px] font-semibold text-text-primary">
                <FolderOpen size={17} className="shrink-0 text-accent-text" />
                <span className="truncate">{atual.nome}</span>
              </h2>
            )}

            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              {!atual.fixa && !renomeando && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setNomeEditado(atual.nome);
                      setRenomeando(true);
                    }}
                  >
                    <Pencil size={13} />
                    Renomear
                  </Button>
                  <div className="flex items-center rounded-lg bg-input p-0.5">
                    <BotaoIcone
                      rotulo="Mover pasta para a esquerda"
                      onClick={() => onMover(atual.id, -1)}
                      disabled={posicaoEditavel <= 0}
                    >
                      <ArrowLeft size={14} />
                    </BotaoIcone>
                    <BotaoIcone
                      rotulo="Mover pasta para a direita"
                      onClick={() => onMover(atual.id, 1)}
                      disabled={posicaoEditavel < 0 || posicaoEditavel >= editaveis.length - 1}
                    >
                      <ArrowRight size={14} />
                    </BotaoIcone>
                  </div>
                  <Button type="button" size="sm" variant="secondary" onClick={() => onExcluir(atual.id)}>
                    <Trash2 size={13} className="text-danger" />
                    Excluir pasta
                  </Button>
                </>
              )}
              {acoesDaAba}
            </div>
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

function BotaoIcone({
  rotulo,
  onClick,
  disabled,
  children,
}: {
  rotulo: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={rotulo}
      aria-label={rotulo}
      className="flex h-7 w-7 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-card-hover hover:text-text-primary disabled:pointer-events-none disabled:opacity-35"
    >
      {children}
    </button>
  );
}

/** Lê/grava a aba aberta na URL (?pasta=), pra link e "voltar" caírem nela. */
export function usePastaNaUrl(padrao: string): [string, (id: string) => void] {
  const [ativa, setAtiva] = useState(padrao);
  useEffect(() => {
    try {
      const daUrl = new URLSearchParams(window.location.search).get("pasta");
      if (daUrl) setAtiva(daUrl);
    } catch {
      // sem URL acessível, fica no padrão
    }
  }, []);
  function trocar(id: string) {
    setAtiva(id);
    try {
      const params = new URLSearchParams(window.location.search);
      params.set("pasta", id);
      window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    } catch {
      // ignora
    }
  }
  return [ativa, trocar];
}
