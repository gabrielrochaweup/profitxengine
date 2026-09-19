/**
 * Os "baldes" que aparecem onde deveria haver um nome de origem.
 *
 * `(direto)`, `(sem campanha)` e `(não atribuído)` não são campanhas — são
 * respostas a "por que não sei de onde isso veio". Sem essa explicação, cada
 * um parece só mais uma campanha com nome estranho.
 *
 * Mora num arquivo próprio porque três telas leem a mesma lista (o funil, a
 * matriz de origem e a tabela de campanhas); em cópias, um texto novo entra
 * numa e envelhece nas outras.
 */
export const SPECIAL_BUCKET_HELP: Record<string, string> = {
  "(direto)": "Visitante chegou sem nenhuma UTM no link (sem utm_source).",
  "(sem campanha)": "Tem utm_source, mas o link não veio com utm_campaign preenchido.",
  "(não atribuído)":
    "Evento (compra, depósito...) chegou mas não deu pra ligar a nenhum lead nosso — sem campanha possível de atribuir.",
};

export function isSpecialBucket(value: string): boolean {
  return value in SPECIAL_BUCKET_HELP;
}
