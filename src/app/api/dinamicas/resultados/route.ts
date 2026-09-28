import { NextResponse } from "next/server";
import { getSessionProfile, ehAprovado, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/crypto";
import { getActiveProduct } from "@/lib/products-server";
import {
  VORTEX_RESULTADOS_URL,
  diaEmSaoPaulo,
  lerResultadoVortex,
  processarResultado,
} from "@/lib/resultados/vortex";

// Hoje + até 7 dias pra trás: de manhã o dia de hoje ainda não foi lançado
// (a equipe salva o placar à noite), e "Dia" nas mensagens é lido como "de
// ontem". Voltar até o último dia lançado reproduz exatamente o estado que
// o webhook teria deixado — inclusive numa segunda-feira depois de um fim
// de semana sem operação.
const DIAS_PRA_TRAS = 7;

async function buscarNaVortex(token: string, data: string): Promise<{ status: number; json: unknown }> {
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), 10_000);
  try {
    const res = await fetch(`${VORTEX_RESULTADOS_URL}?data=${data}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: controle.signal,
    });
    return { status: res.status, json: await res.json().catch(() => null) };
  } finally {
    clearTimeout(limite);
  }
}

/**
 * Botão "Atualizar resultados" da tela da dinâmica.
 *
 * Mesma permissão de quem edita o placar à mão (editor ou admin): grava nos
 * resultados que vão pras mensagens. A escrita é pela service key, então a
 * checagem tem que ser aqui.
 */
export async function POST() {
  const profile = await getSessionProfile();
  if (!ehAprovado(profile) || !hasRole(profile.role, "editor")) {
    return NextResponse.json({ ok: false, erro: "Sem permissão pra atualizar os resultados." }, { status: 403 });
  }

  const product = await getActiveProduct(profile.userId);
  if (!product) return NextResponse.json({ ok: false, erro: "Nenhum produto ativo." }, { status: 400 });

  const admin = createAdminClient();
  const { data: endpoint } = await admin
    .from("tracking_webhook_endpoints")
    .select("id, encrypted_secret")
    .eq("product_id", product.id)
    .eq("kind", "daily_results")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!endpoint) {
    return NextResponse.json(
      {
        ok: false,
        erro: "Ainda não existe o endpoint de Resultados do dia. Crie em Tracking → Configurações → Fontes de dados e cole a URL e o token na Vortex.",
      },
      { status: 409 }
    );
  }

  let token: string;
  try {
    token = decryptSecret(endpoint.encrypted_secret);
  } catch {
    return NextResponse.json({ ok: false, erro: "Falha ao ler o token do endpoint." }, { status: 500 });
  }

  for (let diasAtras = 0; diasAtras <= DIAS_PRA_TRAS; diasAtras++) {
    const data = diaEmSaoPaulo(diasAtras);

    let resposta: { status: number; json: unknown };
    try {
      resposta = await buscarNaVortex(token, data);
    } catch {
      return NextResponse.json({ ok: false, erro: "A Vortex não respondeu a tempo. Tente de novo em instantes." }, { status: 502 });
    }

    if (resposta.status === 401) {
      return NextResponse.json(
        {
          ok: false,
          erro: "A Vortex recusou o token. Confira se o token colado lá é o deste endpoint (se o token foi rotacionado aqui, ele precisa ser colado de novo lá).",
        },
        { status: 502 }
      );
    }
    if (resposta.status < 200 || resposta.status >= 300) {
      return NextResponse.json({ ok: false, erro: `A Vortex respondeu com erro (${resposta.status}).` }, { status: 502 });
    }

    const lido = lerResultadoVortex(resposta.json);
    if ("erro" in lido) {
      return NextResponse.json({ ok: false, erro: `Resposta da Vortex não reconhecida: ${lido.erro}` }, { status: 502 });
    }
    if (!lido.preenchido) continue;

    const resultado = await processarResultado(admin, product.id, resposta.json, "botao");
    if ("erro" in resultado) {
      return NextResponse.json({ ok: false, erro: resultado.erro }, { status: 502 });
    }
    return NextResponse.json({ ok: true, resultado, voltouDias: diasAtras });
  }

  return NextResponse.json({
    ok: false,
    erro: `Nenhum dia lançado na Vortex entre hoje e ${DIAS_PRA_TRAS} dias atrás.`,
  });
}
