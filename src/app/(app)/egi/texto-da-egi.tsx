"use client";

import { Fragment, type ReactNode } from "react";

// **negrito** dentro da linha. Tudo vira elemento React — nada de HTML cru,
// então o que a IA escrever nunca executa nada na tela.
function inline(linha: string): ReactNode[] {
  return linha.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
    parte.startsWith("**") && parte.endsWith("**") && parte.length > 4 ? (
      <strong key={i} className="font-semibold text-text-primary">
        {parte.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{parte}</Fragment>
    )
  );
}

/**
 * O texto de uma resposta da Egi.
 *
 * Mantém as quebras de linha como vieram — no formato do prompt ("NÍVEL:",
 * "RESPOSTA PRONTA:", "⚠️ CUIDADOS") cada linha é uma informação, e juntar
 * em parágrafo (como o markdown comum faz) embaralharia tudo. Títulos (#)
 * e rótulos em caixa alta viram destaque; o resto sai como veio.
 */
export function TextoDaEgi({ conteudo }: { conteudo: string }) {
  const linhas = conteudo.replace(/\r\n/g, "\n").split("\n");
  return (
    <div className="space-y-1 text-[13.5px] leading-relaxed text-text-secondary">
      {linhas.map((linha, i) => {
        if (!linha.trim()) return <div key={i} className="h-2" />;
        const titulo = linha.match(/^#{1,6}\s+(.*)$/);
        if (titulo) {
          return (
            <p key={i} className="pt-1 font-semibold text-text-primary">
              {inline(titulo[1])}
            </p>
          );
        }
        // "RESPOSTA PRONTA:", "PODE ENVIAR DIRETO?" — rótulo do formato.
        const rotulo = linha.match(/^(\s*(?:[^\s\w]+\s*)?[A-ZÀ-Ú][A-ZÀ-Ú0-9 ?/]{3,}[:?])(.*)$/);
        if (rotulo) {
          return (
            <p key={i} className="whitespace-pre-wrap">
              <span className="font-semibold text-text-primary">{rotulo[1]}</span>
              {inline(rotulo[2])}
            </p>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap">
            {inline(linha)}
          </p>
        );
      })}
    </div>
  );
}
