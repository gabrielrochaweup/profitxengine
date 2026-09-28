import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { getActiveProduct } from "@/lib/products-server";
import { PageContainer, PageHeader } from "@/components/ui/page";
import { EgiClient } from "./egi-client";

/**
 * Egi — a IA de atendimento.
 *
 * As conversas são de cada pessoa (o RLS só devolve as dela); o FAQ é da
 * equipe inteira. A carga inicial vem daqui pra tela abrir com a lista já
 * pronta; as mensagens de cada conversa são buscadas ao abrir a conversa.
 */
export default async function EgiPage() {
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const product = await getActiveProduct(user.id);
  if (!product) {
    return (
      <PageContainer largura="padrao">
        <PageHeader titulo="Egi — IA" descricao="Você não tem acesso a nenhum produto ainda." />
      </PageContainer>
    );
  }

  const supabase = createClient();
  const [{ data: conversas }, { data: faq }] = await Promise.all([
    supabase
      .from("egi_conversas")
      .select("id, titulo, created_at, updated_at")
      .eq("product_id", product.id)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("egi_faq")
      .select("id, pergunta, resposta, created_at, updated_at")
      .eq("product_id", product.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <EgiClient productId={product.id} conversasIniciais={conversas ?? []} faqInicial={faq ?? []} />
    </div>
  );
}
