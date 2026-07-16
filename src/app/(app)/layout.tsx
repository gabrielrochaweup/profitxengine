import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-app">
      <Sidebar />
      <div className="md:pl-[280px]">
        <Topbar
          fullName={profile?.full_name ?? null}
          email={user.email ?? null}
          role={profile?.role ?? "editor"}
        />
        <main className="px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
