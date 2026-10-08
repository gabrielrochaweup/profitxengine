import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings2 } from "@/components/ui/icones";
import { createClient, getUser } from "@/lib/supabase/server";
import { PageContainer, PageHeader } from "@/components/ui/page";
import { ConversasClient } from "./conversas-client";

export default async function ConversasPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const { data: conversations } = await supabase
    .from("fake_conversations")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <PageContainer largura="padrao">
      <PageHeader
        titulo="Simulador de Conversas"
        descricao="Monte conversas fictícias de WhatsApp, Instagram Direct ou CRM, gere com IA e exporte como imagem."
        acoes={
          // Mesma altura e mesmo contorno dos botões secundários — era um
          // chip solto, com outro tamanho e outro tom, ao lado deles.
          <Link
            href="/conversas/modelos-de-prompt"
            className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-button border border-border bg-card-hover px-2.5 text-xs font-medium text-text-primary transition-colors duration-150 hover:border-border-strong hover:bg-input"
          >
            <Settings2 size={13} />
            Modelos de prompt
          </Link>
        }
      />
      <ConversasClient initialConversations={conversations ?? []} currentUserId={user.id} />
    </PageContainer>
  );
}
