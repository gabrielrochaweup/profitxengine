import { NextResponse } from "next/server";
import { clienteDeServico } from "@/tracking-kit/lib/supabase";
import { cifrar, novoToken } from "@/tracking-kit/lib/cripto";
import { PLATAFORMAS, PLATAFORMAS_COM_ASSINATURA } from "@/tracking-kit/lib/adapters/registro";
import { trackingConfig } from "@/tracking-kit/tracking.config";

/*
  Cadastro dos endpoints de webhook.

  ⚠️  ESTA ROTA NÃO TEM AUTENTICAÇÃO. O kit não conhece o seu login.
  Antes de subir, ponha a checagem do seu projeto nas duas funções abaixo —
  criar endpoint é criar credencial de escrita no seu funil.

  No ENGINE isso era:

    const profile = await getSessionProfile();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }
*/

async function exigirAdmin(): Promise<NextResponse | null> {
  // TODO: troque pela checagem do seu projeto.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Rota de administração sem autenticação. Veja o TODO em tracking-kit/api/endpoints/route.ts." },
      { status: 501 }
    );
  }
  return null;
}

export async function GET(request: Request) {
  const barrado = await exigirAdmin();
  if (barrado) return barrado;

  const workspaceId =
    new URL(request.url).searchParams.get("workspace_id") ?? trackingConfig.workspaceIdPadrao;

  const { data } = await clienteDeServico()
    .from("tracking_webhook_endpoints")
    // O segredo cifrado nunca sai daqui: quem precisa dele é quem cadastra
    // na plataforma, e isso acontece uma vez, na criação.
    .select("id, kind, platform, endpoint_slug, active, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ endpoints: data ?? [] });
}

export async function POST(request: Request) {
  const barrado = await exigirAdmin();
  if (barrado) return barrado;

  const corpo = await request.json().catch(() => null);
  const kind: string | undefined = corpo?.kind;
  const platform: string = corpo?.platform ?? "generico";
  const workspaceId: string = corpo?.workspace_id ?? trackingConfig.workspaceIdPadrao;
  /** Só pro Stripe: o whsec_… que o painel dele mostra ao criar o endpoint. */
  const segredoExterno: string | undefined = corpo?.signing_secret;

  if (!kind || !trackingConfig.fontes.some((f) => f.kind === kind)) {
    return NextResponse.json(
      { error: `kind precisa ser um dos: ${trackingConfig.fontes.map((f) => f.kind).join(", ")}` },
      { status: 400 }
    );
  }
  if (!PLATAFORMAS.includes(platform)) {
    return NextResponse.json({ error: `platform precisa ser uma dos: ${PLATAFORMAS.join(", ")}` }, { status: 400 });
  }

  /*
    Duas naturezas de segredo, e é por isso que o campo é um só no banco:

    - Stripe: o segredo é DELE (whsec_…). A gente guarda pra conferir a
      assinatura — não tem como inventar.
    - Resto: o segredo é NOSSO. A gente gera e a pessoa cola lá.
  */
  const precisaDoSegredoDeles = PLATAFORMAS_COM_ASSINATURA.has(platform);
  if (precisaDoSegredoDeles && !segredoExterno) {
    return NextResponse.json(
      { error: "Essa plataforma assina o webhook: mande o signing_secret dela (whsec_…)." },
      { status: 400 }
    );
  }

  const segredo = precisaDoSegredoDeles ? segredoExterno! : novoToken();
  const slug = `${kind}-${platform}-${Math.random().toString(36).slice(2, 10)}`;

  const { data, error } = await clienteDeServico()
    .from("tracking_webhook_endpoints")
    .insert({
      workspace_id: workspaceId,
      kind,
      platform,
      endpoint_slug: slug,
      encrypted_secret: cifrar(segredo),
    })
    .select("id, kind, platform, endpoint_slug, active")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Falha ao criar endpoint." }, { status: 500 });
  }

  return NextResponse.json({
    endpoint: data,
    url: `/api/tracking/webhooks/${kind}/${slug}`,
    // O token em claro aparece UMA vez. Depois disso ele só existe cifrado
    // — mostrar de novo exigiria decifrar sob demanda, e um segredo que a
    // tela sabe reexibir é um segredo a mais circulando.
    token: precisaDoSegredoDeles ? null : segredo,
    comoAutenticar: precisaDoSegredoDeles
      ? "A plataforma assina o corpo; nada a configurar além de colar a URL lá."
      : "Mande o token em 'Authorization: Bearer <token>' ou em '?token=<token>' na URL.",
  });
}
