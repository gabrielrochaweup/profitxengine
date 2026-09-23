import { NextResponse } from "next/server";
import { getSessionProfile, ehAprovado } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { SENDPULSE_KEYS } from "@/lib/sendpulse/config-keys";

// Configuração dos endereços de evento do SendPulse + histórico de
// disparos. Admin only: o endereço do Automation360 é a credencial do
// disparo (quem tem a URL dispara), mesmo modelo dos endpoints de webhook.

export async function GET(request: Request) {
  const profile = await getSessionProfile();
  if (!ehAprovado(profile)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const productId = new URL(request.url).searchParams.get("product_id");
  if (!productId) return NextResponse.json({ error: "product_id é obrigatório." }, { status: 400 });

  const admin = createAdminClient();

  const [{ data: settings }, { data: log }] = await Promise.all([
    admin.from("sendpulse_settings").select("key, url, enabled").eq("product_id", productId),
    admin
      .from("sendpulse_dispatch_log")
      .select("id, tipo, email, phone, plano, destino, status, erro, teste, created_at, sent_at")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const porChave = new Map((settings ?? []).map((s) => [s.key, s]));

  return NextResponse.json({
    settings: SENDPULSE_KEYS.map((key) => ({
      key,
      url: porChave.get(key)?.url ?? "",
      enabled: porChave.get(key)?.enabled ?? false,
    })),
    log: log ?? [],
    // Teste não entra na conta: o contador existe pra dizer quantos alunos
    // foram avisados de verdade.
    enviados: (log ?? []).filter((l) => l.status === "enviado" && !l.teste).length,
    falhas: (log ?? []).filter((l) => l.status === "falhou" && !l.teste).length,
  });
}

export async function PUT(request: Request) {
  const profile = await getSessionProfile();
  if (!ehAprovado(profile)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const productId: string | undefined = body?.product_id;
  const items: unknown = body?.items;

  if (!productId || !Array.isArray(items)) {
    return NextResponse.json({ error: "product_id e items são obrigatórios." }, { status: 400 });
  }

  const linhas = items
    .filter((item): item is { key: string; url?: unknown; enabled?: unknown } =>
      typeof item === "object" && item !== null && typeof (item as { key?: unknown }).key === "string"
    )
    // Só chaves conhecidas: evita encher a tabela de configuração com
    // qualquer coisa que venha no corpo da requisição.
    .filter((item) => SENDPULSE_KEYS.includes(item.key))
    .map((item) => ({
      product_id: productId,
      key: item.key,
      url: typeof item.url === "string" ? item.url.trim() : "",
      enabled: item.enabled === true,
      updated_at: new Date().toISOString(),
    }));

  if (linhas.length === 0) {
    return NextResponse.json({ error: "Nenhuma chave válida enviada." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("sendpulse_settings").upsert(linhas, { onConflict: "product_id,key" });

  if (error) {
    return NextResponse.json({ error: "Falha ao salvar." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
