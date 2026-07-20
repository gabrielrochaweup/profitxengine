"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  CalendarDays,
  Zap,
  UsersRound,
  Mail,
  Library,
  BarChart3,
  Settings,
  SlidersHorizontal,
  ShieldCheck,
  ChevronRight,
  LogOut,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dinamicas-do-dia", label: "Dinâmicas do Dia", icon: Zap },
  { href: "/conversas", label: "Simulador de Conversas", icon: MessageSquare },
  { href: "/mensagens-x1", label: "Mensagens X1", icon: UsersRound },
  { href: "/emails", label: "E-mails", icon: Mail },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/prompts", label: "Biblioteca de Prompts", icon: Library },
];

// Menu inferior mobile (estilo Instagram): só os 4 destinos mais usados —
// o resto (Calendário, E-mails, Perfil, Configurações, Admin) mora no drawer,
// aberto pelo primeiro ícone ("Dashboard").
const MOBILE_TAB_ITEMS = [
  { href: "/conversas", label: "Simulador", icon: MessageSquare },
  { href: "/dinamicas-do-dia", label: "Dinâmicas", icon: Zap },
  { href: "/mensagens-x1", label: "Mensagens X1", icon: UsersRound },
  { href: "/prompts", label: "Prompts", icon: Library },
];

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  editor: "Editor",
  viewer: "Visualizador",
};

interface SidebarProps {
  fullName: string | null;
  email: string | null;
  role: string;
}

