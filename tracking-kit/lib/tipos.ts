/*
  O formato único de evento.

  No projeto de origem havia CINCO contratos de adapter — checkout, área de
  membros, contrato, ferramenta, corretora — cada um com uma rota própria,
  campos ligeiramente diferentes e a etapa do funil fixa no nome do arquivo.
  Acrescentar "cadastro no CRM" significava um quinto tipo, uma quinta rota
  e um quinto if.

  Aqui é um só. O adapter diz QUAL etapa o payload representa, e a mesma
  rota serve pra todas as origens. Um adapter pode devolver mais de um
  evento: uma renovação do Stripe é "renovou" e nada mais, mas um payload de
  assinatura cancelada com reembolso é dois.
*/

export interface EventoNormalizado {
  /** A chave da etapa, como está em tracking.config.ts. */
  tipo: string;

  email: string | null;
  phone: string | null;
  name: string | null;

  /**
   * O lead_id que o site carimbou no link do checkout.
   *
   * É o casamento preciso — e-mail e telefone são o plano B. Cada
   * plataforma o carrega num campo diferente: `client_reference_id` no
   * Stripe, `sck` na Hotmart e na Onprofit, `ref` no genérico.
   */
  ref: string | null;

  amountCents: number | null;
  /** ISO-4217. Quando nulo, o kit usa a moeda padrão do config. */
  currency: string | null;

  offerId: string | null;
  offerName: string | null;
  paymentMethod: string | null;

  /** Id do evento na origem. É ele que torna a reentrega idempotente. */
  externalId: string | null;
  occurredAt: string | null;
}

/**
 * Traduz o payload cru de uma plataforma.
 *
 * Devolve null quando o payload não representa nada que interesse — webhook
 * de teste, evento de outro tipo, ping de conectividade. Isso NÃO é erro: é
 * o caminho normal, e o kit registra como "ignorado", separado de "recusado".
 */
export type Adapter = (raw: unknown) => EventoNormalizado | EventoNormalizado[] | null;

export interface EndpointDeWebhook {
  id: string;
  workspace_id: string;
  kind: string;
  platform: string;
  endpoint_slug: string;
  encrypted_secret: string;
  active: boolean;
}

export function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

export function texto(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

export function numero(valor: unknown): number | null {
  if (typeof valor === "number" && Number.isFinite(valor)) return valor;
  if (typeof valor === "string" && valor.trim() !== "" && Number.isFinite(Number(valor))) return Number(valor);
  return null;
}

/**
 * E-mail como ele é gravado e comparado em todo o kit: sem espaço nas
 * pontas e em minúsculas.
 *
 * Função única porque a regra precisa ser idêntica em todo adapter — quando
 * não era, um e-mail com maiúscula vindo da plataforma ficava gravado assim
 * e nenhuma busca normalizada o encontrava depois. A pessoa tinha comprado,
 * e o funil dela travava sem nenhum erro que denunciasse a causa.
 */
export function normalizarEmail(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const limpo = valor.trim().toLowerCase();
  return limpo || null;
}
