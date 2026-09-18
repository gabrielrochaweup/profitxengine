import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { ProfileSettings } from "@/components/profile-settings";
import { PageContainer, PageHeader } from "@/components/ui/page";

export default async function PerfilPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  return (
    // Dois campos e um botão: largura focada, não a tela inteira.
    <PageContainer largura="focado">
      <PageHeader titulo="Configurações do Perfil" descricao="Seu nome e senha de acesso." />
      <ProfileSettings userId={profile.userId} email={profile.email} initialFullName={profile.fullName} />
    </PageContainer>
  );
}
