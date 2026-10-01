// Navegadores que não são gente: o robô da Meta conferindo a página do
// anúncio (meta-externalads), prévias de link, crawlers, testes de
// velocidade. Eles rodam o script e, sem filtro, viravam "lead".
//
// A mesma lista está no backfill da migration 0125 — se mudar aqui, mude lá
// só se for rodar o backfill de novo (os dados antigos não são reescritos).
const PADRAO_ROBO =
  /(bot|crawl|spider|slurp|facebookexternalhit|meta-external|facebookcatalog|headlesschrome|lighthouse|adsbot|google-inspectiontool|python-requests|curl\/|wget\/)/i;

export function ehRobo(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return PADRAO_ROBO.test(userAgent);
}
