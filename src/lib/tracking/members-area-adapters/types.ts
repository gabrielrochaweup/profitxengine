// Formato normalizado que todo adapter de área de membros precisa produzir
// a partir do payload cru daquela plataforma. Adicionar uma plataforma
// nova = um arquivo novo aqui dentro implementando essa mesma forma, sem
// mexer em schema nem na rota de webhook — mesmo padrão dos adapters de
// checkout (src/lib/tracking/checkout-adapters).
export interface NormalizedMembersAreaEvent {
  email: string | null;
  phone: string | null;
  ref: string | null;
  externalId: string | null;
  occurredAt: string | null;
}

// Retorna null quando o payload não representa o evento "aluno ganhou
// acesso" pra essa plataforma (ex: outro tipo de evento chegando na mesma
// URL — não é erro, só é ignorado).
export type MembersAreaAdapter = (rawPayload: unknown) => NormalizedMembersAreaEvent | null;
