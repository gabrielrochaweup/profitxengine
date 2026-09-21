import "server-only";
import { assinaturaStripeConfere, iguaisEmTempoConstante } from "./assinatura-stripe";
import { decifrar } from "./cripto";
import { PLATAFORMAS_COM_ASSINATURA } from "./adapters/registro";
import type { EndpointDeWebhook } from "./tipos";
import { clienteDeServico } from "./supabase";

/*
  Quem pode gravar evento no seu funil.

  Duas formas de provar, porque as plataformas não concordam:

  1. TOKEN — o padrão. O kit gera, você cola no painel da origem, e ela
     devolve em `Authorization: Bearer <token>` ou em `?token=<token>`. A
     query string existe porque várias plataformas (painéis mais simples,
     integradores) só têm um campo de URL, sem header customizado.

  2. ASSINATURA — o jeito do Stripe. Ele não manda Authorization: assina o
     CORPO da requisição com o `whsec_…` e põe o resultado em
     `Stripe-Signature`. Conferir isso é obrigatório — sem a verificação,
     qualquer um que descubra a URL posta um "checkout.session.completed"
     falso e injeta receita no seu relatório.

  Nos dois casos o slug também precisa bater com o `kind` esperado: o slug
  de um endpoint de checkout não vale na rota de outra fonte, mesmo que
  alguém descubra a URL.
*/

export type ResultadoDaAutenticacao = { endpoint: EndpointDeWebhook } | { erro: string; status: number };

export async function autenticarWebhook(
  slug: string,
  kind: string,
  request: Request,
  /** O corpo CRU, como string. A assinatura do Stripe é sobre os bytes. */
  corpoCru: string
): Promise<ResultadoDaAutenticacao> {
  const admin = clienteDeServico();

  const { data: endpoint } = await admin
    .from("tracking_webhook_endpoints")
    .select("id, workspace_id, kind, platform, endpoint_slug, encrypted_secret, active")
    .eq("endpoint_slug", slug)
    .eq("kind", kind)
    .eq("active", true)
    .maybeSingle();

  if (!endpoint) return { erro: "Endpoint não encontrado.", status: 404 };

  let segredo: string;
  try {
    segredo = decifrar(endpoint.encrypted_secret);
  } catch {
    // Chave de criptografia trocada ou ausente. Não é problema de quem
    // chamou, e o texto genérico é de propósito: erro de configuração não
    // deve virar pista pra quem está sondando a URL.
    return { erro: "Configuração inválida.", status: 500 };
  }

  if (PLATAFORMAS_COM_ASSINATURA.has(endpoint.platform)) {
    const assinatura = request.headers.get("stripe-signature");
    if (!assinatura) return { erro: "Assinatura ausente.", status: 401 };
    if (!assinaturaStripeConfere(corpoCru, assinatura, segredo)) {
      return { erro: "Assinatura inválida.", status: 401 };
    }
    return { endpoint: endpoint as EndpointDeWebhook };
  }

  const cabecalho = request.headers.get("authorization");
  const naQuery = new URL(request.url).searchParams.get("token");
  const token = cabecalho?.replace(/^Bearer\s+/i, "").trim() || naQuery?.trim();
  if (!token) return { erro: "Token ausente.", status: 401 };
  if (!iguaisEmTempoConstante(token, segredo)) return { erro: "Token inválido.", status: 401 };

  return { endpoint: endpoint as EndpointDeWebhook };
}
