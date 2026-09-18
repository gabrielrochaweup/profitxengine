"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Zap,
  UsersRound,
  Library,
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
import { useActiveProduct } from "./active-product-context";
import { getNavSections } from "@/lib/products";

// Menu inferior mobile (estilo Instagram): só os 4 destinos mais usados —
// o resto (Calendário, E-mails, Perfil, Configurações, Admin) mora no drawer,
// aberto pelo primeiro ícone ("Dashboard"). Fica fixo no produto PROFITX por
// enquanto — a barra de produtos ainda não tem versão mobile.
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
  const { activeProduct } = useActiveProduct();
  const navSections = getNavSections(activeProduct);
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
        className="fixed inset-x-2 z-30 flex items-center justify-around rounded-panel bg-sidebar shadow-card px-1 py-1.5 md:hidden"
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
          <div className="fixed inset-y-3 left-3 z-50 flex w-[85vw] max-w-[300px] flex-col rounded-panel bg-sidebar shadow-popover p-4 md:hidden">
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

            <nav className="mt-2 flex flex-1 flex-col gap-0.5 overflow-y-auto">
              {navSections.map((secao, i) => (
                <div key={secao.titulo || `inicio-${i}`} className={cn("flex flex-col gap-0.5", i > 0 && "mt-4")}>
                  {secao.titulo && (
                    <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-wider text-text-muted">
                      {secao.titulo}
                    </p>
                  )}
                  {secao.itens.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-button px-3 py-2 text-[13px] transition-colors duration-150",
                          isActive
                            ? "bg-card-hover text-text-primary"
                            : "text-text-secondary hover:bg-card-hover hover:text-text-primary"
                        )}
                      >
                        <Icon size={16} strokeWidth={1.75} className={cn("shrink-0", isActive && "text-accent")} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            <div className="border-t border-border pt-3">
              <div className="flex items-center gap-2 px-1 pb-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-contrast">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-text-primary">{displayName}</p>
                  <span className="inline-block rounded-button bg-card-hover px-1.5 py-0.5 text-[10px] text-text-secondary">
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

              <div className="mt-1 border-t border-border pt-1">
                <form action="/auth/logout" method="post">
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-button px-3 py-2 text-left text-[13px] text-danger hover:bg-card-hover"
                  >
                    <LogOut size={16} />
                    Sair
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sidebar desktop — híbrida: só ícones ou ícones+labels, via toggle. */}
      <aside
        className={cn(
          "hidden h-full shrink-0 flex-col rounded-panel bg-sidebar shadow-card p-2 transition-[width] duration-200 md:flex",
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

        <nav
          className={cn(
            "mt-3 flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden",
            collapsed ? "items-center" : "items-stretch"
          )}
        >
          {navSections.map((secao, i) => (
            <div key={secao.titulo || `inicio-${i}`} className={cn("flex flex-col gap-0.5", i > 0 && "mt-4")}>
              {/* Recolhida, a sidebar vira uma coluna de ícones: o rótulo da
                  seção não caberia, então vira um traço separando os grupos. */}
              {secao.titulo &&
                (collapsed ? (
                  <div className="mx-auto my-1 h-px w-5 bg-border" />
                ) : (
                  <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-wider text-text-muted">
                    {secao.titulo}
                  </p>
                ))}
              {secao.itens.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className={cn(
                      "relative flex items-center gap-2.5 rounded-button transition-colors duration-150",
                      collapsed ? "h-9 w-9 justify-center" : "h-8 px-3",
                      isActive
                        ? "bg-card-hover text-text-primary"
                        : "text-text-secondary hover:bg-card-hover hover:text-text-primary"
                    )}
                  >
                    {/* Marca ativa discreta: um traço verde na borda, em vez
                        de pintar o item inteiro. */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-accent" />
                    )}
                    <Icon
                      size={16}
                      strokeWidth={1.75}
                      className={cn("shrink-0", isActive && "text-accent")}
                    />
                    {!collapsed && (
                      <span className="truncate whitespace-nowrap text-[13px]">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={cn("relative mt-2 flex flex-col gap-1.5 border-t border-border pt-3", collapsed ? "items-center" : "items-stretch")}>
          {collapsed ? (
            <button
              type="button"
              onClick={toggleCollapsed}
              title="Expandir menu"
              aria-label="Expandir menu"
              className="flex h-8 w-8 items-center justify-center rounded-button text-text-secondary hover:bg-card-hover hover:text-text-primary"
            >
              <PanelLeftOpen size={16} />
            </button>
          ) : (
            <div className="flex items-center justify-end px-1">
              <button
                type="button"
                onClick={toggleCollapsed}
                title="Recolher menu"
                aria-label="Recolher menu"
                className="flex h-8 w-8 items-center justify-center rounded-button text-text-secondary hover:bg-card-hover hover:text-text-primary"
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
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-contrast">
              {initials}
            </div>
            {!collapsed && <span className="truncate whitespace-nowrap text-sm text-text-primary">{displayName}</span>}
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
              <div className="absolute bottom-full left-0 z-30 mb-2 w-64 rounded-panel bg-card p-2 shadow-popover">
                <div className="border-b border-border px-3 py-3">
                  <p className="text-sm font-medium text-text-primary">{displayName}</p>
                  {email && <p className="text-xs text-text-muted">{email}</p>}
                  <span className="mt-2 inline-block rounded-button bg-card-hover px-2 py-0.5 text-[11px] text-text-secondary">
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
