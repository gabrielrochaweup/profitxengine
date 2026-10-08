import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Section e EmptyState leem o nível de superfície (contexto), por isso moram
// num arquivo de cliente — reexportados daqui pra nenhuma tela mudar o import.
export { Section, EmptyState } from "./section";

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
  // ReactNode e não string porque algumas telas levam um ícone junto do nome
  // (Admin, por exemplo) — e isso continua sendo um h1 só.
  titulo: ReactNode;
  descricao?: ReactNode;
  acoes?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        {/* Título da tela na fonte técnica, em caixa-alta e espaçado, com o
            fio âmbar à esquerda: a "placa" da página, como o nome no topo
            da ficha da referência. */}
        <h1 className="flex items-center gap-3 font-display text-[24px] font-bold uppercase leading-tight tracking-[0.08em] text-text-primary">
          <span aria-hidden className="h-6 w-[3px] shrink-0 bg-frame" />
          <span className="min-w-0">{titulo}</span>
        </h1>
        {descricao && <p className="mt-1.5 max-w-[70ch] pl-[15px] text-[13px] text-text-secondary">{descricao}</p>}
      </div>
      {acoes && <div className="flex shrink-0 flex-wrap items-center gap-2">{acoes}</div>}
    </div>
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
        <label htmlFor={htmlFor} className="mb-1.5 block font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-text-secondary">
          {label}
          {hint && <span className="ml-1 font-normal text-text-tertiary">{hint}</span>}
        </label>
      )}
      {children}
      {erro && <p className="mt-1 text-[11px] text-danger">{erro}</p>}
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
