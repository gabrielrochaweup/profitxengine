// Formato normalizado que todo adapter de ferramenta precisa produzir.
// Mesmo padrão dos adapters de checkout, área de membros e contrato.
export interface NormalizedToolEvent {
  /**
   * "tool_signup" = criou conta na ferramenta · "tool_access" = entrou pela
   * primeira vez · "members_reengagement_sent" = a pessoa recebeu um
   * convite pra voltar a acessar a área de membros (não confirma que ela
   * voltou — só que o convite saiu; ver sendpulse-reengajamento.ts).
   */
  kind: "tool_signup" | "tool_access" | "members_reengagement_sent";
  email: string | null;
  phone: string | null;
  name: string | null;
  ref: string | null;
  externalId: string | null;
  occurredAt: string | null;
  /** Plano que a ferramenta conhece pra essa pessoa (ex: "pro"). */
  plano: string | null;
}

// Retorna null quando o payload não é um dos eventos que interessam — não é
// erro, só é ignorado.
export type ToolAdapter = (rawPayload: unknown) => NormalizedToolEvent | null;
