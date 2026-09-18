export const CAMPOS_ACESSO =
  "id, nome, categoria, url, usuario, tem_2fa, onde_2fa, responsavel, assinatura, valor_cents, moeda, ciclo, observacoes, created_at, updated_at";

export const CATEGORIAS = ["rede", "ferramenta", "financeiro", "outro"] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  rede: "Rede social",
  ferramenta: "Ferramenta",
  financeiro: "Financeiro",
  outro: "Outro",
};

export const CICLOS = ["mensal", "anual"] as const;
export type Ciclo = (typeof CICLOS)[number];

export const MOEDAS = ["BRL", "USD"] as const;
export type Moeda = (typeof MOEDAS)[number];

export function ehCategoria(v: unknown): v is Categoria {
  return typeof v === "string" && (CATEGORIAS as readonly string[]).includes(v);
}
export function ehCiclo(v: unknown): v is Ciclo {
  return typeof v === "string" && (CICLOS as readonly string[]).includes(v);
}
export function ehMoeda(v: unknown): v is Moeda {
  return typeof v === "string" && (MOEDAS as readonly string[]).includes(v);
}

export interface Acesso {
  id: string;
  nome: string;
  categoria: Categoria;
  url: string | null;
  usuario: string | null;
  tem_2fa: boolean;
  onde_2fa: string | null;
  responsavel: string | null;
  assinatura: boolean;
  valor_cents: number;
  moeda: Moeda;
  ciclo: Ciclo;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  /** Só diz se existe senha guardada; o valor sai por uma chamada própria. */
  tem_senha: boolean;
}

/**
 * Custo mensal de um acesso, em centavos de real.
 *
 * Duas normalizações, e as duas existem pra o total não mentir: anual
 * dividido por 12 (senão uma anuidade de R$ 1.200 apareceria como se fosse
 * o gasto do mês) e dólar convertido (senão US$ 29 somaria como R$ 29).
 * Sem cotação conhecida, o que está em dólar fica de fora da conta em vez
 * de entrar por um número inventado — e a tela diz que ficou.
 */
export function custoMensalCents(acesso: Acesso, cotacaoUsd: number | null): number | null {
  if (!acesso.assinatura || acesso.valor_cents <= 0) return 0;
  const mensal = acesso.ciclo === "anual" ? acesso.valor_cents / 12 : acesso.valor_cents;
  if (acesso.moeda === "BRL") return Math.round(mensal);
  if (cotacaoUsd === null) return null;
  return Math.round(mensal * cotacaoUsd);
}
