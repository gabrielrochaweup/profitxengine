export const FUNCOES = ["suporte", "comercial"] as const;
export type Funcao = (typeof FUNCOES)[number];

export const FUNCAO_LABEL: Record<Funcao, string> = {
  suporte: "Suporte",
  comercial: "Comercial",
};

export function ehFuncao(v: unknown): v is Funcao {
  return typeof v === "string" && (FUNCOES as readonly string[]).includes(v);
}

/**
 * Paleta fixa pra marcar o número — hex direto, não token de tema: a cor é
 * uma etiqueta escolhida pela pessoa, não parte do design system, e deve
 * parecer a mesma coisa no claro e no escuro (mesmo padrão do PIE_PALETTE
 * em analytics/components/chart-parts.tsx).
 */
export const CORES_NUMERO = [
  { valor: "#4aa8e8", nome: "Azul" },
  { valor: "#22c55e", nome: "Verde" },
  { valor: "#eab308", nome: "Amarelo" },
  { valor: "#f97316", nome: "Laranja" },
  { valor: "#ef4444", nome: "Vermelho" },
  { valor: "#ec4899", nome: "Rosa" },
  { valor: "#a855f7", nome: "Roxo" },
  { valor: "#14b8a6", nome: "Verde-água" },
  { valor: "#64748b", nome: "Cinza" },
] as const;

export const COR_PADRAO = CORES_NUMERO[0].valor;

/** Só os dígitos — é o formato que o link do WhatsApp (wa.me) espera. */
export function apenasDigitos(numero: string): string {
  return numero.replace(/\D/g, "");
}

export function linkWhatsapp(numero: string): string | null {
  const digitos = apenasDigitos(numero);
  return digitos.length >= 8 ? `https://wa.me/${digitos}` : null;
}
