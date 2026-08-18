import Link from "next/link";
import {
  CalendarDays,
  Mail,
  Library,
  MessageSquare,
  Zap,
  UsersRound,
  Newspaper,
} from "lucide-react";
import { createClient, getUser, getProfile } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { getNicheNews } from "@/lib/news/niche-feeds";
import { getActiveProduct } from "@/lib/products-server";

const SHORTCUTS = [
  { href: "/conversas", label: "Simulador de Conversas", icon: MessageSquare },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/dinamicas-do-dia", label: "Dinâmicas do Dia", icon: Zap },
  { href: "/mensagens-x1", label: "Mensagens X1", icon: UsersRound },
  { href: "/emails", label: "E-mails", icon: Mail },
  { href: "/prompts", label: "Biblioteca de Prompts", icon: Library },
];

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
  };
}

export default async function DashboardPage() {
  const data = await getData();
  const displayName = data.fullName || data.email || "";
  const greeting = getGreeting();

  return (
    <div>
      {data.topNews && (
        <a
          href={data.topNews.link}
          target="_blank"
          rel="noreferrer"
          className="mb-4 flex items-center gap-2.5 rounded-button border border-border-strong bg-card-hover px-4 py-2 text-xs text-text-secondary hover:border-accent hover:text-text-primary"
        >
          <Newspaper size={14} className="shrink-0 text-accent" />
          <span className="truncate">
            <span className="font-medium text-text-primary">Hoje em {data.newsLabel || "notícias"}:</span>{" "}
            {data.topNews.title}
          </span>
          <span className="ml-auto shrink-0 text-text-muted">{data.topNews.source}</span>
        </a>
      )}

      {!data.schemaReady && (
        <Card className="mb-6 border-warning/40 bg-warning/10 px-5 py-4 text-sm text-warning">
          O schema do banco ainda não foi aplicado no Supabase. Rode a migration em{" "}
          <code className="rounded bg-black/20 px-1 py-0.5">supabase/migrations/0001_init.sql</code>{" "}
          no SQL Editor do seu projeto.
        </Card>
      )}

      <div className="flex flex-col items-center py-6 text-center sm:py-14">
        <h1 className="text-3xl font-bold text-text-primary sm:text-5xl">
          {greeting}{displayName ? `, ${displayName}` : ""}!
        </h1>
        <p className="mt-2 text-sm text-text-secondary sm:mt-3 sm:text-base">Comece a criar.</p>
      </div>

      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {SHORTCUTS.map((shortcut) => (
          <Link
            key={shortcut.href}
            href={shortcut.href}
            className="flex flex-col items-center gap-2 rounded-card border border-border bg-card p-3 text-center transition-colors hover:border-accent hover:bg-card-hover sm:gap-3 sm:p-5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent sm:h-12 sm:w-12">
              <shortcut.icon size={20} />
            </div>
            <span className="text-xs font-medium text-text-secondary sm:text-sm">{shortcut.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
