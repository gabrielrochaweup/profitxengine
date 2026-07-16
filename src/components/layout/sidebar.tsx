"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  CalendarDays,
  Mail,
  Library,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/conversas", label: "Simulador de Conversas", icon: MessageSquare },
  { href: "/calendario", label: "Calendário de Engajamento", icon: CalendarDays },
  { href: "/emails", label: "E-mails", icon: Mail },
  { href: "/prompts", label: "Biblioteca de Prompts", icon: Library },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[280px] flex-col border-r border-border bg-sidebar p-4 md:flex">
      <div className="flex items-center gap-2 px-2 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white">
          <Sparkles size={16} />
        </div>
        <span className="text-sm font-semibold text-text-primary">PROFITX Engine</span>
      </div>

      <nav className="mt-4 flex flex-1 flex-col gap-1">
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
              <Icon size={18} strokeWidth={1.75} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
