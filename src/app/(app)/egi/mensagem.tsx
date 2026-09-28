"use client";

import { useState } from "react";
import { BookmarkCheck, BookmarkPlus, Check, Copy, MessageSquareQuote, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { extrairRespostaPronta } from "@/lib/egi/texto";
import { TextoDaEgi } from "./texto-da-egi";

export interface Mensagem {
  id: string;
  papel: "user" | "assistant";
  conteudo: string;
  faq_id: string | null;
  created_at: string;
}

type Nivel = "verde" | "amarelo" | "vermelho";

// O nível que o prompt manda a Egi declarar na primeira linha.
function nivelDa(conteudo: string): Nivel | null {
  const linha = conteudo.match(/N[ÍI]VEL[^\n]*/i)?.[0] ?? "";
  if (linha.includes("🔴") || /vermelho/i.test(linha) || conteudo.includes("ALERTA VERMELHO")) return "vermelho";
  if (linha.includes("🟡") || /amarelo/i.test(linha)) return "amarelo";
  if (linha.includes("🟢") || /verde/i.test(linha)) return "verde";
  return null;
}

const SELO: Record<Nivel, { texto: string; classe: string }> = {
  verde: { texto: "🟢 Dúvida comum — pode responder", classe: "border-success/30 bg-success-soft text-success" },
  amarelo: { texto: "🟡 Aluno insatisfeito — acolha primeiro", classe: "border-warning/30 bg-warning-soft text-warning" },
  vermelho: {
    texto: "🔴 ALERTA VERMELHO — não envie sem aprovação",
    classe: "border-danger/40 bg-danger-soft text-danger",
  },
};

export function BolhaDoUsuario({ conteudo }: { conteudo: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] whitespace-pre-wrap rounded-card rounded-br-md bg-accent-soft px-4 py-2.5 text-[13.5px] leading-relaxed text-text-primary">
        {conteudo}
      </div>
    </div>
  );
}

export function AvatarDaEgi({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-contrast",
        className
      )}
    >
      <Sparkles size={15} />
    </span>
  );
}

export function RespostaDaEgi({
  mensagem,
  onSalvarNoFaq,
}: {
  mensagem: Mensagem;
  onSalvarNoFaq: (mensagem: Mensagem) => Promise<void>;
}) {
  const toast = useToast();
  const [copiado, setCopiado] = useState<"aluno" | "tudo" | null>(null);
  const [salvando, setSalvando] = useState(false);
  const nivel = nivelDa(mensagem.conteudo);
  const pronta = nivel === "vermelho" ? null : extrairRespostaPronta(mensagem.conteudo);

  async function copiar(texto: string, qual: "aluno" | "tudo") {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(qual);
      setTimeout(() => setCopiado(null), 1600);
    } catch {
      toast.error("O navegador bloqueou a cópia — tente de novo.");
    }
  }

  async function salvar() {
    setSalvando(true);
    await onSalvarNoFaq(mensagem);
    setSalvando(false);
  }

  return (
    <div className="flex gap-3">
      <AvatarDaEgi className="mt-0.5" />
      <div className="min-w-0 flex-1 space-y-3">
        {nivel && (
          <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", SELO[nivel].classe)}>
            {SELO[nivel].texto}
          </span>
        )}

        <TextoDaEgi conteudo={mensagem.conteudo} />

        {/* Ações — à vista, não num menu: são o motivo da tela existir. */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-2.5">
          {pronta && (
            <button
              type="button"
              onClick={() => copiar(pronta, "aluno")}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-button px-2.5 text-[12px] font-medium transition-colors",
                copiado === "aluno"
                  ? "bg-success-soft text-success"
                  : "bg-accent text-accent-contrast hover:bg-accent-hover"
              )}
            >
              {copiado === "aluno" ? <Check size={13} /> : <MessageSquareQuote size={13} />}
              {copiado === "aluno" ? "Copiado" : "Copiar resposta pro aluno"}
            </button>
          )}
          <button
            type="button"
            onClick={() => copiar(mensagem.conteudo, "tudo")}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-button border px-2.5 text-[12px] transition-colors",
              copiado === "tudo"
                ? "border-success/30 bg-success-soft text-success"
                : "border-border text-text-secondary hover:bg-card-hover hover:text-text-primary"
            )}
          >
            {copiado === "tudo" ? <Check size={13} /> : <Copy size={13} />}
            {copiado === "tudo" ? "Copiado" : "Copiar tudo"}
          </button>

          <div className="ml-auto flex items-center gap-2">
            {mensagem.faq_id ? (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-success">
                <BookmarkCheck size={14} />
                Salva no FAQ
              </span>
            ) : (
              <>
                <span className="hidden text-[12px] text-text-tertiary sm:inline">Essa resposta ficou boa?</span>
                <button
                  type="button"
                  onClick={salvar}
                  disabled={salvando}
                  className="inline-flex h-7 items-center gap-1.5 rounded-button border border-border px-2.5 text-[12px] font-medium text-accent-text transition-colors hover:bg-accent-soft disabled:opacity-50"
                >
                  <BookmarkPlus size={13} />
                  {salvando ? "Salvando..." : "Salvar no FAQ"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
