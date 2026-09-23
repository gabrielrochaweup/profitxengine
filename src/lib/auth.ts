import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

export interface SessionProfile {
  userId: string;
  email: string | null;
  role: UserRole;
  fullName: string | null;
  /** 'approved' | 'pending' | 'rejected' — quem aprova é o admin, em Admin > Equipe. */
  status: string;
}

export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, status")
    .eq("id", user.id)
    .single();

  return {
    userId: user.id,
    email: user.email ?? null,
    role: profile?.role ?? "editor",
    fullName: profile?.full_name ?? null,
    // Sem perfil, o mais restritivo: uma linha que sumiu não vira acesso.
    status: profile?.status ?? "pending",
  };
}

const ROLE_RANK: Record<UserRole, number> = { viewer: 0, editor: 1, admin: 2 };

export function hasRole(role: UserRole, min: UserRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

/**
 * O portão das rotas de API que servem uma tela aberta a toda a equipe.
 *
 * Aprovado é a decisão de confiança (a mesma da migration 0112). Checar aqui
 * e não só o papel importa porque a API não passa pelo (app)/layout.tsx: quem
 * está pendente não abre a tela, mas alcançaria a rota direto com a sessão na
 * mão.
 */
export function ehAprovado(profile: SessionProfile | null): profile is SessionProfile {
  return !!profile && profile.status === "approved";
}
