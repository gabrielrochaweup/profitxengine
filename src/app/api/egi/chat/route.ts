import { NextResponse } from "next/server";
import { getSessionProfile, ehAprovado } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveProduct } from "@/lib/products-server";
import { getDecryptedKey, getProviderSettings } from "@/lib/ai/credentials";
import { generateText } from "@/lib/ai";
import type { ChatMessage } from "@/lib/ai/types";
import { montarSistemaDaEgi } from "@/lib/egi/sistema";
import { tituloDaConversa } from "@/lib/egi/texto";

// O manual inteiro vai no contexto a cada pergunta: com modelos maiores, a
// resposta pode passar dos 10s padrão da função.
export const maxDuration = 60;

// Quantas mensagens anteriores da conversa voltam pro modelo. O manual já
// está no system; o histórico é pra entender "e se ele disser X?" no meio
// da conversa, não pra carregar o dia inteiro.
const HISTORICO = 20;

/**
 * Uma pergunta pra Egi.
 *
 * A pergunta e a resposta só são gravadas DEPOIS que a IA respondeu: se a
 * chamada falhar, nada fica pela metade, e a pessoa tenta de novo com o
 * mesmo texto sem duplicar a pergunta na conversa.
 */
export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!ehAprovado(profile)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { conversaId?: string | null; mensagem?: string } | null;
  const mensagem = body?.mensagem?.trim();
  if (!mensagem) return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 });

  const product = await getActiveProduct(profile.userId);
  if (!product) return NextResponse.json({ error: "Nenhum produto ativo." }, { status: 400 });

  const admin = createAdminClient();

  // Conversa existente: confere que é de quem pergunta.
  let historico: ChatMessage[] = [];
  if (body?.conversaId) {
    const { data: conversa } = await admin
      .from("egi_conversas")
      .select("id")
      .eq("id", body.conversaId)
      .eq("user_id", profile.userId)
      .maybeSingle();
    if (!conversa) return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });

    const { data: anteriores } = await admin
      .from("egi_mensagens")
      .select("papel, conteudo")
      .eq("conversa_id", conversa.id)
      .order("created_at", { ascending: false })
      .limit(HISTORICO);
    historico = (anteriores ?? [])
      .reverse()
      .map((m) => ({ role: m.papel as ChatMessage["role"], content: m.conteudo }));
  }

  try {
    const { system, vazio } = await montarSistemaDaEgi(admin, product.id);
    if (vazio) {
      return NextResponse.json(
        { error: "A Egi ainda não tem prompt nem arquivos. Configure em Configurações → Egi — IA." },
        { status: 422 }
      );
    }

    const settings = await getProviderSettings("egi");
    const apiKey = await getDecryptedKey(settings.provider);
    if (!apiKey) {
      return NextResponse.json(
        { error: `Nenhuma chave válida para ${settings.provider}. Configure em Configurações.` },
        { status: 422 }
      );
    }

    const resultado = await generateText(
      {
        prompt: mensagem,
        messages: [...historico, { role: "user", content: mensagem }],
        system,
        cacheSystem: true,
        provider: settings.provider,
        model: settings.model,
      },
      apiKey
    );

    const resposta = resultado.text.trim();
    if (!resposta) return NextResponse.json({ error: "A IA não devolveu resposta. Tente de novo." }, { status: 502 });

    let conversaId = body?.conversaId ?? null;
    if (!conversaId) {
      const { data: nova, error } = await admin
        .from("egi_conversas")
        .insert({ product_id: product.id, user_id: profile.userId, titulo: tituloDaConversa(mensagem) })
        .select("id")
        .single();
      if (error || !nova) throw new Error("Falha ao criar a conversa.");
      conversaId = nova.id;
    }

    // A resposta precisa vir depois da pergunta na ordenação, mesmo gravadas
    // no mesmo instante.
    const agora = Date.now();
    const { data: gravadas, error: erroMensagens } = await admin
      .from("egi_mensagens")
      .insert([
        { conversa_id: conversaId, papel: "user", conteudo: mensagem, created_at: new Date(agora).toISOString() },
        { conversa_id: conversaId, papel: "assistant", conteudo: resposta, created_at: new Date(agora + 1).toISOString() },
      ])
      .select("id, papel, conteudo, faq_id, created_at");
    if (erroMensagens || !gravadas) throw new Error("Falha ao salvar a conversa.");

    const { data: conversa } = await admin
      .from("egi_conversas")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversaId)
      .select("id, titulo, created_at, updated_at")
      .single();

    await admin.from("ai_usage_log").insert({
      module: "egi",
      provider: settings.provider,
      model: settings.model,
      tokens_used: resultado.tokensUsed,
      created_by: profile.userId,
    });

    return NextResponse.json({
      conversa,
      mensagens: gravadas.sort((a, b) => a.created_at.localeCompare(b.created_at)),
    });
  } catch (erro) {
    const detalhe = erro instanceof Error ? erro.message : "erro desconhecido";
    return NextResponse.json({ error: `A Egi não conseguiu responder: ${detalhe}` }, { status: 502 });
  }
}
