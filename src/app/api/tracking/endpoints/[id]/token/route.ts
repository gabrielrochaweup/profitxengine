import { NextResponse } from "next/server";
import { getSessionProfile, ehAprovado } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/crypto";

/**
 * Devolve o token de um endpoint, pra copiar o token ou a URL com token
 * depois da criação.
 *
 * Antes o token só aparecia uma vez, na janela de criação — e reconfigurar
 * a plataforma do outro lado (ou colar num painel novo, como o da Vortex)
 * obrigava a rotacionar, o que derrubava a integração que já funcionava.
 * Quem configura as conexões é a equipe aprovada (mesma regra do resto do
 * Tracking desde a 0113), então é ela que pode ler.
 *
 * Nunca vai em cache nem em log: sai só nesta resposta.
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const profile = await getSessionProfile();
  if (!ehAprovado(profile)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: endpoint } = await admin
    .from("tracking_webhook_endpoints")
    .select("encrypted_secret")
    .eq("id", params.id)
    .maybeSingle();

  if (!endpoint) return NextResponse.json({ error: "Endpoint não encontrado." }, { status: 404 });

  try {
    return NextResponse.json(
      { token: decryptSecret(endpoint.encrypted_secret) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Falha ao ler o token." }, { status: 500 });
  }
}
