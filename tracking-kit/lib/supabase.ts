import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/*
  As duas conexões que o kit usa.

  Se o seu projeto já tem helpers de Supabase (a maioria tem), APAGUE este
  arquivo e aponte os imports pros seus. Ele existe pro kit rodar sozinho,
  não pra competir com o que você já tem.

  A distinção que importa:

  - clienteDeServico() ignora RLS. É o que grava webhook e evento do pixel,
    porque nesses caminhos não existe usuário logado — quem autoriza é o
    token/assinatura do endpoint. NUNCA use num caminho que responda a uma
    sessão de navegador.

  - a leitura do painel deve usar a sessão da pessoa, com RLS ligado (o
    cliente de servidor do @supabase/ssr, que o seu projeto já configura).
    É assim que tracking_pode_ver() vira a única regra de acesso.
*/

let servico: SupabaseClient | null = null;

export function clienteDeServico(): SupabaseClient {
  if (servico) return servico;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.");
  }

  servico = createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return servico;
}
