export const CAMPOS_PRESET = "id, nome, utm_source, utm_medium, utm_campaign, utm_content, position, created_at";

/**
 * Deixa o valor da UTM no formato que o relatório espera.
 *
 * A aba Análises agrupa pela string exata: "Instagram" e "instagram" viram
 * duas linhas, e ninguém percebe até o número do canal aparecer dividido ao
 * meio. Como o preset existe justamente pra ninguém redigitar, normalizar
 * aqui é o que garante que o mesmo canal seja sempre a mesma string.
 */
export function normalizarValorUtm(valor: unknown): string {
  if (typeof valor !== "string") return "";
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") /* tira acento: automação -> automacao */
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._|/-]/g, "");
}
