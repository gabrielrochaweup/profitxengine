import { NextResponse } from "next/server";
import { adapterDe } from "@/tracking-kit/lib/adapters/registro";
import { autenticarWebhook } from "@/tracking-kit/lib/webhook-auth";
import { gravarEventos } from "@/tracking-kit/lib/ingestao";
import { registrarChamada } from "@/tracking-kit/lib/webhook-log";
import { clienteDeServico } from "@/tracking-kit/lib/supabase";
import { ehEtapaConhecida } from "@/tracking-kit/tracking.config";
import type { EventoNormalizado } from "@/tracking-kit/lib/tipos";

/*
  A rota única de webhook.

  No projeto de origem eram cinco rotas quase idênticas — checkout, área de
  membros, contrato, ferramenta, corretora — e cada fonte nova era copiar
  120 linhas e trocar o adapter e o event_type no meio. Uma delas ficou
  meses com um `matched` que não era usado, porque a cópia original tinha.

  Aqui `kind` e `slug` são a URL, o adapter sai do registro pela plataforma
  do endpoint, e a etapa sai do próprio adapter. Fonte nova não toca nesta
  rota.

  O caminho é: /api/tracking/webhooks/<kind>/<slug>
  Instale copiando este arquivo pra src/app/api/tracking/webhooks/[kind]/[slug]/route.ts
*/

// Cada plataforma testa o webhook de um jeito, e várias testam do próprio
// navegador do painel delas — sem CORS liberado, o preflight falha antes de
// chegar aqui e o suporte deles diz que "a URL está fora do ar". Quem
// autoriza é o token/assinatura, não a origem da chamada.
function cors(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Stripe-Signature",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors() });
}

export async function POST(request: Request, { params }: { params: { kind: string; slug: string } }) {
  const headers = cors();

  /*
    O corpo é lido como TEXTO, e só depois virado JSON.

    Não é preciosismo: a assinatura do Stripe é calculada sobre os bytes
    exatos que ele mandou. `await request.json()` consome o stream e
    reserializar o objeto depois muda espaços e ordem de chaves — a
    assinatura nunca mais bate, e o erro parece "segredo errado".
  */
  const corpoCru = await request.text();

  const auth = await autenticarWebhook(params.slug, params.kind, request, corpoCru);
  if ("erro" in auth) {
    return NextResponse.json({ error: auth.erro }, { status: auth.status, headers });
  }
  const { endpoint } = auth;

  let raw: unknown;
  try {
    raw = JSON.parse(corpoCru);
  } catch {
    await registrarChamada(endpoint.id, { corpo: corpoCru.slice(0, 2000) }, false, "JSON inválido.");
    return NextResponse.json({ error: "JSON inválido." }, { status: 400, headers });
  }

  const adapter = adapterDe(endpoint.platform);
  const saida = adapter(raw);
  const eventos: EventoNormalizado[] = saida === null ? [] : Array.isArray(saida) ? saida : [saida];

  /*
    Payload que nenhum adapter reconhece NÃO é erro.

    É o caminho normal: a plataforma manda dezenas de tipos de evento e a
    gente escuta três. Por isso volta 200 — devolver 4xx faria a origem
    tratar como falha, tentar de novo em backoff e, em alguns painéis,
    desativar o webhook depois de N erros seguidos.

    Fica registrado como "ignorado", e o painel mostra isso separado de
    "recusado": ignorado em massa é como se descobre que a plataforma mudou
    o formato do payload.
  */
  if (eventos.length === 0) {
    await registrarChamada(endpoint.id, raw, false, "Nenhum adapter reconheceu este payload — ignorado.");
    return NextResponse.json({ ok: true, ignorado: true }, { headers });
  }

  const desconhecidas = eventos.map((e) => e.tipo).filter((t) => !ehEtapaConhecida(t));
  if (desconhecidas.length > 0) {
    // Etapa que não está no config é erro de configuração, não de quem
    // chamou — e gravar mesmo assim encheria o funil de etapas fantasma
    // que nenhuma tela sabe mostrar.
    const motivo = `Etapa desconhecida no tracking.config: ${desconhecidas.join(", ")}`;
    await registrarChamada(endpoint.id, raw, false, motivo);
    return NextResponse.json({ error: motivo }, { status: 422, headers });
  }

  const resultado = await gravarEventos(clienteDeServico(), endpoint.workspace_id, endpoint.platform, eventos, raw);

  if (resultado.erro) {
    await registrarChamada(endpoint.id, raw, false, resultado.erro);
    return NextResponse.json({ error: "Falha ao gravar evento." }, { status: 500, headers });
  }

  await registrarChamada(endpoint.id, raw, true);

  return NextResponse.json(
    { ok: true, gravados: resultado.gravados, casados: resultado.casados },
    { headers }
  );
}
