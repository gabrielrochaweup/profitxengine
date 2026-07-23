import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();
  await supabase.auth.signOut();
  // Sem status explícito, NextResponse.redirect usa 307, que preserva o
  // método original (POST) — o navegador reenvia /login como POST em vez de
  // um GET normal, deixando a página num estado inconsistente até um reload
  // manual. 303 força o navegador a seguir com GET.
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
