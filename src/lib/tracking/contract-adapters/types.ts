// Formato normalizado que todo adapter de assinatura de contrato precisa
// produzir a partir do payload cru de quem manda o evento. Mesmo padrão dos
// adapters de checkout e de área de membros (src/lib/tracking/*-adapters).
export interface NormalizedContractEvent {
  email: string | null;
  phone: string | null;
  /** Nome de quem assinou — vai no "Olá, {{nome}}" da mensagem de WhatsApp. */
  name: string | null;
  ref: string | null;
  /** Identificador do documento assinado — é o que impede processar a mesma assinatura duas vezes. */
  externalId: string | null;
  occurredAt: string | null;
}

// Retorna null quando o payload não representa "contrato assinado" (ex:
// evento de documento ainda pendente, ou outro tipo chegando na mesma URL —
// não é erro, só é ignorado).
export type ContractAdapter = (rawPayload: unknown) => NormalizedContractEvent | null;
