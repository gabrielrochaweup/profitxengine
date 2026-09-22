import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// /api/tracking: chamado por navegadores de visitantes anônimos (pixel.js,
// collect) e por sistemas externos sem sessão Supabase (webhooks da
// corretora/área de membros/checkout) — cada rota faz sua própria checagem
// (token de webhook, ou getSessionProfile+hasRole pra /endpoints), então não
// pode ficar atrás do redirect pra /login do middleware.
const PUBLIC_PATHS = ["/login", "/auth/callback", "/api/tracking", "/blog-publico"];

// Hosts que são o PRÓPRIO app. Qualquer outro Host que chegue aqui é domínio
// de cliente apontado pra cá por CNAME, e vai pro blog. A lista é por
// exclusão porque os domínios de blog entram e saem pelo painel — manter uma
// lista deles no código significaria um deploy a cada domínio novo.
//
// Os domínios PRÓPRIOS da Engine, ao contrário, mudam quase nunca — e por
// isso ficam aqui no código, não só em variável de ambiente.
//
// Isso não é preferência de estilo: a Engine ganhou o domínio
// engine.escolaprofitx.com num servidor onde APP_HOSTS_EXTRA não estava
// definida, e o efeito foi o app INTEIRO virar "blog de cliente" — todo
// request reescrito pra /blog-publico/engine.escolaprofitx.com/..., que não
// existe. A tela caía em erro 500 sem nada no log que apontasse pro
// middleware. Uma lista de hosts próprios no código transforma esse modo de
// falha (silencioso, em produção, longe da causa) em nada.
//
// APP_HOSTS_EXTRA continua valendo e soma a esta lista: serve pra domínio
// novo entrar sem deploy, ou pra ambiente de teste.
const HOSTS_DO_APP = ["engine.escolaprofitx.com"];

function ehHostDoApp(host: string): boolean {
  const limpo = host.split(":")[0].toLowerCase();
  if (limpo === "localhost" || limpo === "127.0.0.1") return true;
  if (limpo.endsWith(".vercel.app")) return true;
  if (HOSTS_DO_APP.includes(limpo)) return true;
  const extras = (process.env.APP_HOSTS_EXTRA ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return extras.includes(limpo);
}

export async function updateSession(request: NextRequest) {
  // Domínio de cliente (modo subdomínio): vira o blog antes de qualquer
  // checagem de sessão. Um visitante anônimo do blog não tem — e não deve
  // ter — login no app.
  const host = request.headers.get("host") ?? "";
  if (host && !ehHostDoApp(host)) {
    const destino = request.nextUrl.clone();
    destino.pathname = `/blog-publico/${host.split(":")[0].toLowerCase()}${request.nextUrl.pathname}`;
    return NextResponse.rewrite(destino);
  }

  // Repassa a rota atual como header pros Server Components conseguirem ler
  // via headers() — usado em (app)/layout.tsx pra checar acesso por
  // produto (Server Components não têm acesso direto ao pathname).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Repassa a identidade JA VALIDADA aqui pro render, pra o layout nao
  // repetir a mesma checagem em rede. auth.getUser() sempre vai ao Supabase
  // (por design, nunca confia so no cookie), e nesse app cada ida custa
  // ~200ms — pagar duas vezes pela mesma resposta, em toda navegacao, era
  // ~20% do tempo de abrir qualquer pagina.
  //
  // Escrito SEMPRE, inclusive vazio: assim um header forjado que venha de
  // fora e sobrescrito antes de chegar no render. Todas as rotas de pagina
  // passam por aqui (o matcher so exclui asset estatico), e quem nao passar
  // cai no caminho normal, que refaz a chamada de verdade.
  requestHeaders.set("x-user-id", user?.id ?? "");
  requestHeaders.set("x-user-email", user?.email ?? "");
  supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  const isPublicPath = PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path));

  if (!user && !isPublicPath) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && request.nextUrl.pathname === "/login") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
