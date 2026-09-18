import Link from "next/link";
import { Newspaper } from "lucide-react";
import { createClient, getUser, getProfile } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { getNicheNews } from "@/lib/news/niche-feeds";
import { getActiveProduct } from "@/lib/products-server";
import { getNavItems } from "@/lib/products";
import { PageContainer } from "@/components/ui/page";

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

async function getData() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();

  const [profileRes, prompts] = await Promise.all([
    user ? getProfile(user.id) : Promise.resolve({ data: null }),
    supabase.from("prompts").select("id", { count: "exact", head: true }),
  ]);

  const activeProduct = user ? await getActiveProduct(user.id, profileRes.data?.role === "admin") : null;
  const { items: news, label } = await getNicheNews(activeProduct?.niche).catch(() => ({ items: [], label: "" }));

  return {
    fullName: profileRes.data?.full_name ?? null,
    email: user?.email ?? null,
    schemaReady: !prompts.error,
    topNews: news[0] ?? null,
    newsLabel: label,
    productSlug: activeProduct?.slug ?? null,
  };
}

export default async function DashboardPage() {
  const data = await getData();
  const displayName = data.fullName || data.email || "";
  const greeting = getGreeting();
  // Puxa direto do mesmo menu lateral do produto ativo — nunca fica
  // desatualizado quando uma ferramenta nova entra, e já respeita o que é
  // exclusivo de cada produto (ex: Dinâmicas do Dia só existe pro PROFITX).
  const shortcuts = data.productSlug
    ? getNavItems(data.productSlug).filter((item) => item.href !== "/dashboard")
    : [];

  return (
    <PageContainer largura="padrao">
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

      {/* A saudação ocupava a dobra inteira: 56px de texto e 112px de respiro
          antes de aparecer a primeira coisa clicável. Ela continua sendo a
          abertura da tela, só que sem empurrar os atalhos pra fora da vista. */}
      <div className="flex flex-col items-center py-8 text-center sm:py-12">
        <h1 className="text-[26px] font-bold leading-tight text-text-primary sm:text-[32px]">
          {greeting}{displayName ? `, ${displayName}` : ""}!
        </h1>
        <p className="mt-1.5 text-[13px] text-text-secondary sm:text-sm">Comece a criar.</p>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {shortcuts.map((shortcut) => (
          <Link
            key={shortcut.href}
            href={shortcut.href}
            className="flex flex-col items-center gap-2.5 rounded-card bg-card p-4 text-center shadow-card transition-colors duration-150 hover:bg-card-hover hover:shadow-[0_0_0_1px_var(--accent)] sm:p-5"
          >
            {/* Ícone num quadrado de raio 10, o mesmo do cartão que o contém.
                Círculo era o único elemento 100% arredondado que sobrou. */}
            <div className="flex h-11 w-11 items-center justify-center rounded-card bg-accent/15 text-accent-text">
              <shortcut.icon size={20} />
            </div>
            {/* O nome da ferramenta é o conteúdo do cartão, não uma legenda. */}
            <span className="text-[13px] font-medium text-text-primary">{shortcut.label}</span>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
