"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Copy, Eye, EyeOff, Lock, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/*
  Peças de apresentação do módulo Tracking.

  Existem porque a tela inteira era feita de `Card > h3 text-base > conteúdo`
  repetido dezenas de vezes: cada gráfico, cada tabela e cada filtro ganhava a
  própria caixa com o próprio padding, e o resultado era caixa dentro de caixa
  com um ritmo diferente em cada aba.

  A regra aqui é: a borda separa o que é semanticamente separado. Onde o que
  separa é o assunto, separa espaço e título — não mais um contorno.

  Nada aqui recebe ou transforma dado. São só invólucros.
*/

/** Título de bloco do módulo. 13px, não 16 — é rótulo de seção num painel denso. */
export function BlocoTitulo({
  titulo,
  dica,
  acoes,
  className,
}: {
  titulo: ReactNode;
  dica?: ReactNode;
  acoes?: ReactNode;
  className?: string;
}) {
  return (
    // A barrinha do accent à esquerda existe porque, numa página com seis
    // seções seguidas no mesmo tom de fundo, um título de 13px no meio do
    // escuro não separa nada: a tela vira um bloco contínuo. Dois pixels de
    // cor marcam onde um assunto começa sem precisar de mais uma caixa.
    <div className={cn("mb-3 flex flex-wrap items-center justify-between gap-2", className)}>
      <h3 className="flex items-center gap-2 text-[14px] font-semibold text-text-primary">
        <span className="h-4 w-0.5 shrink-0 rounded-full bg-accent" aria-hidden />
        {titulo}
        {dica}
      </h3>
      {acoes && <div className="flex shrink-0 flex-wrap items-center gap-2">{acoes}</div>}
    </div>
  );
}

/**
 * Bloco sem caixa: título + conteúdo, direto sobre o fundo.
 *
 * É o padrão do módulo. Use `Cartao` só quando a área precisar de superfície
 * própria (tabela longa, grupo que se lê como uma unidade).
 */
export function Bloco({
  titulo,
  dica,
  acoes,
  className,
  children,
}: {
  titulo?: ReactNode;
  dica?: ReactNode;
  acoes?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={className}>
      {titulo && <BlocoTitulo titulo={titulo} dica={dica} acoes={acoes} />}
      {children}
    </section>
  );
}

/**
 * Cartão do módulo: mesma superfície do resto do app, padding menor.
 *
 * p-4 e não p-5 — num painel de dados, 20px de respiro em volta de cada
 * gráfico vira meia tela de nada quando são dez gráficos.
 */
