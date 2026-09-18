import { redirect } from "next/navigation";
import { Clock, LogOut } from "lucide-react";
import { getUser, getProfile } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function PendentePage() {
  const {
    data: { user },
  } = await getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await getProfile(user.id);

  if (profile?.status === "approved") {
    redirect("/dashboard");
  }

  const isRejected = profile?.status === "rejected";

  return (
    <div className="flex min-h-screen items-center justify-center bg-app px-4">
      <Card className="w-full max-w-sm p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent-text">
          <Clock size={22} />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-text-primary">
          {isRejected ? "Cadastro não aprovado" : "Aguardando aprovação"}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          {isRejected
            ? "Seu cadastro não foi aprovado por um administrador. Entre em contato com a equipe se acha que isso é um engano."
            : "Seu cadastro foi enviado e está aguardando aprovação de um administrador. Você recebe acesso assim que for aprovado."}
        </p>

        <form action="/auth/logout" method="post" className="mt-6">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-button border border-border-strong px-4 py-2 text-sm text-text-secondary hover:bg-card-hover"
          >
            <LogOut size={15} />
            Sair
          </button>
        </form>
      </Card>
    </div>
  );
}
