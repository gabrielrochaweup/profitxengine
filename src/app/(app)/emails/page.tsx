import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { PageContainer, PageHeader } from "@/components/ui/page";
import { EmailsClient } from "./emails-client";

export default async function EmailsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const { data: campaigns } = await supabase
    .from("email_campaigns")
    .select("*")
    .order("scheduled_date", { ascending: false });

  return (
    <PageContainer largura="padrao">
      <PageHeader
        titulo="E-mails"
        descricao="Escreve a campanha do dia a partir das notícias do calendário — assunto, preview e corpo — e guarda com status."
      />
      <EmailsClient initialCampaigns={campaigns ?? []} currentUserId={user.id} />
    </PageContainer>
  );
}
