import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

export interface SessionProfile {
  userId: string;
  email: string | null;
  role: UserRole;
  fullName: string | null;
}

export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  return {
    userId: user.id,
    email: user.email ?? null,
    role: profile?.role ?? "editor",
    fullName: profile?.full_name ?? null,
  };
}

const ROLE_RANK: Record<UserRole, number> = { viewer: 0, editor: 1, admin: 2 };

export function hasRole(role: UserRole, min: UserRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}
