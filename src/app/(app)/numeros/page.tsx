import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { getActiveProduct } from "@/lib/products-server";
import { PageContainer, PageHeader } from "@/components/ui/page";
import { NumerosClient } from "./numeros-client";

export default async function NumerosPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const activeProduct = await getActiveProduct(user.id);

  if (!activeProduct) {
    return (
      <PageContainer largura="padrao">
        <PageHeader titulo="Números" descricao="Você não tem acesso a nenhum produto ainda." />
      </PageContainer>
    );
  }

  // A lista de usuários aprovados alimenta o dropdown de "responsável" —
  // o RLS de profiles (migration 0110) já libera isso pra qualquer pessoa
  // aprovada ler, então não precisa de rota de admin nem de service key.
  const [{ data: numeros }, { data: usuarios }] = await Promise.all([
    supabase
      .from("numeros_de_atendimento")
      .select("*")
      .eq("product_id", activeProduct.id)
      .order("funcao")
      .order("nome"),
    supabase.from("profiles").select("id, full_name").eq("status", "approved").order("full_name"),
  ]);

  return (
    <PageContainer largura="padrao">
      <PageHeader
        titulo="Números"
        descricao="Os números de WhatsApp usados pra falar com o cliente, organizados por função e responsável — sem integração, é só pra equipe se achar."
      />
      <NumerosClient
        productId={activeProduct.id}
        currentUserId={user.id}
        initialNumeros={numeros ?? []}
        usuarios={usuarios ?? []}
      />
    </PageContainer>
  );
}
