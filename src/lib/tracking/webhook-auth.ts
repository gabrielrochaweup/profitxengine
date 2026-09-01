import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/crypto";
import type { Database } from "@/lib/supabase/types";

type WebhookEndpoint = Database["public"]["Tables"]["tracking_webhook_endpoints"]["Row"];

type ResolveResult = { endpoint: WebhookEndpoint } | { error: string; status: number };

// Confere o token contra o segredo cadastrado pra esse slug, e que o
// endpoint é do "kind" esperado — evita que o slug de um endpoint de
// checkout seja aceito na rota de webhook da corretora, por exemplo, mesmo
// que alguém descubra a URL. Aceita o token de duas formas: header
// "Authorization: Bearer <token>" (padrão, preferido) OU query string
// "?token=<token>" — algumas plataformas (ex: o painel da corretora) não
// têm campo pra header customizado no webhook, só uma URL simples, então
// o token embutido na própria URL é a única forma delas autenticarem.
export async function resolveWebhookEndpoint(
  slug: string,
  kind: WebhookEndpoint["kind"],
  request: Request
): Promise<ResolveResult> {
  const authorizationHeader = request.headers.get("authorization");
  const queryToken = new URL(request.url).searchParams.get("token");
  const token = authorizationHeader?.replace(/^Bearer\s+/i, "").trim() || queryToken?.trim();
  if (!token) return { error: "Token ausente.", status: 401 };

  const admin = createAdminClient();
  const { data: endpoint } = await admin
    .from("tracking_webhook_endpoints")
    .select("*")
    .eq("endpoint_slug", slug)
    .eq("kind", kind)
    .eq("active", true)
    .maybeSingle();

  if (!endpoint) return { error: "Endpoint não encontrado.", status: 404 };

  let expectedToken: string;
  try {
    expectedToken = decryptSecret(endpoint.encrypted_secret);
  } catch {
    return { error: "Configuração inválida.", status: 500 };
  }

  if (token !== expectedToken) return { error: "Token inválido.", status: 401 };

  return { endpoint };
}
