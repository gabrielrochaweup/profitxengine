import { NextResponse } from "next/server";
import { getSessionProfile, ehAprovado } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * "Essa resposta te ajudou? Salvar no FAQ."
 *
 * Salva o par pergunta + resposta: a resposta é a mensagem da Egi, e a
 * pergunta é a mensagem da pessoa logo antes dela. Pelo servidor porque a
 * mensagem precisa ser marcada como salva (e isso o navegador não escreve)
 * e porque aqui dá pra conferir que a conversa é de quem está salvando.
 */
export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!ehAprovado(profile)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { mensagemId?: string } | null;
  if (!body?.mensagemId) return NextResponse.json({ error: "mensagemId é obrigatório." }, { status: 400 });

  const admin = createAdminClient();
  const { data: resposta } = await admin
    .from("egi_mensagens")
    .select("id, conversa_id, papel, conteudo, faq_id, created_at, egi_conversas!inner(user_id, product_id)")
    .eq("id", body.mensagemId)
    .maybeSingle();

  const conversa = resposta?.egi_conversas as unknown as { user_id: string; product_id: string } | undefined;
  if (!resposta || !conversa || conversa.user_id !== profile.userId || resposta.papel !== "assistant") {
    return NextResponse.json({ error: "Mensagem não encontrada." }, { status: 404 });
  }
  if (resposta.faq_id) return NextResponse.json({ faqId: resposta.faq_id, jaSalva: true });

  const { data: pergunta } = await admin
    .from("egi_mensagens")
    .select("conteudo")
    .eq("conversa_id", resposta.conversa_id)
    .eq("papel", "user")
    .lt("created_at", resposta.created_at)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: faq, error } = await admin
    .from("egi_faq")
    .insert({
      product_id: conversa.product_id,
      pergunta: pergunta?.conteudo ?? "(pergunta não encontrada)",
      resposta: resposta.conteudo,
      created_by: profile.userId,
    })
    .select("id")
    .single();
  if (error || !faq) return NextResponse.json({ error: "Falha ao salvar no FAQ." }, { status: 500 });

  await admin.from("egi_mensagens").update({ faq_id: faq.id }).eq("id", resposta.id);
  return NextResponse.json({ faqId: faq.id });
}