export function Cartao({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-card bg-card p-4 shadow-card", className)}>{children}</div>;
}

/**
 * Cartão com barra de título.
 *
 * O cartão liso é ótimo pra uma coisa só; quando são quatro painéis
 * seguidos, o olho perde onde um termina e o outro começa — foi o que
 * aconteceu em "Detalhes das vendas" e em "Quando os resultados acontecem".
 * A faixa de título devolve a borda de cima sem desenhar mais uma caixa.
 */
export function CartaoComTopo({
  titulo,
  dica,
  acoes,
  className,
  corpoClassName,
  children,
}: {
  titulo: ReactNode;
  dica?: ReactNode;
  acoes?: ReactNode;
  className?: string;
  corpoClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("overflow-hidden rounded-card bg-card shadow-card", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card-hover/40 px-4 py-2">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
          {titulo}
          {dica}
        </p>
        {acoes && <div className="flex shrink-0 items-center gap-2">{acoes}</div>}
      </div>
      <div className={cn("p-4", corpoClassName)}>{children}</div>
    </div>
  );
}

/**
 * Dois (ou mais) blocos irmãos dentro de UMA superfície, separados por fio.
 *
 * Era aqui que nasciam as "caixas dentro de caixas": duas metades da mesma
 * ideia — funil do curso e da corretora, vendas por horário e por dia —
 * moravam em dois cartões idênticos lado a lado. O fio diz a mesma coisa que
 * dois contornos diziam, com metade do ruído.
 */
export function CartaoDividido({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 divide-y divide-border rounded-card bg-card shadow-card lg:grid-cols-2 lg:divide-x lg:divide-y-0",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Uma metade do CartaoDividido. */
export function MetadeCartao({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("min-w-0 p-4", className)}>{children}</div>;
}

/**
 * Barra de filtros do módulo.
 *
 * Antes era um cartão de 110px de altura só pra guardar quatro selects. Aqui
 * é uma faixa: controles à esquerda, estado e ação à direita, um fio embaixo
 * separando do conteúdo.
 */
export function BarraDeFiltros({
  children,
  direita,
  className,
}: {
  children: ReactNode;
  direita?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border pb-3",
        className
      )}
    >
      {children}
      {direita && <div className="ml-auto flex flex-wrap items-center gap-2">{direita}</div>}
    </div>
  );
}

/** Rótulo curto à esquerda de um controle da barra. Nível secundário, nunca "muted". */
export function FiltroCampo({
  label,
  dica,
  className,
  children,
}: {
  label: string;
  dica?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("flex items-center gap-1.5", className)}>
      <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-text-secondary">
        {label}
        {dica}
      </span>
      {children}
    </label>
  );
}

/** Grupo de botões que se lê como um controle só (período, por exemplo). */
export function Segmentado<T extends string>({
  opcoes,
  ativo,
  onChange,
  disabled,
}: {
  opcoes: readonly { key: T; label: string }[];
  ativo: T;
  onChange: (key: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex h-8 items-center gap-0.5 rounded-input border border-border bg-input p-0.5">
      {opcoes.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          disabled={disabled}
          className={cn(
            "h-7 rounded-[6px] px-2.5 text-[11px] font-medium transition-colors duration-150 disabled:opacity-50",
            ativo === o.key
              ? "bg-accent text-accent-contrast"
              : "text-text-secondary hover:bg-card-hover hover:text-text-primary"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────── tabelas ─────────────────────────── */

/** Casca de tabela: rolagem horizontal quando não couber, sem quebrar o layout. */
export function TabelaWrap({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("-mx-4 overflow-x-auto px-4", className)}>{children}</div>;
}

export function Tabela({ className, children }: { className?: string; children: ReactNode }) {
  return <table className={cn("w-full min-w-full text-left text-xs", className)}>{children}</table>;
}

/**
 * Cabeçalho de coluna.
 *
 * `num` alinha à direita e liga tabular-nums: número que muda de largura a
 * cada linha não dá pra comparar de bater o olho.
 * `fraco` marca a coluna secundária — continua ali, com menos peso.
 */
export function Th({
  children,
  num,
  fraco,
  className,
}: {
  children: ReactNode;
  num?: boolean;
  fraco?: boolean;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-2 py-2 text-[10px] font-semibold uppercase tracking-wide first:pl-0 last:pr-0",
        fraco ? "text-text-muted" : "text-text-tertiary",
        num && "text-right",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  num,
  forte,
  fraco,
  className,
  title,
}: {
  children: ReactNode;
  num?: boolean;
  forte?: boolean;
  fraco?: boolean;
  className?: string;
  /** Texto cheio quando a célula trunca — o truncamento não pode esconder dado. */
  title?: string;
}) {
  return (
    <td
      title={title}
      className={cn(
        "whitespace-nowrap px-2 py-2 first:pl-0 last:pr-0",
        num && "text-right tabular-nums",
        forte ? "font-medium text-text-primary" : fraco ? "text-text-tertiary" : "text-text-secondary",
        className
      )}
    >
      {children}
    </td>
  );
}

/** Linha de dados com hover — dá o rastro do olho em tabela larga. */
export function Tr({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <tr className={cn("border-b border-border/60 transition-colors last:border-0 hover:bg-card-hover", className)}>
      {children}
    </tr>
  );
}

/** Linha única de "não tem nada aqui" — sem cartão gigante em volta. */
export function Vazio({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-xs text-text-tertiary">{children}</p>;
}

/* ─────────────────────────── menu "•••" ─────────────────────────── */

/**
 * Ações que existem mas não são do dia a dia.
 *
 * Cada endpoint tinha oito botões sempre visíveis; o que se usa toda hora
 * (copiar, testar) some no meio do que se usa uma vez por ano (rotacionar
 * token). Aqui o raro fica a um clique, não a zero — e a linha volta a ter
 * uma ação óbvia.
 */
export function MenuMais({
  children,
  label = "Mais ações",
  className,
}: {
  children: ReactNode | ((fechar: () => void) => ReactNode);
  label?: string;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  const fechar = () => setAberto(false);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label={label}
        aria-expanded={aberto}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-button text-text-tertiary transition-colors hover:bg-card-hover hover:text-text-primary",
          aberto && "bg-card-hover text-text-primary"
        )}
      >
        <MoreHorizontal size={15} />
      </button>
      {aberto && (
        <div className="absolute right-0 top-full z-30 mt-1 min-w-[180px] overflow-hidden rounded-card bg-card py-1 shadow-popover">
          {typeof children === "function" ? children(fechar) : children}
        </div>
      )}
    </div>
  );
}

/** Item do MenuMais. */
export function ItemMenu({
  onClick,
  icone,
  perigo,
  children,
}: {
  onClick: () => void;
  icone?: ReactNode;
  perigo?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors",
        perigo
          ? "text-danger hover:bg-danger-soft"
          : "text-text-secondary hover:bg-card-hover hover:text-text-primary"
      )}
    >
      {icone}
      {children}
    </button>
  );
}

/** Ponto de status: diz o estado sem virar mais um badge colorido na tela. */
export function Ponto({ tom }: { tom: "ok" | "alerta" | "erro" | "neutro" }) {
  return (
    <span
      className={cn(
        "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
        tom === "ok" && "bg-success",
        tom === "alerta" && "bg-warning",
        tom === "erro" && "bg-danger",
        tom === "neutro" && "bg-text-muted"
      )}
    />
  );
}

/* ─────────────────────────── distribuição ─────────────────────────── */

/**
 * Como um total se reparte entre poucas categorias.
 *
 * Substitui os donuts do detalhamento. Dois motivos: donut de 260px pra
 * mostrar "stories: 8 (100%)" gasta meia tela pra dizer uma linha, e a
 * paleta rotativa pintava cada categoria de uma cor sem que a cor
 * significasse nada.
 *
 * Com uma ou duas categorias vira uma frase; com mais, vira barra. A cor é
 * sempre a mesma — o que varia é o comprimento, que é justamente a
 * informação.
 */
export function Distribuicao({
  dados,
  formatar = (n: number) => String(n),
  vazio = "Sem dados nesse período.",
}: {
  dados: { label: string; valor: number }[];
  formatar?: (valor: number) => string;
  vazio?: string;
}) {
  const ordenado = dados.slice().sort((a, b) => b.valor - a.valor);
  const total = ordenado.reduce((acc, d) => acc + d.valor, 0);

  if (ordenado.length === 0 || total === 0) {
    return <p className="py-3 text-[11px] text-text-tertiary">{vazio}</p>;
  }

  if (ordenado.length <= 2) {
    return (
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-1">
        {ordenado.map((d) => (
          <span key={d.label} className="flex items-baseline gap-1.5">
            <span className="text-[15px] font-semibold tabular-nums text-text-primary">{formatar(d.valor)}</span>
            <span className="text-[11px] text-text-secondary">{d.label}</span>
            {ordenado.length > 1 && (
              <span className="text-[10px] tabular-nums text-text-muted">
                {Math.round((d.valor / total) * 100)}%
              </span>
            )}
          </span>
        ))}
      </div>
    );
  }

  const maior = Math.max(...ordenado.map((d) => d.valor));
  return (
    <div className="space-y-1.5 py-0.5">
      {ordenado.map((d) => (
        <div key={d.label} className="flex items-center gap-2.5">
          <span className="w-28 shrink-0 truncate text-[11px] text-text-secondary" title={d.label}>
            {d.label}
          </span>
          <div className="h-3.5 flex-1 overflow-hidden rounded-[4px] bg-card-hover">
            <div
              className="h-full rounded-[4px] bg-accent"
              style={{ width: `${Math.max(2, (d.valor / maior) * 100)}%`, opacity: Math.max(0.45, d.valor / maior) }}
            />
          </div>
          <span className="w-20 shrink-0 text-right text-[11px] font-medium tabular-nums text-text-primary">
            {formatar(d.valor)}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Interruptor de ligar/desligar.
 *
 * Um botão escrito "Inativo" mostra o estado em vez da ação — não dá pra
 * saber se é informação ou controle. O interruptor resolve sozinho: a
 * posição diz o estado e a forma diz que é clicável.
 */
export function Interruptor({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      onClick={onChange}
      disabled={disabled}
      className="flex shrink-0 items-center gap-2 disabled:opacity-50"
    >
      <span className={cn("relative h-5 w-9 rounded-full transition-colors", checked ? "bg-accent" : "bg-card-hover")}>
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-card-sm transition-transform",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </span>
      <span className={cn("text-xs", checked ? "text-text-primary" : "text-text-muted")}>
        {checked ? "Ativo" : "Inativo"}
      </span>
    </button>
  );
}

/** Botão só de ícone, sempre com rótulo pra leitor de tela e dica no hover. */
export function BotaoIcone({
  titulo,
  onClick,
  children,
  type = "button",
  disabled,
  className,
}: {
  titulo: string;
  onClick?: () => void;
  children: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={titulo}
      aria-label={titulo}
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-button text-text-tertiary transition-colors hover:bg-card-hover hover:text-text-primary disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}


/**
 * Um valor pra copiar e colar em outro sistema: rótulo EM CIMA, valor
 * dentro de uma caixa com cara de campo, e o "Copiar" DENTRO da caixa.
 *
 * O desenho é o que separa "isto é pra copiar" de "isto é texto": antes o
 * rótulo ficava ao lado, com o mesmo peso do valor, e a linha inteira lia
 * como um parágrafo. O botão confirma a cópia no próprio lugar ("Copiado")
 * — um toast lá no canto não diz QUAL dos três campos foi copiado.
 *
 * Com `secreto`, o valor vem mascarado, com cadeado no rótulo e um olho pra
 * revelar; copiar funciona sem revelar.
 */
export function CampoCopiavel({
  rotulo,
  valor,
  onCopiar,
  secreto,
  revelado,
  onAlternar,
  carregando,
}: {
  rotulo: string;
  valor: string;
  /** Devolve false se a cópia não aconteceu (ex.: navegador bloqueou). */
  onCopiar: () => Promise<boolean> | boolean;
  secreto?: boolean;
  revelado?: boolean;
  onAlternar?: () => void;
  carregando?: boolean;
}) {
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const t = setTimeout(() => setCopiado(false), 1600);
    return () => clearTimeout(t);
  }, [copiado]);

  async function copiar() {
    if (await onCopiar()) setCopiado(true);
  }

  return (
    <div className="min-w-0">
      <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
        {secreto && <Lock size={10} />}
        {rotulo}
      </p>
      <div className="flex items-stretch overflow-hidden rounded-input border border-border bg-input transition-colors hover:border-border-strong">
        <code
          className="min-w-0 flex-1 select-all truncate px-3 py-2 font-mono text-[12px] leading-5 text-text-primary"
          title={secreto && !revelado ? undefined : valor}
        >
          {valor}
        </code>
        {secreto && onAlternar && (
          <button
            type="button"
            onClick={onAlternar}
            disabled={carregando}
            title={revelado ? "Esconder" : "Mostrar"}
            aria-label={revelado ? `Esconder ${rotulo}` : `Mostrar ${rotulo}`}
            className="flex w-10 shrink-0 items-center justify-center border-l border-border text-text-tertiary transition-colors hover:bg-card-hover hover:text-text-primary disabled:opacity-50"
          >
            {revelado ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
        <button
          type="button"
          onClick={copiar}
          disabled={carregando}
          aria-label={`Copiar ${rotulo}`}
          className={cn(
            "flex w-11 shrink-0 items-center justify-center gap-1.5 border-l border-border text-[12px] font-medium transition-colors disabled:opacity-50 sm:w-auto sm:min-w-[96px] sm:px-3",
            copiado ? "bg-success-soft text-success" : "text-text-secondary hover:bg-card-hover hover:text-text-primary"
          )}
        >
          {copiado ? <Check size={13} /> : <Copy size={13} />}
          {/* No celular fica só o ícone: o texto roubava o espaço do valor. */}
          <span className="hidden sm:inline">{copiado ? "Copiado" : "Copiar"}</span>
        </button>
      </div>
    </div>
  );
}
