import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

interface MatchLeadInput {
  productId: string;
  ref: string | null | undefined;
  email: string | null | undefined;
}

// Resolve a qual lead um evento externo (checkout/área de membros/corretora)
// pertence — usado pelos 3 webhooks. Prioridade: "ref" (o próprio lead_id
// gerado na landing, preciso) e, se não vier ou não bater, e-mail já salvo
// nesse lead. Quando bate por ref e o evento trouxe e-mail que o lead ainda
// não tinha, grava esse e-mail no lead — é isso que habilita casar por
// e-mail eventos futuros que não conseguirem propagar o ref (ex: se a
// corretora não conseguir repassar o parâmetro em algum fluxo).
export async function matchLead(
  supabase: SupabaseClient<Database>,
  { productId, ref, email }: MatchLeadInput
): Promise<string | null> {
  const normalizedEmail = email?.trim().toLowerCase() || null;

  if (ref) {
    const { data: lead } = await supabase
      .from("tracking_leads")
      .select("id, email")
      .eq("id", ref)
      .eq("product_id", productId)
      .maybeSingle();

    if (lead) {
      if (normalizedEmail && !lead.email) {
        await supabase.from("tracking_leads").update({ email: normalizedEmail }).eq("id", lead.id);
      }
      return lead.id;
    }
  }

  if (normalizedEmail) {
    const { data: lead } = await supabase
      .from("tracking_leads")
      .select("id")
      .eq("product_id", productId)
      .eq("email", normalizedEmail)
      .order("first_seen_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lead) return lead.id;
  }

  return null;
}
