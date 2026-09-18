import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { createClient, getUser, getProfile } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Token de entrada numa chamada.
 *
 * O LiveKit não conhece nossos usuários nem nossas salas: ele confia no token
 * que ESTE servidor assina. Então é aqui que a permissão é decidida, e não no
 * navegador — se a checagem morasse lá, qualquer pessoa pediria um token pra
 * sala privada dos outros.
 *
 * A consulta da sala é feita com a sessão de quem pediu, de propósito: quem
 * decide se ela existe pra essa pessoa é o RLS, o mesmo que decide o chat.
 * Sala privada de outro grupo simplesmente não volta, e o pedido morre aqui.
 */
export async function POST(request: Request) {
  const {
    data: { user },
  } = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const url = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!url || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "As chamadas ainda não estão configuradas neste ambiente." },
      { status: 503 }
    );
  }

  let salaId: string | undefined;
  try {
    salaId = (await request.json())?.sala_id;
  } catch {
    salaId = undefined;
  }
  if (!salaId) {
    return NextResponse.json({ error: "Sala não informada." }, { status: 400 });
  }

  const supabase = createClient();
  const { data: sala } = await supabase.from("community_rooms").select("id, nome").eq("id", salaId).maybeSingle();
  if (!sala) {
    return NextResponse.json({ error: "Sala não encontrada ou sem acesso." }, { status: 403 });
  }

  const { data: profile } = await getProfile(user.id);

  const token = new AccessToken(apiKey, apiSecret, {
    // A identidade é o id do usuário do app: é o que o resto da tela usa pra
    // cruzar participante da chamada com pessoa do painel de membros.
    identity: user.id,
    name: profile?.full_name?.trim() || "Sem nome",
    // Uma pessoa não fica presa numa chamada fantasma se a aba fechar sem
    // avisar.
    ttl: "2h",
  });

  token.addGrant({
    // O nome da sala no LiveKit carrega o id da nossa: duas salas nunca se
    // misturam, e o nome não depende de texto que a equipe pode renomear.
    room: `sala-${sala.id}`,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    // Publicar dado arbitrário no canal da chamada não serve pra nada aqui —
    // o chat é nosso, no banco.
    canPublishData: false,
  });

  return NextResponse.json({ token: await token.toJwt(), url });
}
