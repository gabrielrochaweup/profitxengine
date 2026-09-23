import { Newspaper } from "lucide-react";
import { createClient, getUser, getProfile } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { getNicheNews } from "@/lib/news/niche-feeds";
import { getActiveProduct } from "@/lib/products-server";
import { PageContainer } from "@/components/ui/page";
import { carregarResumoDoDia, type ResumoDoDia } from "./resumo";
import { ResumoDoDiaView } from "./components/resumo-do-dia";

/*
  O Dashboard deixou de ser um menu.

  Antes eram catorze atalhos pras mesmas catorze coisas que a barra lateral
  já lista — a tela mais vista do app não dizia nada sobre o dia. Agora ela
  responde o que está acontecendo, o que está fora do lugar e o que acabou
  de entrar, com link pra onde se resolve cada coisa.
*/

// getHours() usa o fuso do servidor (UTC na Vercel), não o do usuário — como
// o app é só em português pra um público no Brasil, fixamos America/Sao_Paulo
// em vez de depender do fuso de onde a função roda.
function getGreeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date())
  );
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function hojePorExtenso() {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());
}

async function getData() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();

  const [profileRes, prompts] = await Promise.all([
    user ? getProfile(user.id) : Promise.resolve({ data: null }),
    supabase.from("prompts").select("id", { count: "exact", head: true }),
  ]);

  const activeProduct = user ? await getActiveProduct(user.id) : null;

  // A notícia e o resumo vão juntos: um depende de rede externa (feed RSS) e
  // o outro do banco, e não há motivo pra esperar um antes de pedir o outro.
  //
  // O resumo não pode derrubar a home: se uma das leituras falhar (função
  // que não existe ainda no banco, rede caindo), a saudação e a notícia
  // continuam de pé e a seção some.
  const [noticia, resumo] = await Promise.all([
    getNicheNews(activeProduct?.niche).catch(() => ({ items: [], label: "" })),
    activeProduct
      ? carregarResumoDoDia(activeProduct.id).catch((erro) => {
          console.error("[dashboard] falha ao montar o resumo do dia", erro);
          return null;
        })
      : Promise.resolve(null),
  ]);

  return {
    fullName: profileRes.data?.full_name ?? null,
    email: user?.email ?? null,
    schemaReady: !prompts.error,
    topNews: noticia.items[0] ?? null,
    newsLabel: noticia.label,
    resumo: resumo as ResumoDoDia | null,
    temProduto: !!activeProduct,
  };
}

export default async function DashboardPage() {
  const data = await getData();
  const displayName = data.fullName || data.email || "";

  return (
    // Largura cheia só aqui: o Dashboard é leitura de relance, e um painel
    // de vigia não se lê em coluna de 1280px com metade da tela vazia dos
    // dois lados. O resto do app segue com a largura de leitura.
    <PageContainer largura="amplo">
      {data.topNews && (
        <a
          href={data.topNews.link}
          target="_blank"
          rel="noreferrer"
          className="mb-4 flex items-center gap-2.5 rounded-button border border-border-strong bg-card-hover px-4 py-2 text-xs text-text-secondary hover:border-accent hover:text-text-primary"
        >
          <Newspaper size={14} className="shrink-0 text-accent-text" />
          <span className="truncate">
            <span className="font-medium text-text-primary">Hoje em {data.newsLabel || "notícias"}:</span>{" "}
            {data.topNews.title}
          </span>
          <span className="ml-auto shrink-0 text-text-tertiary">{data.topNews.source}</span>
        </a>
      )}

      {!data.schemaReady && (
        <Card className="mb-6 border-warning/40 bg-warning/10 px-5 py-4 text-sm text-warning">
          O schema do banco ainda não foi aplicado no Supabase. Rode a migration em{" "}
          <code className="rounded bg-black/20 px-1 py-0.5">supabase/migrations/0001_init.sql</code>{" "}
          no SQL Editor do seu projeto.
        </Card>
      )}

      {/* A saudação encolheu: ela abria a tela com 112px de respiro antes da
          primeira informação útil. Continua sendo a primeira linha, agora do
          tamanho de uma primeira linha — e centralizada, porque em tela cheia
          um título encostado na esquerda de 1920px fica órfão do conteúdo que
          ele abre. */}
      <div className="mb-7 flex flex-col items-center gap-1 text-center">
        <h1 className="text-[24px] font-bold leading-tight text-text-primary">
          {getGreeting()}
          {displayName ? `, ${displayName}` : ""}!
        </h1>
        <p className="text-[12px] capitalize text-text-tertiary">{hojePorExtenso()}</p>
      </div>

      {data.resumo ? (
        <ResumoDoDiaView resumo={data.resumo} />
      ) : (
        <Card className="px-5 py-4 text-sm text-text-secondary">
          {data.temProduto
            ? "Não deu pra montar o resumo de hoje agora. Atualize a página em alguns segundos."
            : "Você ainda não tem acesso a nenhum produto — peça a um admin pra liberar."}
        </Card>
      )}
    </PageContainer>
  );
}
