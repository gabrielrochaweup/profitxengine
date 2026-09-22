import { createClient } from "@/lib/supabase/server";
import { redirecionar } from "@/lib/redirecionar";

export async function POST() {
  const supabase = createClient();
  await supabase.auth.signOut();
  // Location relativo: `new URL("/login", request.url)` mandava pra
  // https://localhost:3400/login na VPS (ver redirecionar.ts). E 303, não
  // 307, porque isto aqui é um POST: com 307 o navegador reenviaria /login
  // como POST.
  return redirecionar("/login");
}
