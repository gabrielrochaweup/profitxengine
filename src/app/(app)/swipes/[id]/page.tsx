import { notFound, redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { PageContainer } from "@/components/ui/page";
import { SwipeDetalhe } from "./swipe-detalhe";

export default async function SwipePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  // O RLS já barra swipe de produto a que a pessoa não tem acesso: aí ele
  // simplesmente não vem, e a tela cai no 404.
  const { data: swipe } = await supabase.from("swipes").select("*").eq("id", params.id).maybeSingle();
  if (!swipe) notFound();

  return (
    <PageContainer largura="padrao">
      <SwipeDetalhe inicial={swipe} />
    </PageContainer>
  );
}
