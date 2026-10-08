import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { getActiveProduct } from "@/lib/products-server";
import { PageContainer, PageHeader } from "@/components/ui/page";
import { BotaoNovoSwipe } from "./components/botao-novo";
import { SwipesClient } from "./swipes-client";

export default async function SwipesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const activeProduct = await getActiveProduct(user.id);

  if (!activeProduct) {
    return (
      <PageContainer largura="padrao">
        <PageHeader titulo="Swipes" descricao="Você não tem acesso a nenhum produto ainda." />
      </PageContainer>
    );
  }

  const { data: swipes } = await supabase
    .from("swipes")
    .select("*")
    .eq("product_id", activeProduct.id)
    .order("created_at", { ascending: false });

  return (
    <PageContainer largura="amplo">
      <PageHeader
        titulo="Swipes"
        descricao="Produtos concorrentes e inspirações em análise: a oferta, a página, o tráfego e os criativos de cada um, desmontados e lado a lado."
        acoes={<BotaoNovoSwipe />}
      />
      <SwipesClient swipes={swipes ?? []} />
    </PageContainer>
  );
}
