import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Section } from "@/components/ui/page";
import type { Alerta, NivelDeAlerta, ResumoDoDia } from "../resumo";

/*
  O resumo do dia, desenhado.

  Ordem: o que aconteceu hoje (números), o que está fora do lugar (alertas),
  o que acabou de entrar (movimento). É a ordem de quem abre o app de manhã
  e quer decidir o que fazer antes do café.
*/

const TOM: Record<NivelDeAlerta, { barra: string; texto: string; fundo: string }> = {
  // Vermelho é reservado pro que quebra o produto: mensagem que não saiu,
  // webhook recusado, aluno sem contrato (sem assinatura o acesso não abre).
  critico: { barra: "bg-danger", texto: "text-danger", fundo: "bg-danger-soft" },
  // Amarelo é dinheiro parado em cima da mesa: gente que comprou e parou no
  // meio do caminho.
  atencao: { barra: "bg-warning", texto: "text-warning", fundo: "bg-warning-soft" },
  // Cinza é contexto: nada quebrou, mas vale saber.
  neutro: { barra: "bg-border-strong", texto: "text-text-tertiary", fundo: "" },
};

export function ResumoDoDiaView({ resumo, depositantes }: { resumo: ResumoDoDia; depositantes?: ReactNode }) {
  const criticos = resumo.alertas.filter((a) => a.nivel === "critico").length;

  return (
    <div className="space-y-5">
      {/* ── Hoje em números ── */}
      <Section
        titulo="Hoje"
        acoes={
          <Link
            href="/tracking"
            className="flex items-center gap-1 text-[11px] text-text-tertiary hover:text-accent-text"
          >
            Abrir o Tracking
            <ArrowRight size={12} />
          </Link>
        }
      >

        {/* O número é o conteúdo, então ele manda no tamanho: 30px de valor
            com um rótulo de 10px em cima. Numa tela de 1920 as seis células
            cabem lado a lado sem apertar. */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
          {resumo.numeros.map((n) => (
            <div
              key={n.chave}
              className={cn(
                "min-w-0 rounded-xl border bg-app px-4 py-4",
                n.destaque ? "border-border-strong" : "border-border"
              )}
            >
              <p className="truncate text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
                {n.rotulo}
              </p>
              <p
                className={cn(
                  "mt-2 text-[30px] font-bold leading-none tabular-nums",
                  /^(0|R\$\s?0|US\$\s?0|—)$/.test(n.valor) ? "text-text-muted" : "text-text-primary"
                )}
              >
                {n.valor}
              </p>
              {n.delta && (
                <p
                  className={cn(
                    "mt-2 flex items-center gap-1 truncate text-[11px] tabular-nums",
                    n.delta.texto === "igual a ontem"
                      ? "text-text-muted"
                      : n.delta.positivo
                        ? "text-ok"
                        : "text-text-muted"
                  )}
                >
                  {n.delta.texto !== "igual a ontem" &&
                    (n.delta.positivo ? <TrendingUp size={11} /> : <TrendingDown size={11} />)}
                  {n.delta.texto}
                </p>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* ── Depositantes (em destaque, logo abaixo dos números do dia) ── */}
      {depositantes}

      {/* ── Precisa de atenção ── */}
      <Section
        titulo={
          <span className="flex items-center gap-2">
            Precisa de atenção
            {resumo.alertas.length > 0 && (
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                  criticos > 0 ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"
                )}
              >
                {resumo.alertas.length}
              </span>
            )}
          </span>
        }
      >
        {resumo.alertas.length === 0 ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-app px-4 py-3.5 text-[13px] text-text-secondary">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ok-soft text-ok">
              <Check size={13} />
            </span>
            Nada pedindo atenção agora — disparos em dia e ninguém parado no meio do funil.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 2xl:grid-cols-3">
            {resumo.alertas.map((a) => (
              <CartaoDeAlerta key={a.chave} alerta={a} />
            ))}
          </div>
        )}
      </Section>

      {/* O que não deu pra ler.
          Fica no fim, discreto, e só aparece quando há algo: painel que
          esconde a própria falha vira "sem dados" e manda a pessoa tomar
          decisão com meia verdade. */}
      {resumo.problemas.length > 0 && (
        <div className="rounded-2xl border border-border bg-warning-soft px-4 py-3">
          <p className="text-[12px] font-medium text-warning">
            Parte do resumo não carregou — o resto desta tela está completo.
          </p>
          <ul className="mt-1 space-y-0.5">
            {resumo.problemas.map((p) => (
              <li key={p} className="text-[11px] leading-relaxed text-text-tertiary">
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Acontecendo ── */}
      <Section
        titulo="Acontecendo hoje"
        acoes={
          <Link
            href="/tracking?aba=eventos"
            className="flex items-center gap-1 text-[11px] text-text-tertiary hover:text-accent-text"
          >
            Todos os eventos
            <ArrowRight size={12} />
          </Link>
        }
      >
        <div className="overflow-hidden rounded-xl border border-border bg-app">
          {resumo.movimentos.length === 0 ? (
            <p className="px-4 py-6 text-center text-[12px] text-text-tertiary">
              {resumo.diaVazio
                ? "Nenhum movimento hoje ainda."
                : "Leads entrando, mas nenhuma compra, contrato ou depósito hoje."}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {resumo.movimentos.map((m) => (
                <li key={m.id} className="flex items-center gap-4 px-4 py-2.5">
                  <span className="w-11 shrink-0 font-mono text-[11px] tabular-nums text-text-muted">{m.quando}</span>
                  <span className="w-44 shrink-0 truncate text-[13px] font-medium text-text-primary">{m.tipo}</span>
                  <span className="min-w-0 flex-1 truncate text-[12px] text-text-tertiary" title={m.quem}>
                    {m.quem}
                  </span>
                  {m.valor && (
                    <span className="shrink-0 text-[13px] font-semibold tabular-nums text-ok">{m.valor}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>
    </div>
  );
}

function CartaoDeAlerta({ alerta }: { alerta: Alerta }) {
  const tom = TOM[alerta.nivel];
  return (
    // O alerta inteiro é o link: o alvo de clique é o cartão, não uma
    // palavra de 60px no canto.
    <Link
      href={alerta.href}
      className={cn(
        "group flex gap-3 overflow-hidden rounded-xl border border-border bg-app transition-colors duration-150 hover:border-border-strong hover:bg-card-hover",
        tom.fundo
      )}
    >
      <span className={cn("w-0.5 shrink-0", tom.barra)} aria-hidden />
      <div className="min-w-0 flex-1 py-3 pr-4">
        <p className={cn("text-[13px] font-semibold leading-snug", tom.texto)}>{alerta.titulo}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-text-tertiary">{alerta.detalhe}</p>
        <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-text-secondary group-hover:text-accent-text">
          {alerta.acao}
          <ArrowRight size={11} />
        </span>
      </div>
    </Link>
  );
}
