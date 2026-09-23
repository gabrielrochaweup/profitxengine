import { NextResponse } from "next/server";
import { getSessionProfile, ehAprovado } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { carregarAlunos, resumoDeAlunos } from "@/lib/tracking/alunos";

// Quem comprou, em que plano está, se já assinou o contrato, se já criou
// conta no Pepe e se já depositou na corretora — com e-mail e telefone à
// mão, porque a razão de existir desta tela é cobrar quem ficou pelo
// caminho.
//
// A montagem mora em @/lib/tracking/alunos: o resumo do Dashboard usa a
// mesma, e duas cópias dariam dois números diferentes pra mesma pergunta.
//
// Admin only: é uma lista de contatos de clientes.

export async function GET(request: Request) {
  const profile = await getSessionProfile();
  if (!ehAprovado(profile)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const productId = new URL(request.url).searchParams.get("product_id");
  if (!productId) return NextResponse.json({ error: "product_id é obrigatório." }, { status: 400 });

  const alunos = await carregarAlunos(createAdminClient(), productId);
  const resumo = resumoDeAlunos(alunos);

  return NextResponse.json({
    alunos,
    total: resumo.total,
    sem_contrato: resumo.semContrato,
    sem_pepe: resumo.semPepe,
    sem_deposito: resumo.semDeposito,
  });
}
