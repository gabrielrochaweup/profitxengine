// Compartilhado entre as duas rotas de BM. Fica aqui, e não no route.ts:
// arquivo de rota no App Router só pode exportar os métodos HTTP e um punhado
// de campos de configuração — qualquer outro export quebra o build.

export const CAMPOS_BM =
  "id, platform, nome, external_id, status, contas, paginas, observacoes, created_at, updated_at";

export const STATUS_BM = ["ativa", "pronta", "restrita", "bloqueada"] as const;
export type StatusBm = (typeof STATUS_BM)[number];

export const STATUS_BM_LABEL: Record<StatusBm, string> = {
  ativa: "Ativa",
  pronta: "Pronta para uso",
  restrita: "Com restrição",
  bloqueada: "Bloqueada",
};

export function ehStatusBm(v: unknown): v is StatusBm {
  return typeof v === "string" && (STATUS_BM as readonly string[]).includes(v);
}

/** Conta itens de uma lista digitada uma por linha, ignorando linhas vazias. */
export function contarLinhas(texto: string): number {
  return texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean).length;
}
