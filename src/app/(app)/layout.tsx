import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const {
    data: { user },
  } = await getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await getProfile(user.id);

  if (profile?.status && profile.status !== "approved") {
    redirect("/pendente");
  }

  return (
    <div className="flex h-dvh flex-col bg-app md:flex-row md:gap-3 md:p-3">
      <Sidebar
        fullName={profile?.full_name ?? null}
        email={user.email ?? null}
        role={profile?.role ?? "editor"}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-card md:rounded-panel md:border md:border-border">
        <main className="flex-1 overflow-y-auto px-3 pt-3 pb-[max(6rem,calc(env(safe-area-inset-bottom)+5.5rem))] sm:px-8 sm:pt-6 sm:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
