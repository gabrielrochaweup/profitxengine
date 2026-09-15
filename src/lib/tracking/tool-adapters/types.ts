// Formato normalizado que todo adapter de ferramenta precisa produzir.
// Mesmo padrão dos adapters de checkout, área de membros e contrato.
export interface NormalizedToolEvent {
  /** "tool_signup" = criou conta na ferramenta · "tool_access" = entrou pela primeira vez. */
  kind: "tool_signup" | "tool_access";
  email: string | null;
  phone: string | null;
  name: string | null;
  ref: string | null;
  externalId: string | null;
  occurredAt: string | null;
  /** Plano que a ferramenta conhece pra essa pessoa (ex: "pro"). */
  plano: string | null;
}

// Retorna null quando o payload não é um dos dois eventos que interessam —
// não é erro, só é ignorado.
export type ToolAdapter = (rawPayload: unknown) => NormalizedToolEvent | null;
