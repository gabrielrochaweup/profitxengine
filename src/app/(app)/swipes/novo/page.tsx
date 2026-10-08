import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { getActiveProduct } from "@/lib/products-server";
import { PageContainer, PageHeader } from "@/components/ui/page";
import { NovoSwipe } from "./novo-swipe";

export default async function NovoSwipePage() {
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const activeProduct = await getActiveProduct(user.id);
  if (!activeProduct) redirect("/swipes");

  return (
    <PageContainer largura="padrao">
      <PageHeader
        titulo="Novo swipe"
        descricao="Cole o JSON do produto pra preencher tudo de uma vez, ou preencha campo a campo. Nada é salvo antes de você revisar."
      />
      <NovoSwipe productId={activeProduct.id} userId={user.id} />
    </PageContainer>
  );
}
