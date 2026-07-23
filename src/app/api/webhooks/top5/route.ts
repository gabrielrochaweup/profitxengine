import "server-only";
import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWebhookSecret } from "@/lib/webhook-secrets";
import type { Top5Config } from "@/lib/supabase/types";

function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Endpoint pra automação externa (ex: a corretora) atualizar o TOP 5
 * acumulado de uma dinâmica em tempo real, sem depender de alguém abrir a
 * tela de Gerenciar Dinâmicas. Autenticado por um segredo compartilhado
 * (header x-webhook-secret), gerado/rotacionado na tela de Configurações —
 * não por sessão de usuário, por isso usa o client admin (service role) em
 * vez do client de cookies.
 *
 * Body esperado: { dynamicId?: string, dynamicSlug?: string, values: number[] }
 * (identifique a dinâmica por um dos dois; values = até 5 valores em dólar,
 * do 1º ao 5º lugar).
 */
export async function POST(request: Request) {
  const provided = request.headers.get("x-webhook-secret");
  const expected = await getWebhookSecret("top5");
  if (!expected || !provided || !secretsMatch(provided, expected)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const dynamicId = typeof body?.dynamicId === "string" ? body.dynamicId : undefined;
  const dynamicSlug = typeof body?.dynamicSlug === "string" ? body.dynamicSlug : undefined;
  const values = body?.values;

  if (!Array.isArray(values) || values.length === 0 || values.some((v) => typeof v !== "number")) {
    return NextResponse.json({ error: '"values" precisa ser um array de números.' }, { status: 400 });
  }
  if (!dynamicId && !dynamicSlug) {
    return NextResponse.json({ error: 'Informe "dynamicId" ou "dynamicSlug".' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const top5_config: Top5Config = { enabled: true, values: values.slice(0, 5) };

  const query = supabase.from("message_dynamics").update({ top5_config }).select("id");
  const { data, error } = dynamicId ? await query.eq("id", dynamicId) : await query.eq("slug", dynamicSlug as string);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Dinâmica não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, updated: data.length });
}
