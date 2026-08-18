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
  KanbanSquare,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Ferramentas compartilhadas — aparecem no menu de TODO produto (o dado de
// cada uma é isolado por produto, mas o item de menu é o mesmo). "Tarefas"
// fica sempre no topo, o resto sempre no final — cada produto novo intercala
// seus itens exclusivos (se tiver) entre os dois blocos.
const SHARED_NAV_TOP: NavItem[] = [{ href: "/tarefas", label: "Tarefas", icon: KanbanSquare }];

const SHARED_NAV_REST: NavItem[] = [
  { href: "/conversas", label: "Simulador de Conversas", icon: MessageSquare },
  { href: "/gerador-de-criativos", label: "Gerador de Criativos", icon: Wand2 },
  { href: "/mensagens-x1", label: "Mensagens X1", icon: UsersRound },
  { href: "/emails", label: "E-mails", icon: Mail },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/prompts", label: "Biblioteca de Prompts", icon: Library },
  { href: "/biblioteca-imagens", label: "Biblioteca de Imagens", icon: Images },
];

// Menu lateral de cada produto, definido em código (não no banco) — cada
// produto novo ganha sua própria entrada aqui, montada com os blocos
// compartilhados acima + os itens exclusivos dele no meio. PROFITX é o app
// de hoje inteiro, sem mudar nada de lugar — só ganhou "Tarefas" em cima.
export const PRODUCT_NAV_ITEMS: Record<string, NavItem[]> = {
  profitx: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...SHARED_NAV_TOP,
    { href: "/dinamicas-do-dia", label: "Dinâmicas do Dia", icon: Zap }, // exclusivo do PROFITX
    ...SHARED_NAV_REST,
  ],
};

export const DEFAULT_PRODUCT_SLUG = "profitx";

// Rotas fora de qualquer produto (perfil, configurações, admin, etc.) não
// entram em PRODUCT_NAV_ITEMS — ficam sempre acessíveis, sem checagem de
// produto, já que não pertencem a nenhum produto específico.
//
// Uma rota pode "pertencer" a mais de um produto (rotas compartilhadas,
// como /tarefas, aparecem em todo mundo) — por isso a checagem de acesso
// não é "esse produto específico tem acesso", e sim "o usuário tem acesso
// a pelo menos UM dos produtos que mostram essa rota no menu".
export function isPathAccessible(pathname: string, accessibleSlugs: string[]): boolean {
  const owningSlugs = Object.entries(PRODUCT_NAV_ITEMS)
    .filter(([, items]) => items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)))
    .map(([slug]) => slug);
  if (owningSlugs.length === 0) return true;
  return owningSlugs.some((slug) => accessibleSlugs.includes(slug));
}
