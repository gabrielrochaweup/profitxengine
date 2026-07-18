import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
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
    <div>
      <h1 className="text-[28px] font-semibold text-text-primary">E-mails</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Gere e organize campanhas de e-mail vinculadas ao calendário, com sugestões de notícias financeiras.
      </p>
      <div className="mt-6">
        <EmailsClient initialCampaigns={campaigns ?? []} currentUserId={user.id} />
      </div>
    </div>
  );
}
