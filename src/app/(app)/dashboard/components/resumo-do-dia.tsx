import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
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
  critico: { barra: "bg-danger", texto: "text-danger", fundo: "bg-danger-soft/40" },
  // Amarelo é dinheiro parado em cima da mesa: gente que comprou e parou no
  // meio do caminho.
  atencao: { barra: "bg-warning", texto: "text-warning", fundo: "bg-warning-soft/40" },
  // Cinza é contexto: nada quebrou, mas vale saber.
  neutro: { barra: "bg-border-strong", texto: "text-text-tertiary", fundo: "bg-card-hover/40" },
};

export function ResumoDoDiaView({ resumo, depositantes }: { resumo: ResumoDoDia; depositantes?: ReactNode }) {
  const criticos = resumo.alertas.filter((a) => a.nivel === "critico").length;

  return (
    <div className="space-y-8">
      {/* ── Hoje em números ── */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold text-text-primary">
            <span className="h-4 w-0.5 shrink-0 rounded-full bg-accent" aria-hidden />
            Hoje
          </h2>
          <Link
            href="/tracking"
            className="flex items-center gap-1 text-[11px] text-text-tertiary hover:text-accent-text"
          >
            Abrir o Tracking
            <ArrowRight size={12} />
          </Link>
        </div>

        {/* O número é o conteúdo, então ele manda no tamanho: 30px de valor
            com um rótulo de 10px em cima. Numa tela de 1920 as seis células
            cabem lado a lado sem apertar. */}
        <div className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-card bg-card shadow-card sm:grid-cols-3 xl:grid-cols-6 xl:divide-y-0">
          {resumo.numeros.map((n) => (
            <div key={n.chave} className={cn("min-w-0 px-4 py-4", n.destaque && "bg-card-hover/40")}>
              <p className="truncate text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
                {n.rotulo}
              </p>
              <p className="mt-2 text-[30px] font-bold leading-none tabular-nums text-text-primary">{n.valor}</p>
              {n.delta && (
                <p
                  className={cn(
                    "mt-2 flex items-center gap-1 truncate text-[11px] tabular-nums",
                    n.delta.texto === "igual a ontem"
                      ? "text-text-muted"
                      : n.delta.positivo
                        ? "text-success"
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
      </section>

      {/* ── Depositantes (em destaque, logo abaixo dos números do dia) ── */}
      {depositantes}

      {/* ── Precisa de atenção ── */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold text-text-primary">
            <span
              className={cn(
                "h-4 w-0.5 shrink-0 rounded-full",
                criticos > 0 ? "bg-danger" : resumo.alertas.length > 0 ? "bg-warning" : "bg-success"
              )}
              aria-hidden
            />
            Precisa de atenção
            {resumo.alertas.length > 0 && (
              <span className="rounded-button bg-card-hover px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-text-secondary">
                {resumo.alertas.length}
              </span>
            )}
          </h2>
        </div>

        {resumo.alertas.length === 0 ? (
          <div className="flex items-center gap-2.5 rounded-card bg-card px-4 py-3.5 text-[13px] text-text-secondary shadow-card">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
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
      </section>

      {/* O que não deu pra ler.
          Fica no fim, discreto, e só aparece quando há algo: painel que
          esconde a própria falha vira "sem dados" e manda a pessoa tomar
          decisão com meia verdade. */}
      {resumo.problemas.length > 0 && (
        <div className="rounded-card border border-warning/30 bg-warning-soft/30 px-4 py-3">
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
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold text-text-primary">
            <span className="h-4 w-0.5 shrink-0 rounded-full bg-accent" aria-hidden />
            Acontecendo hoje
          </h2>
          <Link
            href="/tracking?aba=eventos"
            className="flex items-center gap-1 text-[11px] text-text-tertiary hover:text-accent-text"
          >
            Todos os eventos
            <ArrowRight size={12} />
          </Link>
        </div>

        <div className="overflow-hidden rounded-card bg-card shadow-card">
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
                    <span className="shrink-0 text-[13px] font-semibold tabular-nums text-success">{m.valor}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
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
        "group flex gap-3 overflow-hidden rounded-card bg-card shadow-card transition-colors duration-150 hover:bg-card-hover",
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
