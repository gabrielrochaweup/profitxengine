"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/calendario", label: "Calendário" },
  { href: "/calendario/dinamicas-do-dia", label: "Dinâmicas do Dia" },
  { href: "/calendario/x1", label: "Mensagens X1" },
];

export function CalendarioTabs() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-1.5">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-button px-4 py-1.5 text-sm font-medium transition-colors ${
              active ? "bg-accent text-white" : "border border-border-strong text-text-secondary hover:bg-card-hover"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
