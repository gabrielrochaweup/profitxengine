import { CalendarDays, Mail, Library, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

async function getCounts() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [prompts, conversations, engagementToday, emailsToday] = await Promise.all([
    supabase.from("prompts").select("id", { count: "exact", head: true }),
    supabase.from("fake_conversations").select("id", { count: "exact", head: true }),
    supabase
      .from("engagement_messages")
      .select("id", { count: "exact", head: true })
      .eq("scheduled_date", today),
    supabase
      .from("email_campaigns")
      .select("id", { count: "exact", head: true })
      .eq("scheduled_date", today),
  ]);

  return {
    prompts: prompts.count ?? 0,
    conversations: conversations.count ?? 0,
    engagementToday: engagementToday.count ?? 0,
    emailsToday: emailsToday.count ?? 0,
    schemaReady: !prompts.error,
  };
}

export default async function DashboardPage() {
  const counts = await getCounts();

  const stats = [
    { label: "Mensagens do grupo hoje", value: counts.engagementToday, icon: CalendarDays },
    { label: "E-mails agendados hoje", value: counts.emailsToday, icon: Mail },
    { label: "Conversas simuladas", value: counts.conversations, icon: MessageSquare },
    { label: "Prompts salvos", value: counts.prompts, icon: Library },
  ];

  return (
    <div>
      <h1 className="text-[28px] font-semibold text-text-primary">Dashboard</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Visão geral do que foi gerado hoje e pendências do calendário.
      </p>

      {!counts.schemaReady && (
        <Card className="mt-6 border-warning/40 bg-warning/10 px-5 py-4 text-sm text-warning">
          O schema do banco ainda não foi aplicado no Supabase. Rode a migration em{" "}
          <code className="rounded bg-black/20 px-1 py-0.5">supabase/migrations/0001_init.sql</code>{" "}
          no SQL Editor do seu projeto.
        </Card>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">{stat.label}</span>
              <stat.icon size={16} className="text-text-muted" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-text-primary">{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6 px-6 py-10 text-center text-sm text-text-muted">
        Atalhos rápidos e cruzamento de temas entre módulos chegam nas próximas fases.
      </Card>
    </div>
  );
}
