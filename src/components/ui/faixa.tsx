import type { ReactNode } from "react";
import type { LucideIcon } from "@/components/ui/icones";
import { cn } from "@/lib/utils";

/*
  As duas marcas de título do visual "painel de operações".

  FaixaTitulo — o cabeçalho de um painel (nível 1): o quadrado marcador e a
  faixa âmbar com o título em caixa-alta, espaçado. É o que separa um assunto
  do outro numa tela cheia de dados: o olho acha o começo de cada bloco
  antes de ler qualquer palavra.

  RotuloSecao — o subtítulo dentro de um painel (nível 2): o mesmo quadrado,
  menor, e o título escrito em âmbar, sem faixa. Duas faixas cheias seguidas
  pesariam mais que o conteúdo.

  O âmbar aqui é estrutura, nunca ação: nada nestas peças é clicável. O que
  for clicável ao lado (a dica "?") vai em `depois`, fora da faixa, porque
  um ícone cinza em cima do âmbar some.
*/

export function FaixaTitulo({
  children,
  icone: Icone,
  depois,
  as: Tag = "h2",
  className,
}: {
  children: ReactNode;
  icone?: LucideIcon;
  depois?: ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <span aria-hidden className="h-[7px] w-[7px] shrink-0 bg-text-primary" />
      <Tag className="flex min-w-0 items-center gap-1.5 bg-frame px-2.5 py-[3px] font-display text-[12px] font-bold uppercase leading-5 tracking-[0.16em] text-frame-contrast">
        {Icone && <Icone size={13} className="shrink-0" />}
        <span className="min-w-0">{children}</span>
      </Tag>
      {depois}
    </div>
  );
}

export function RotuloSecao({
  children,
  icone: Icone,
  depois,
  as: Tag = "h3",
  className,
}: {
  children: ReactNode;
  icone?: LucideIcon;
  depois?: ReactNode;
  as?: "h2" | "h3" | "h4" | "p";
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <span aria-hidden className="h-[5px] w-[5px] shrink-0 bg-frame" />
      <Tag className="flex min-w-0 items-center gap-1.5 font-display text-[11px] font-semibold uppercase leading-4 tracking-[0.14em] text-frame-text">
        {Icone && <Icone size={12} className="shrink-0" />}
        <span className="min-w-0">{children}</span>
      </Tag>
      {depois}
    </div>
  );
}
