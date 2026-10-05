import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

interface MatchLeadInput {
  productId: string;
  ref: string | null | undefined;
  email: string | null | undefined;
  phone: string | null | undefined;
}

// ATENÇÃO: esta não é a mesma normalização de normalizarTelefone() em
// src/lib/sendpulse/dispatch.ts, e as duas não devem ser unificadas. Aqui o
// telefone é uma CHAVE DE COMPARAÇÃO, e o DDI é removido justamente pra que
// o mesmo número escrito de formas diferentes case. Lá ele é o formato que o
// SendPulse exige pra achar o contato do WhatsApp, e o +55 é obrigatório.
//
// Só dígitos, sem o "55" de DDI do Brasil na frente — deixa "+55 11
// 98765-4321", "11987654321" e "5511987654321" todos virando a mesma
// string pra comparar. Numeros de fora do Brasil com DDI de 2 dígitos
// coincidindo com "55" por acaso são um risco aceito (raro nesse produto).
function normalizePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  return digits.length > 11 && digits.startsWith("55") ? digits.slice(2) : digits;
}

// Resolve a qual lead um evento externo (checkout/área de membros/corretora)
// pertence — usado pelos 3 webhooks. Prioridade: "ref" (o próprio lead_id
// gerado na landing, preciso), e-mail já salvo nesse lead, e por último
// telefone já salvo — uma segunda camada além do e-mail pra quando a pessoa
// usa e-mails diferentes em cada etapa da jornada mas o mesmo telefone.
// Não importa qual camada bateu o match, se o evento trouxe e-mail/telefone
// que o lead ainda não tinha, grava isso nele — é isso que habilita casar
// por e-mail ou telefone eventos futuros que não conseguirem propagar o ref
// (ex: se a corretora não conseguir repassar o parâmetro em algum fluxo).
//
// somenteLeitura: só descobre o lead, sem gravar e-mail/telefone nele. É o que
// o checkout em modo teste usa — conferir um pedido não pode mexer no lead.
export async function matchLead(
  supabase: SupabaseClient<Database>,
  { productId, ref, email, phone }: MatchLeadInput,
  opcoes: { somenteLeitura?: boolean } = {}
): Promise<string | null> {
  const normalizedEmail = email?.trim().toLowerCase() || null;
  const normalizedPhone = phone ? normalizePhone(phone) : null;

  let lead: { id: string; email: string | null; phone: string | null } | null = null;

  if (ref) {
    const { data } = await supabase
      .from("tracking_leads")
      .select("id, email, phone")
      .eq("id", ref)
      .eq("product_id", productId)
      .maybeSingle();
    lead = data;
  }

  if (!lead && normalizedEmail) {
    const { data } = await supabase
      .from("tracking_leads")
      .select("id, email, phone")
      .eq("product_id", productId)
      .eq("email", normalizedEmail)
      .order("first_seen_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    lead = data;
  }

  if (!lead && normalizedPhone) {
    const { data } = await supabase
      .from("tracking_leads")
      .select("id, email, phone")
      .eq("product_id", productId)
      .eq("phone", normalizedPhone)
      .order("first_seen_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    lead = data;
  }

  if (!lead) return null;

  const backfill: Database["public"]["Tables"]["tracking_leads"]["Update"] = {};
  if (normalizedEmail && !lead.email) backfill.email = normalizedEmail;
  if (normalizedPhone && !lead.phone) backfill.phone = normalizedPhone;
  if (!opcoes.somenteLeitura && Object.keys(backfill).length > 0) {
    await supabase.from("tracking_leads").update(backfill).eq("id", lead.id);
  }

  return lead.id;
}
