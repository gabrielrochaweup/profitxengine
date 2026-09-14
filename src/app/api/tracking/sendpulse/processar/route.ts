import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processarPendentes } from "@/lib/sendpulse/dispatch";

// Manda os funis que já venceram a carência — a espera existe pra que um
// upsell (Starter e, dois minutos depois, Elite) vire uma mensagem só, do
// maior plano, em vez de duas seguidas.
//
// ATENÇÃO à frequência de quem chama isto. O cron do Vercel aqui está no
// mínimo que o plano permite (uma vez por dia), e só serve de rede de
// segurança: sozinho, ele faria a mensagem de quem comprou às 10h esperar
// até o dia seguinte. Quem entrega no tempo certo são as duas outras
// chamadas — os webhooks de compra e de contrato escoam a fila, e um
// agendador externo (GitHub Actions, cron-job.org, o cron da VPS do
// Vortex) deve bater aqui a cada poucos minutos com o CRON_SECRET.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const resultado = await processarPendentes(createAdminClient());
  return NextResponse.json({ ok: true, ...resultado });
}
