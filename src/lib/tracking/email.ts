/**
 * E-mail como ele é gravado e comparado em todo o tracking: sem espaço nas
 * pontas e em minúsculas.
 *
 * Existe como função única porque a regra precisa ser idêntica em todos os
 * adapters — quando não era, um e-mail com maiúscula vindo da plataforma
 * ficava gravado assim e nenhuma busca normalizada o encontrava depois. O
 * aluno tinha comprado e assinado, e o funil dele era bloqueado com "sem
 * compra reconhecida", sem erro nenhum que denunciasse a causa.
 */
export function normalizarEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const limpo = value.trim().toLowerCase();
  return limpo || null;
}
