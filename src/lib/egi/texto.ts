/**
 * Utilidades de texto da Egi que rodam no navegador.
 */

// As seções que vêm DEPOIS da resposta no formato do prompt — é onde a
// "RESPOSTA PRONTA" termina.
const FIM_DA_RESPOSTA = /\n\s*(?:\*\*)?\s*(?:⚠️|⚠|📎|❓|🔺|CUIDADOS NESTA RESPOSTA|BASE NO CONTRATO|FALTA VERIFICAR|ESCALAR PARA)/;

/**
 * Só o texto que vai pro aluno, sem o nível, os cuidados e o resto que é
 * pra equipe. É o que se cola no WhatsApp — copiar a resposta inteira
 * obrigava a apagar metade na mão, e esquecer um "⚠️ CUIDADOS" no meio da
 * mensagem pro aluno é o tipo de erro que acontece com pressa.
 *
 * null quando a resposta não segue o formato (ex.: alerta vermelho, ou uma
 * pergunta que não era de aluno) — aí só vale copiar tudo.
 */
export function extrairRespostaPronta(conteudo: string): string | null {
  const inicio = conteudo.match(/RESPOSTA PRONTA:?\**\s*\n?/i);
  if (!inicio || inicio.index === undefined) return null;
  const resto = conteudo.slice(inicio.index + inicio[0].length);
  const fim = resto.search(FIM_DA_RESPOSTA);
  const texto = (fim === -1 ? resto : resto.slice(0, fim)).trim();
  return texto.length > 0 ? texto : null;
}

/** Título da conversa a partir da primeira pergunta. */
export function tituloDaConversa(primeiraMensagem: string): string {
  const limpo = primeiraMensagem.replace(/\s+/g, " ").trim();
  return limpo.length > 60 ? `${limpo.slice(0, 57)}…` : limpo || "Nova conversa";
}
