import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { matchLead } from "@/lib/tracking/match-lead";

// Disparado pelo Vercel Cron (ver vercel.json). Existe porque webhooks de
// plataformas diferentes pra uma mesma compra podem chegar fora de ordem —
// já vimos na prática a Cademi entregar o "acesso à área de membros" antes
// da Onprofit entregar a "compra" que teria gravado o e-mail no lead (a
// Onprofit demorou ~77s pra disparar o webhook dela depois de confirmar a
// compra internamente). Nesse instante o e-mail ainda não existia no lead,
// então o matchLead() retornou null corretamente — o evento fica de verdade
// sem correspondência até essa varredura rodar de novo e achar o lead que
// só ganhou o e-mail depois.
//
// Só re-tenta por e-mail (não por telefone) porque telefone não é uma
// coluna própria em tracking_events, só existe dentro do raw_payload de
// cada plataforma — extrair isso aqui exigiria reimplementar o parsing de
// cada adapter. Cobre o caso real que motivou isso; ref nunca ajudaria
// aqui, porque um evento sem ref na hora não ganha ref depois.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const admin = createAdminClient();
  const since = new Date();
  since.setHours(since.getHours() - 48);

  const { data: unmatched, error } = await admin
    .from("tracking_events")
    .select("id, product_id, email")
    .is("lead_id", null)
    .not("email", "is", null)
    .gte("received_at", since.toISOString());

  if (error) {
    return NextResponse.json({ error: "Falha ao buscar eventos sem lead." }, { status: 500 });
  }

  let matched = 0;
  for (const event of unmatched ?? []) {
    // eslint-disable-next-line no-await-in-loop
    const leadId = await matchLead(admin, {
      productId: event.product_id,
      ref: null,
      email: event.email,
      phone: null,
    });
    if (leadId) {
      // eslint-disable-next-line no-await-in-loop
      await admin.from("tracking_events").update({ lead_id: leadId }).eq("id", event.id);
      matched += 1;
    }
  }

  return NextResponse.json({ ok: true, checked: unmatched?.length ?? 0, matched });
}
