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
import { getCryptoNews } from "@/lib/news/crypto-feeds";

const SHORTCUTS = [
  { href: "/conversas", label: "Simulador de Conversas", icon: MessageSquare },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/dinamicas-do-dia", label: "Dinâmicas do Dia", icon: Zap },
  { href: "/mensagens-x1", label: "Mensagens X1", icon: UsersRound },
  { href: "/emails", label: "E-mails", icon: Mail },
  { href: "/prompts", label: "Biblioteca de Prompts", icon: Library },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

async function getData() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();

  const [profileRes, prompts, news] = await Promise.all([
    user ? getProfile(user.id) : Promise.resolve({ data: null }),
    supabase.from("prompts").select("id", { count: "exact", head: true }),
    getCryptoNews().catch(() => []),
  ]);

  return {
    fullName: profileRes.data?.full_name ?? null,
    email: user?.email ?? null,
    schemaReady: !prompts.error,
    topNews: news[0] ?? null,
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
            <span className="font-medium text-text-primary">Hoje no cripto:</span> {data.topNews.title}
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

      <div className="flex flex-col items-center py-14 text-center">
        <h1 className="text-5xl font-bold text-text-primary">
          {greeting}{displayName ? `, ${displayName}` : ""}!
        </h1>
        <p className="mt-3 text-base text-text-secondary">Comece a criar.</p>
      </div>

      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {SHORTCUTS.map((shortcut) => (
          <Link
            key={shortcut.href}
            href={shortcut.href}
            className="flex flex-col items-center gap-3 rounded-card border border-border bg-card p-5 text-center transition-colors hover:border-accent hover:bg-card-hover"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
              <shortcut.icon size={22} />
            </div>
            <span className="text-sm font-medium text-text-secondary">{shortcut.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
