"use client";

import { useState } from "react";
import { Check, X, RotateCcw } from "@/components/ui/icones";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { Database, UserRole, UserStatus } from "@/lib/supabase/types";

type AdminUser = Database["public"]["Functions"]["admin_list_users"]["Returns"][number];

const STATUS_LABEL: Record<UserStatus, string> = {
  pending: "pendente",
  approved: "aprovado",
  rejected: "rejeitado",
};

const STATUS_TONE: Record<UserStatus, "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  editor: "Editor",
  viewer: "Visualizador",
};

interface UsersManagerProps {
  initialUsers: AdminUser[];
  currentUserId: string;
}

export function UsersManager({ initialUsers, currentUserId }: UsersManagerProps) {
  const toast = useToast();
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function updateUser(id: string, patch: { status?: UserStatus; role?: UserRole }) {
    setBusyId(id);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update(patch).eq("id", id);
    if (!error) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
    } else {
      toast.error("Erro ao atualizar o usuário. Tente novamente.");
    }
    setBusyId(null);
  }

  const pending = users.filter((u) => u.status === "pending");
  const others = users.filter((u) => u.status !== "pending");

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-text-primary">
            Aguardando aprovação ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                isSelf={u.id === currentUserId}
                busy={busyId === u.id}
                onApprove={() => updateUser(u.id, { status: "approved" })}
                onReject={() => updateUser(u.id, { status: "rejected" })}
                onRoleChange={(role) => updateUser(u.id, { role })}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-medium text-text-primary">Todos os usuários ({others.length})</h3>
        <div className="space-y-2">
          {others.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              isSelf={u.id === currentUserId}
              busy={busyId === u.id}
              onApprove={() => updateUser(u.id, { status: "approved" })}
              onReject={() => updateUser(u.id, { status: "rejected" })}
              onRevoke={() => updateUser(u.id, { status: "pending" })}
              onRoleChange={(role) => updateUser(u.id, { role })}
            />
          ))}
          {others.length === 0 && <p className="text-sm text-text-muted">Nenhum usuário ainda.</p>}
        </div>
      </div>
    </div>
  );
}

function UserRow({
  user,
  isSelf,
  busy,
  onApprove,
  onReject,
  onRevoke,
  onRoleChange,
}: {
  user: AdminUser;
  isSelf: boolean;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onRevoke?: () => void;
  onRoleChange: (role: UserRole) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">
          {user.full_name || "Sem nome"}
          {isSelf && <span className="ml-1.5 text-xs text-text-muted">(você)</span>}
        </p>
        <p className="truncate text-xs text-text-muted">{user.email}</p>
      </div>

      <Badge tone={STATUS_TONE[user.status]}>{STATUS_LABEL[user.status]}</Badge>

      <Select
        value={user.role}
        onChange={(e) => onRoleChange(e.target.value as UserRole)}
        disabled={busy || isSelf}
        className="h-8 w-32 text-xs"
      >
        {(Object.keys(ROLE_LABEL) as UserRole[]).map((role) => (
          <option key={role} value={role}>
            {ROLE_LABEL[role]}
          </option>
        ))}
      </Select>

      <div className="flex items-center gap-1.5">
        {user.status !== "approved" && (
          <Button type="button" size="sm" disabled={busy || isSelf} onClick={onApprove}>
            <Check size={12} />
            Aprovar
          </Button>
        )}
        {user.status !== "rejected" && (
          <Button type="button" variant="secondary" size="sm" disabled={busy || isSelf} onClick={onReject}>
            <X size={12} />
            Rejeitar
          </Button>
        )}
        {user.status === "approved" && onRevoke && (
          <Button type="button" variant="ghost" size="sm" disabled={busy || isSelf} onClick={onRevoke}>
            <RotateCcw size={12} />
            Revogar
          </Button>
        )}
      </div>
    </div>
  );
}
