import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { ProfileSettings } from "@/components/profile-settings";

export default async function PerfilPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  return (
    <div>
      <h1 className="text-[22px] font-semibold leading-tight text-text-primary">Configurações do Perfil</h1>
      <p className="mt-1 max-w-[70ch] text-[13px] text-text-secondary">Seu nome e senha de acesso.</p>

      <div className="mt-6">
        <ProfileSettings userId={profile.userId} email={profile.email} initialFullName={profile.fullName} />
      </div>
    </div>
  );
}
