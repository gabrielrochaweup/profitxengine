"use client";

import { useState, type ReactNode } from "react";

/*
  As peças visuais mínimas, sem dependência de design system.

  Se o seu projeto já tem Card, Button, Tooltip e um `cn`, APAGUE este
  arquivo e aponte os imports pros seus — é meia hora de trabalho e o
  resultado fica com a cara do seu app. Isto existe pro kit abrir
  funcionando no primeiro dia, não pra virar mais um design system.

  As cores saem das variáveis CSS em ui/tokens.css. Trocar a paleta inteira
  é editar aquele arquivo.
*/

export function cn(...partes: (string | false | null | undefined)[]): string {
  return partes.filter(Boolean).join(" ");
}

export function Cartao({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("tk-cartao", className)}>{children}</div>;
}

export function Bloco({
  titulo,
  acoes,
  children,
}: {
  titulo: ReactNode;
  acoes?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="tk-bloco">
      <div className="tk-bloco-topo">
        {/* A barrinha à esquerda existe porque, numa página com várias
            seções no mesmo tom de fundo, um título de 14px não separa nada
            e a tela vira um bloco contínuo. */}
        <h2 className="tk-bloco-titulo">
          <span className="tk-bloco-marca" aria-hidden />
          {titulo}
        </h2>
        {acoes && <div className="tk-bloco-acoes">{acoes}</div>}
      </div>
      {children}
    </section>
  );
}

/**
 * Dica curta ao lado de um número que engana.
 *
 * Só onde existe ambiguidade real. Ícone de informação em tudo vira ruído,
 * e aí ninguém lê nenhum.
 */
export function Dica({ texto }: { texto: string }) {
  const [aberta, setAberta] = useState(false);
  return (
    <span
      className="tk-dica"
      onMouseEnter={() => setAberta(true)}
      onMouseLeave={() => setAberta(false)}
      onFocus={() => setAberta(true)}
      onBlur={() => setAberta(false)}
      tabIndex={0}
      role="note"
      aria-label={texto}
    >
      <span className="tk-dica-icone">i</span>
      {aberta && <span className="tk-dica-balao">{texto}</span>}
    </span>
  );
}

export function Segmentado<T extends string>({
  opcoes,
  ativo,
  onChange,
}: {
  opcoes: readonly { chave: T; rotulo: string }[];
  ativo: T;
  onChange: (chave: T) => void;
}) {
  return (
    <div className="tk-segmentado">
      {opcoes.map((o) => (
        <button
          key={o.chave}
          type="button"
          onClick={() => onChange(o.chave)}
          className={cn("tk-segmentado-item", ativo === o.chave && "tk-segmentado-ativo")}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="tk-vazio">{children}</p>;
}
