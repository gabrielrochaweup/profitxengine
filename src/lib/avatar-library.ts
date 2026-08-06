import { createClient } from "@/lib/supabase/client";

/**
 * Sorteia uma foto do banco de avatares sem repetir nenhuma até todas terem
 * sido usadas — quando o ciclo atual esgota, reseta e começa de novo (tipo
 * baralho embaralhado). Retorna null se o pool ainda estiver vazio.
 */
export async function pickAvatar(): Promise<string | null> {
  const supabase = createClient();

  async function unusedCandidates() {
    const { data } = await supabase.from("avatar_library").select("id, url").is("last_used_at", null);
    return data ?? [];
  }

  let candidates = await unusedCandidates();

  if (candidates.length === 0) {
    const { count } = await supabase.from("avatar_library").select("id", { count: "exact", head: true });
    if (!count) return null;
    await supabase.from("avatar_library").update({ last_used_at: null }).not("id", "is", null);
    candidates = await unusedCandidates();
    if (candidates.length === 0) return null;
  }

  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  await supabase.from("avatar_library").update({ last_used_at: new Date().toISOString() }).eq("id", chosen.id);
  return chosen.url;
}
