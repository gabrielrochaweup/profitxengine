import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldAlert } from "@/components/ui/icones";
import { createClient, getUser, getProfile } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function SemAcessoPage() {
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const { data: profile } = await getProfile(user.id);
  const isAdminUser = profile?.role === "admin";

  const supabase = createClient();
  let hasAnyProduct = isAdminUser;
  if (!isAdminUser) {
    const { count } = await supabase
      .from("product_access")
      .select("product_id", { count: "exact", head: true })
      .eq("user_id", user.id);
    hasAnyProduct = Boolean(count && count > 0);
  }

  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <Card className="p-8">
        <ShieldAlert size={32} className="mx-auto text-text-muted" />
        <h1 className="mt-4 text-lg font-semibold text-text-primary">Sem acesso a esse produto</h1>
        <p className="mt-2 text-sm text-text-secondary">
          {hasAnyProduct
            ? "Você não tem permissão pra ver essa área ainda. Fale com um administrador se achar que deveria ter acesso."
            : "Sua conta ainda não tem nenhum produto liberado. Fale com um administrador pra ganhar acesso."}
        </p>
        {hasAnyProduct && (
          <Link
            href="/dashboard"
            className="mt-5 inline-block rounded-button bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Voltar pro Dashboard
          </Link>
        )}
      </Card>
    </div>
  );
}
