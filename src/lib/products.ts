import {
  LayoutDashboard,
  MessageSquare,
  CalendarDays,
  Zap,
  UsersRound,
  Mail,
  Library,
  Images,
  BarChart3,
  Wand2,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Menu lateral de cada produto, definido em código (não no banco) — cada
// produto novo ganha sua própria entrada aqui, montada conforme a
// necessidade. PROFITX é o app de hoje inteiro, sem mudar nada de lugar.
export const PRODUCT_NAV_ITEMS: Record<string, NavItem[]> = {
  profitx: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dinamicas-do-dia", label: "Dinâmicas do Dia", icon: Zap },
    { href: "/conversas", label: "Simulador de Conversas", icon: MessageSquare },
    { href: "/gerador-de-criativos", label: "Gerador de Criativos", icon: Wand2 },
    { href: "/mensagens-x1", label: "Mensagens X1", icon: UsersRound },
    { href: "/emails", label: "E-mails", icon: Mail },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/calendario", label: "Calendário", icon: CalendarDays },
    { href: "/prompts", label: "Biblioteca de Prompts", icon: Library },
    { href: "/biblioteca-imagens", label: "Biblioteca de Imagens", icon: Images },
  ],
};

export const DEFAULT_PRODUCT_SLUG = "profitx";

// Rotas fora de qualquer produto (perfil, configurações, admin, etc.) não
// entram em PRODUCT_NAV_ITEMS — ficam sempre acessíveis, sem checagem de
// produto, já que não pertencem a nenhum produto específico.
export function getProductSlugForPath(pathname: string): string | null {
  for (const [slug, items] of Object.entries(PRODUCT_NAV_ITEMS)) {
    if (items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))) {
      return slug;
    }
  }
  return null;
}