export function Sidebar({ fullName, email, role }: SidebarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const displayName = fullName || email || "Usuário";
  const initials = displayName.slice(0, 2).toUpperCase();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const stored = localStorage.getItem("sidebarCollapsed");
    if (stored !== null) setCollapsed(stored === "true");
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebarCollapsed", String(next));
      return next;
    });
  }

  return (
    <>
      {/* Menu inferior mobile — some em md+, onde a sidebar de verdade assume.
          bottom usa env(safe-area-inset-bottom) pra não ficar colado na faixa
          do home indicator em iPhones sem botão físico. */}
      <div
        className="fixed inset-x-2 z-30 flex items-center justify-around rounded-panel border border-border bg-sidebar px-1 py-1.5 md:hidden"
        style={{ bottom: "max(0.5rem, calc(env(safe-area-inset-bottom) + 0.25rem))" }}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          title="Dashboard"
          className="flex flex-1 items-center justify-center rounded-xl px-2 py-2 text-text-secondary hover:bg-card-hover hover:text-text-primary"
        >
          <LayoutDashboard size={20} strokeWidth={1.75} />
        </button>
        {MOBILE_TAB_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              className={cn(
                "flex flex-1 items-center justify-center rounded-xl px-2 py-2",
                isActive ? "text-accent" : "text-text-secondary hover:bg-card-hover hover:text-text-primary"
              )}
            >
              <Icon size={20} strokeWidth={1.75} />
            </Link>
          );
        })}
      </div>

      {/* Drawer mobile */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-3 left-3 z-50 flex w-[85vw] max-w-[300px] flex-col rounded-panel border border-border bg-sidebar p-4 md:hidden">
            <div className="flex items-center justify-between px-1 py-2">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-icon.svg" alt="" className="h-8 w-8" />
                <span className="text-sm font-semibold text-text-primary">PROFITX Engine</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
                className="flex h-8 w-8 items-center justify-center rounded-xl text-text-secondary hover:bg-card-hover"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="mt-2 flex flex-1 flex-col gap-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                      isActive
                        ? "bg-card-hover text-text-primary"
                        : "text-text-secondary hover:bg-card-hover hover:text-text-primary"
                    )}
                  >
                    <Icon size={18} strokeWidth={1.75} className="shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-border pt-3">
              <div className="flex items-center gap-2 px-1 pb-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium text-white">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-text-primary">{displayName}</p>
                  <span className="inline-block rounded-button border border-border-strong px-1.5 py-0.5 text-[10px] text-text-secondary">
                    {ROLE_LABEL[role] ?? role}
                  </span>
                </div>
              </div>

              <MenuLink href="/perfil" icon={Settings} label="Configurações do Perfil" onNavigate={() => setMobileOpen(false)} />
              <MenuLink
                href="/configuracoes"
                icon={SlidersHorizontal}
                label="Configurações da Plataforma"
                onNavigate={() => setMobileOpen(false)}
              />
              {role === "admin" && (
                <MenuLink href="/admin" icon={ShieldCheck} label="Admin" onNavigate={() => setMobileOpen(false)} />
              )}

              <div className="mt-1 flex items-center justify-between border-t border-border pt-1">
                <form action="/auth/logout" method="post">
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-danger hover:bg-card-hover"
                  >
                    <LogOut size={16} />
                    Sair
                  </button>
                </form>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sidebar desktop — híbrida: só ícones ou ícones+labels, via toggle. */}
      <aside
        className={cn(
          "hidden h-full shrink-0 flex-col rounded-panel border border-border bg-sidebar p-2 transition-[width] duration-200 md:flex",
          collapsed ? "w-[64px]" : "w-56"
        )}
      >
        <div className={cn("flex items-center gap-2 py-2", collapsed ? "justify-center" : "px-1")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon.svg" alt="PROFITX Engine" className="h-8 w-8 shrink-0" />
          {!collapsed && (
            <span className="truncate text-sm font-semibold text-text-primary">PROFITX Engine</span>
          )}
        </div>

        <nav className={cn("mt-3 flex flex-1 flex-col gap-1 overflow-hidden", collapsed ? "items-center" : "items-stretch")}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "flex items-center gap-3 rounded-xl transition-colors",
                  collapsed ? "h-10 w-10 justify-center" : "h-10 px-3",
                  isActive
                    ? "bg-card-hover text-text-primary"
                    : "text-text-secondary hover:bg-card-hover hover:text-text-primary"
                )}
              >
                <Icon size={18} strokeWidth={1.75} className="shrink-0" />
                {!collapsed && <span className="truncate whitespace-nowrap text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={cn("relative mt-2 flex flex-col gap-1.5 border-t border-border pt-3", collapsed ? "items-center" : "items-stretch")}>
          {collapsed ? (
            <>
              <button
                type="button"
                onClick={toggleCollapsed}
                title="Expandir menu"
                aria-label="Expandir menu"
                className="flex h-8 w-8 items-center justify-center rounded-xl text-text-secondary hover:bg-card-hover hover:text-text-primary"
              >
                <PanelLeftOpen size={16} />
              </button>
              <ThemeToggle />
            </>
          ) : (
            <div className="flex items-center justify-between px-1">
              <ThemeToggle />
              <button
                type="button"
                onClick={toggleCollapsed}
                title="Recolher menu"
                aria-label="Recolher menu"
                className="flex h-8 w-8 items-center justify-center rounded-xl text-text-secondary hover:bg-card-hover hover:text-text-primary"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            title={displayName}
            className={cn(
              "flex items-center gap-2 rounded-xl hover:bg-card-hover",
              collapsed ? "h-10 w-10 justify-center" : "h-10 px-2"
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium text-white">
              {initials}
            </div>
            {!collapsed && <span className="truncate whitespace-nowrap text-sm text-text-primary">{displayName}</span>}
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
              <div className="absolute bottom-full left-0 z-30 mb-2 w-64 rounded-panel border border-border bg-card p-2 shadow-popover">
                <div className="border-b border-border px-3 py-3">
                  <p className="text-sm font-medium text-text-primary">{displayName}</p>
                  {email && <p className="text-xs text-text-muted">{email}</p>}
                  <span className="mt-2 inline-block rounded-button border border-border-strong px-2 py-0.5 text-[11px] text-text-secondary">
                    {ROLE_LABEL[role] ?? role}
                  </span>
                </div>

                <div className="py-1">
                  <MenuLink href="/perfil" icon={Settings} label="Configurações do Perfil" onNavigate={() => setMenuOpen(false)} />
                  <MenuLink
                    href="/configuracoes"
                    icon={SlidersHorizontal}
                    label="Configurações da Plataforma"
                    onNavigate={() => setMenuOpen(false)}
                  />
                  {role === "admin" && (
                    <MenuLink href="/admin" icon={ShieldCheck} label="Admin" onNavigate={() => setMenuOpen(false)} />
                  )}
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
      </aside>
    </>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  onNavigate,
}: {
  href: string;
  icon: typeof Settings;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-text-secondary hover:bg-card-hover hover:text-text-primary"
    >
      <span className="flex items-center gap-2">
        <Icon size={16} />
        {label}
      </span>
      <ChevronRight size={14} className="text-text-muted" />
    </Link>
  );
}
