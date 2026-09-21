import type { Adapter } from "../tipos";
import { adapterGenerico } from "./generico";
import { cademiAdapter, hotmartAdapter, onprofitAdapter } from "./plataformas-br";
import { stripeAdapter } from "./stripe";

/*
  O catálogo de plataformas.

  Plataforma nova = um arquivo de adapter + uma linha aqui + o nome na lista
  de `plataformas` da fonte, no tracking.config.ts. Nada de schema muda,
  nenhuma rota muda.

  A chave é o que fica gravado em tracking_webhook_endpoints.platform e no
  campo `source` de cada evento — então evite renomear depois: o histórico
  já gravado continuaria com o nome antigo.
*/
export const ADAPTERS: Record<string, Adapter> = {
  stripe: stripeAdapter,
  hotmart: hotmartAdapter,
  onprofit: onprofitAdapter,
  cademi: cademiAdapter,
  generico: adapterGenerico,
};

export const PLATAFORMAS = Object.keys(ADAPTERS);

/**
 * Plataformas cuja autenticação NÃO é o token do kit.
 *
 * O Stripe assina o corpo com o `whsec_…` em vez de mandar Authorization.
 * Quem estiver nesta lista tem a checagem trocada em webhook-auth.ts.
 */
export const PLATAFORMAS_COM_ASSINATURA = new Set(["stripe"]);

export function adapterDe(plataforma: string | null | undefined): Adapter {
  if (!plataforma) return adapterGenerico;
  return ADAPTERS[plataforma] ?? adapterGenerico;
}
