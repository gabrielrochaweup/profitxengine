"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronRight, LogOut, Settings, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopbarProps {
  fullName: string | null;
  email: string | null;
  role: string;
}

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  editor: "Editor",
  viewer: "Visualizador",
};

export function Topbar({ fullName, email, role }: TopbarProps) {
  const [open, setOpen] = useState(false);
  const displayName = fullName || email || "Usuário";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-app/80 px-8 backdrop-blur">
      <div className="relative w-full max-w-md">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          type="text"
          placeholder="Buscar..."
          className="h-10 w-full rounded-input border border-border bg-input pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent"
        />
      </div>

      <div className="relative ml-4">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-medium text-white"
        >
          {initials}
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-12 z-30 w-72 rounded-panel border border-border bg-card p-2 shadow-popover">
              <div className="border-b border-border px-3 py-3">
                <p className="text-sm font-medium text-text-primary">{displayName}</p>
                {email && <p className="text-xs text-text-muted">{email}</p>}
                <span className="mt-2 inline-block rounded-button border border-border-strong px-2 py-0.5 text-[11px] text-text-secondary">
                  {ROLE_LABEL[role] ?? role}
                </span>
              </div>

              <div className="py-1">
                <MenuLink href="/configuracoes" icon={Settings} label="Configurações" />
                {role === "admin" && <MenuLink href="/admin" icon={ShieldCheck} label="Admin" />}
              </div>

              <div className="border-t border-border pt-1">
                <form action="/auth/logout" method="post">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-danger hover:bg-card-hover"
                  >
                    <LogOut size={16} />
                    Sair
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Settings;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between rounded-xl px-3 py-2 text-sm text-text-secondary hover:bg-card-hover hover:text-text-primary"
      )}
    >
      <span className="flex items-center gap-2">
        <Icon size={16} />
        {label}
      </span>
      <ChevronRight size={14} className="text-text-muted" />
    </Link>
  );
}
