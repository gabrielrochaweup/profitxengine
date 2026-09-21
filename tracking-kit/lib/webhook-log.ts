import "server-only";
import { clienteDeServico } from "./supabase";

/**
 * Registra a chamada — e nunca derruba o webhook por causa disso.
 *
 * Se a gravação do log falhar, o evento real já foi processado: falhar aqui
 * faria a plataforma reenviar uma venda que já está no banco.
 *
 * `accepted = false` cobre duas situações diferentes, e o texto do erro é o
 * que as distingue: payload ignorado de propósito (a origem manda tipos de
 * evento que a gente não escuta) versus recusa de verdade. A tela mostra os
 * dois com pesos diferentes — se tratasse os dois como falha, o painel
 * apitaria todo dia por comportamento correto do sistema.
 */
export async function registrarChamada(
  endpointId: string,
  rawPayload: unknown,
  accepted: boolean,
  erro?: string | null
): Promise<void> {
  try {
    await clienteDeServico()
      .from("tracking_webhook_log")
      .insert({
        endpoint_id: endpointId,
        raw_payload: (rawPayload ?? {}) as Record<string, unknown>,
        accepted,
        error: erro ?? null,
      });
  } catch {
    // best-effort de propósito
  }
}
