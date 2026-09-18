import { redirect } from "next/navigation";
import { createClient, getUser, getProfile } from "@/lib/supabase/server";
import { ComunidadeClient } from "./comunidade-client";

/**
 * Comunidade — salas permanentes com chat em tempo real.
 *
 * A carga inicial vem do servidor (salas, pessoas, não lidas) pra tela já
 * abrir com conteúdo; o tempo real assume daí em diante. Todas as consultas
 * passam pelo cliente com sessão do usuário, então o RLS é quem decide o que
 * aparece — sala privada não chega aqui pra ser filtrada na tela.
 */
export default async function ComunidadePage() {
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const supabase = createClient();
  const { data: profile } = await getProfile(user.id);

  const [{ data: salas }, { data: pessoas }, { data: membros }, { data: naoLidas }] = await Promise.all([
    supabase.from("community_rooms").select("*").order("created_at"),
    supabase.from("profiles").select("id, full_name, role, status").eq("status", "approved").order("full_name"),
    supabase.from("community_room_members").select("room_id, user_id, papel"),
    supabase.rpc("community_nao_lidas"),
  ]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ComunidadeClient
        meuId={user.id}
        meuNome={profile?.full_name?.trim() || "Sem nome"}
        souAdminDoApp={profile?.role === "admin"}
        podeCriarSala={profile?.role === "admin" || profile?.role === "editor"}
        pessoas={(pessoas ?? []).map((p) => ({
          id: p.id,
          // Sem nome preenchido, o e-mail seria o fallback natural — mas ele
          // não vem de profiles, e expor e-mail de todo mundo numa lista de
          // chat é outra decisão. "Sem nome" é honesto e a pessoa resolve no
          // próprio perfil.
          nome: p.full_name?.trim() || "Sem nome",
          role: p.role,
        }))}
        salasIniciais={salas ?? []}
        membrosIniciais={membros ?? []}
        naoLidasIniciais={naoLidas ?? []}
        // O botão de entrar só liga quando as três chaves do LiveKit estão
        // no ambiente. Sem elas, a tela diz isso em vez de abrir uma chamada
        // que não conecta.
        chamadaDisponivel={
          !!process.env.LIVEKIT_URL && !!process.env.LIVEKIT_API_KEY && !!process.env.LIVEKIT_API_SECRET
        }
      />
    </div>
  );
}
