import { NextResponse } from "next/server";
import { getSessionProfile, ehAprovado } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispararTeste } from "@/lib/sendpulse/dispatch";
import { PLANOS, type Plano } from "@/lib/sendpulse/planos";

// Dispara de verdade no SendPulse, pelo painel, pra conferir a ligação sem
// precisar comprar o curso de novo. Admin only, como todo o resto da
// configuração.

// O POST pro SendPulse tem timeout de 8s e acontece dentro desta
// requisição. O padrão de 10s do Vercel mataria a função no meio do envio,
// e o painel mostraria erro numa mensagem que talvez tenha saído.
export const maxDuration = 30;

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!ehAprovado(profile)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const productId: string | undefined = body?.product_id;
  const tipo = body?.tipo;
  const email: string | undefined = body?.email;

  if (!productId || !email) {
    return NextResponse.json({ error: "product_id e email são obrigatórios." }, { status: 400 });
  }
  if (tipo !== "boas_vindas" && tipo !== "contrato") {
    return NextResponse.json({ error: "tipo inválido." }, { status: 400 });
  }

  const planoBruto = typeof body?.plano === "string" ? body.plano : "";
  const plano: Plano | null = PLANOS.includes(planoBruto as Plano) ? (planoBruto as Plano) : null;

  const resultado = await dispararTeste(createAdminClient(), {
    productId,
    tipo,
    plano,
    email,
    phone: typeof body?.phone === "string" ? body.phone : null,
    nome: typeof body?.nome === "string" ? body.nome : null,
  });

  return NextResponse.json(resultado);
}
