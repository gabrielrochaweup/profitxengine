// Formato normalizado que todo adapter de corretora precisa produzir a
// partir do payload cru daquela plataforma. Adicionar uma corretora nova =
// um arquivo novo aqui dentro implementando essa mesma forma, sem mexer em
// schema nem na rota de webhook — mesmo padrão dos adapters de checkout e
// área de membros.
export interface NormalizedBrokerEvent {
  eventType: "broker_signup" | "broker_deposit";
  email: string | null;
  ref: string | null;
  externalId: string | null;
  amountCents: number | null;
  occurredAt: string | null;
}

// Retorna null quando o payload não representa um evento que rastreamos
// pra essa corretora (outro tipo de evento chegando na mesma URL, teste
// de conectividade sem "method" reconhecido, etc.) — não é erro, só é
// ignorado.
export type BrokerAdapter = (rawPayload: unknown) => NormalizedBrokerEvent | null;
