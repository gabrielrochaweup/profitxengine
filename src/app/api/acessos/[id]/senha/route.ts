import { NextResponse } from "next/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/crypto";

// A senha sai só por aqui, uma de cada vez, quando alguém clica em
// "mostrar". Separar da listagem é o que impede a tela inteira de carregar
// com todas as senhas em claro dentro do HTML — bastaria abrir o inspetor
// pra ver todas de uma vez, sem clicar em nada.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "editor")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data } = await admin.from("acessos").select("encrypted_senha").eq("id", params.id).single();

  if (!data?.encrypted_senha) {
    return NextResponse.json({ error: "Esse acesso não tem senha guardada." }, { status: 404 });
  }

  try {
    return NextResponse.json({ senha: decryptSecret(data.encrypted_senha) });
  } catch {
    return NextResponse.json({ error: "Não foi possível abrir a senha guardada." }, { status: 500 });
  }
}
