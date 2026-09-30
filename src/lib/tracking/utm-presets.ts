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

/**
 * Parâmetros de URL da Meta com UTM "vazia": em vez de digitar o nome de cada
 * campanha, conjunto e anúncio, cola-se esta string UMA vez no campo
 * "Parâmetros de URL" do anúncio e a Meta troca cada {{...}} pelo valor real
 * na hora do clique.
 *
 * Fica fora do preset de propósito: normalizarValorUtm tira chaves e ponto
 * (é o que mantém "Instagram" e "instagram" numa linha só), e isso
 * destruiria os {{macros}}. Também não passa pelo gerador de link, que
 * codifica as chaves na URL (%7B%7B) — a Meta só reconhece a macro escrita
 * como está.
 *
 * utm_source e utm_medium são os do canal "Meta Ads" (meta · cpc). Os demais
 * são as macros dinâmicas da própria Meta.
 */
export const PARAMETROS_META_DINAMICOS = [
  "utm_source=meta",
  "utm_medium=cpc",
  "utm_content={{adset.name}}",
  "utm_campaign={{campaign.name}}",
  "utm_term={{ad.name}}",
  "utm_id={{campaign.id}}",
  "ad_id={{ad.id}}",
  "adset_id={{adset.id}}",
  "placement={{placement}}",
  "site_source_name={{site_source_name}}",
].join("&");
