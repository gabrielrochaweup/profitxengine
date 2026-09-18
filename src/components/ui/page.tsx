import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
  Primitivas de layout de página.

  Existem pra que a resposta de "qual a largura disso?" e "quanto espaço vai
  aqui?" não seja reinventada em cada tela. Cada página escolhe um modo e o
  resto vem junto.
*/

/**
 * Largura do conteúdo.
 *
 *   focado  — fluxo de criação, formulário simples, configuração
 *   padrao  — a maioria: lista, cadastro, tela de trabalho comum
 *   amplo   — só o que ganha de verdade com espaço horizontal (kanban,
 *             dashboard de dados, galeria)
 *
 * "amplo" não é o padrão de propósito. Texto esticado em monitor de 32"
 * é mais difícil de ler, não mais fácil — a linha longa demais faz o olho
 * perder onde volta.
 */
export type LarguraPagina = "focado" | "padrao" | "amplo";

const LARGURA: Record<LarguraPagina, string> = {
  focado: "max-w-[900px]",
  padrao: "max-w-[1280px]",
  amplo: "max-w-none",
};

export function PageContainer({
  largura = "padrao",
  className,
  children,
}: {
  largura?: LarguraPagina;
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("w-full", LARGURA[largura], className)}>{children}</div>;
}

/**
 * Cabeçalho de página: título, uma linha de descrição e, se houver, ações à
 * direita.
 *
 * O espaço abaixo mora aqui (24px) em vez de em cada tela — era daí que vinha
 * a diferença de respiro entre uma página e outra.
 */
export function PageHeader({
  titulo,
  descricao,
  acoes,
}: {
  titulo: string;
  descricao?: ReactNode;
  acoes?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold leading-tight text-text-primary">{titulo}</h1>
        {descricao && <p className="mt-1 max-w-[70ch] text-[13px] text-text-secondary">{descricao}</p>}
      </div>
      {acoes && <div className="flex shrink-0 flex-wrap items-center gap-2">{acoes}</div>}
    </div>
  );
}

/**
 * Bloco com assunto próprio dentro de uma página.
 *
 * Nem todo agrupamento precisa virar um cartão com contorno. Quando o que
 * separa é o assunto, e não a superfície, um título e um espaço bastam — e a
 * tela para de parecer uma pilha de caixas dentro de caixas.
 */
export function Section({
  titulo,
  descricao,
  acoes,
  className,
  children,
}: {
  titulo?: string;
  descricao?: ReactNode;
  acoes?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("mb-8 last:mb-0", className)}>
      {(titulo || acoes) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            {titulo && <h2 className="text-[15px] font-semibold text-text-primary">{titulo}</h2>}
            {descricao && <p className="mt-0.5 text-xs text-text-tertiary">{descricao}</p>}
          </div>
          {acoes && <div className="flex shrink-0 items-center gap-2">{acoes}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * Grade de 12 colunas. Cada campo declara quanto ocupa pelo componente Field.
 *
 * O ponto não é ter colunas — é largura dizer o que se espera do campo. Um
 * select de "Média / Alta" ocupando 1300px promete um conteúdo que não existe.
 */
export function ContentGrid({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-12", className)}>{children}</div>;
}

/** Quantas das 12 colunas o campo ocupa em tela larga. */
export type Span = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 12;

// Escritas por extenso porque o Tailwind lê as classes no código-fonte:
// montar o nome ("sm:col-span-" + n) faria a classe não existir no CSS final.
const SPAN: Record<Span, string> = {
  2: "sm:col-span-2",
  3: "sm:col-span-3",
  4: "sm:col-span-4",
  5: "sm:col-span-5",
  6: "sm:col-span-6",
  7: "sm:col-span-7",
  8: "sm:col-span-8",
  9: "sm:col-span-9",
  10: "sm:col-span-10",
  12: "sm:col-span-12",
};

/**
 * Um campo: rótulo, controle e, se precisar, uma dica embaixo.
 *
 * O rótulo é `text-secondary` — não "muted". Rótulo de campo é informação de
 * que a pessoa precisa pra usar a tela; apagá-lo não deixa a interface mais
 * limpa, deixa mais difícil.
 */
export function Field({
  label,
  hint,
  erro,
  span = 12,
  htmlFor,
  className,
  children,
}: {
  label?: string;
  hint?: ReactNode;
  erro?: string;
  span?: Span;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("col-span-1 min-w-0", SPAN[span], className)}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 block text-[11px] font-medium text-text-secondary">
          {label}
          {hint && <span className="ml-1 font-normal text-text-tertiary">{hint}</span>}
        </label>
      )}
      {children}
      {erro && <p className="mt-1 text-[11px] text-danger">{erro}</p>}
    </div>
  );
}

/**
 * Tela sem conteúdo ainda.
 *
 * Diz o que está vazio e o que fazer a respeito. Um cartão enorme com uma
 * linha cinza no meio ocupa a tela sem responder nenhuma das duas coisas.
 */
export function EmptyState({
  titulo,
  descricao,
  acao,
  className,
}: {
  titulo: string;
  descricao?: ReactNode;
  acao?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-card bg-card-hover px-6 py-10 text-center", className)}>
      <p className="text-[14px] font-medium text-text-primary">{titulo}</p>
      {descricao && <p className="mx-auto mt-1.5 max-w-[46ch] text-[12px] text-text-tertiary">{descricao}</p>}
      {acao && <div className="mt-4 flex justify-center">{acao}</div>}
    </div>
  );
}

/** Barra de ações de uma lista: filtro e busca à esquerda, ação primária à direita. */
export function ActionBar({
  filtros,
  acoes,
  className,
}: {
  filtros?: ReactNode;
  acoes?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-center gap-2", className)}>
      {filtros}
      {acoes && <div className="ml-auto flex flex-wrap items-center gap-2">{acoes}</div>}
    </div>
  );
}
