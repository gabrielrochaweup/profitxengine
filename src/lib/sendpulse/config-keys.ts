// Chaves de configuração dos endereços do SendPulse. Sem "server-only" de
// propósito: o painel (client component) monta os campos a partir daqui, e
// o motor de disparo resolve o endereço com a mesma função — se a chave
// divergisse entre os dois, o endereço colado no painel nunca seria
// encontrado na hora de enviar, e a mensagem sumiria sem erro.

export const SENDPULSE_TIPOS = [
  {
    tipo: "boasvindas",
    titulo: "Boas-vindas",
    descricao: "Dispara na compra aprovada, uma vez por plano alcançado. Não depende de contrato assinado.",
  },
  {
    tipo: "contrato",
    titulo: "Pós-contrato",
    descricao:
      "Dispara quando o contrato é assinado, uma vez por documento. Só sai para quem já tem compra na Onprofit ou acesso em área de membros.",
  },
] as const;

export type SendPulseTipo = (typeof SENDPULSE_TIPOS)[number]["tipo"];

// "geral" é a reserva: cobre plano sem endereço próprio e plano novo que
// ainda não tem evento montado no SendPulse.
export const SENDPULSE_ALVOS = ["starter", "pro", "elite", "geral"] as const;
export type SendPulseAlvo = (typeof SENDPULSE_ALVOS)[number];

export const ALVO_LABEL: Record<SendPulseAlvo, string> = {
  starter: "Starter",
  pro: "Pró",
  elite: "Elite",
  geral: "Geral (reserva)",
};

export function sendpulseKey(tipo: SendPulseTipo, alvo: SendPulseAlvo | string): string {
  return `${tipo}_${alvo}`;
}

export const SENDPULSE_KEYS: string[] = SENDPULSE_TIPOS.flatMap((t) =>
  SENDPULSE_ALVOS.map((alvo) => sendpulseKey(t.tipo, alvo))
);
