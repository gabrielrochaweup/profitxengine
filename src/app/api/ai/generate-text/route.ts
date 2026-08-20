import { NextResponse } from "next/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { getDecryptedKey, getProviderSettings, incrementPromptUsage } from "@/lib/ai/credentials";
import { generateText } from "@/lib/ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { getApprovalContext, formatApprovalContext } from "@/lib/performance/message-approval";
import type { AiModule, AiProvider } from "@/lib/supabase/types";

// Geração de texto (principalmente conversas com várias mensagens) pode
// passar do limite padrão de função serverless do Vercel (10s) — isso
// cortava a resposta no meio, virando JSON inválido do lado do cliente.
export const maxDuration = 60;

interface GenerateTextBody {
  module: AiModule;
  prompt: string;
  system?: string;
  promptId?: string;
  provider?: AiProvider;
  model?: string;
  /** Se informado, injeta o contexto de aprovação (Dia/Semana/Mês/Geral) desse escopo no prompt. */
  performanceScope?: "grupo" | "direct";
}

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "editor")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = (await request.json()) as GenerateTextBody;
  if (!body.module || !body.prompt) {
    return NextResponse.json({ error: "module e prompt são obrigatórios." }, { status: 400 });
  }

  // Tudo a partir daqui (inclusive ler/descriptografar a chave salva) entra
  // no try — se CREDENTIALS_ENCRYPTION_KEY estiver ausente ou diferente da
  // que criptografou a chave original, decryptSecret() lança uma exceção;
  // fora do try isso escapava cru e virava um 500 sem JSON pro cliente.
  try {
    const settings = body.provider
      ? { provider: body.provider, model: body.model ?? "gpt-4o-mini" }
      : await getProviderSettings(body.module);

    const apiKey = await getDecryptedKey(settings.provider);
    if (!apiKey) {
      return NextResponse.json(
        { error: `Nenhuma chave válida configurada para ${settings.provider}. Configure em Configurações.` },
        { status: 422 }
      );
    }

    const performanceContext = body.performanceScope
      ? formatApprovalContext(await getApprovalContext(body.performanceScope))
      : undefined;

    const result = await generateText(
      {
        prompt: body.prompt,
        system: body.system,
        performanceContext,
        provider: settings.provider,
        model: settings.model,
      },
      apiKey
    );

    const admin = createAdminClient();
    await admin.from("ai_usage_log").insert({
      module: body.module,
      provider: settings.provider,
      model: settings.model,
      tokens_used: result.tokensUsed,
      created_by: profile.userId,
    });

    if (body.promptId) {
      await incrementPromptUsage(body.promptId);
    }

    return NextResponse.json({ text: result.text, provider: settings.provider, model: settings.model });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao gerar texto." },
      { status: 502 }
    );
  }
}
