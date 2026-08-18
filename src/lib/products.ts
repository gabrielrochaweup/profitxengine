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

// Ferramentas compartilhadas — aparecem no menu de TODO produto, inclusive
// os criados depois pela UI (o dado de cada uma é isolado por produto, mas
// o item de menu é o mesmo pra todo mundo). Dashboard e Tarefas sempre no
// topo, o resto sempre no final — cada produto intercala seus itens
// exclusivos (se tiver) entre os dois blocos.
const SHARED_NAV_TOP: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tarefas", label: "Tarefas", icon: KanbanSquare },
];

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

// Itens exclusivos de UM produto específico (não aparecem nos outros).
// PROFITX é o único com um hoje — um produto novo criado pela UI não entra
// aqui, e mesmo assim ganha o menu inteiro via SHARED_NAV_TOP/REST.
const EXCLUSIVE_NAV_ITEMS: Record<string, NavItem[]> = {
  profitx: [{ href: "/dinamicas-do-dia", label: "Dinâmicas do Dia", icon: Zap }],
};

export function getNavItems(slug: string): NavItem[] {
  return [...SHARED_NAV_TOP, ...(EXCLUSIVE_NAV_ITEMS[slug] ?? []), ...SHARED_NAV_REST];
}

export const DEFAULT_PRODUCT_SLUG = "profitx";

// Nicho do produto — define de onde vêm as notícias mostradas no Calendário/
// Dashboard/Dinâmicas do Dia (ver src/lib/news/niche-feeds.ts). Lista fixa
// de exemplos comuns pra quem for criar um produto novo; "Outro" cobre o
// resto sem travar a criação.
export const NICHE_OPTIONS = [
  { value: "cripto-trading", label: "Cripto & Trading" },
  { value: "saude-bem-estar", label: "Saúde & Bem-estar" },
  { value: "financas-pessoais", label: "Finanças Pessoais" },
  { value: "fitness-emagrecimento", label: "Fitness & Emagrecimento" },
  { value: "beleza-estetica", label: "Beleza & Estética" },
  { value: "marketing-digital", label: "Marketing Digital" },
  { value: "educacao-cursos", label: "Educação & Cursos Online" },
  { value: "imoveis", label: "Imóveis" },
  { value: "apostas-esportivas", label: "Apostas Esportivas" },
  { value: "outro", label: "Outro" },
] as const;

export const DEFAULT_NICHE = "cripto-trading";

export function nicheLabel(niche: string | null | undefined): string {
  return NICHE_OPTIONS.find((n) => n.value === niche)?.label ?? "Geral";
}

const SHARED_HREFS = new Set([...SHARED_NAV_TOP, ...SHARED_NAV_REST].map((item) => item.href));

// Rotas fora de qualquer produto (perfil, configurações, admin, etc.) ficam
// sempre acessíveis, sem checagem de produto. Rotas compartilhadas (menu
// igual em todo produto) liberam pra quem tem acesso a QUALQUER produto —
// só rotas exclusivas (hoje só Dinâmicas do Dia) checam o produto dono
// específico.
export function isPathAccessible(pathname: string, accessibleSlugs: string[]): boolean {
  const matchesHref = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const exclusiveOwner = Object.entries(EXCLUSIVE_NAV_ITEMS).find(([, items]) =>
    items.some((item) => matchesHref(item.href))
  );
  if (exclusiveOwner) return accessibleSlugs.includes(exclusiveOwner[0]);

  if (Array.from(SHARED_HREFS).some(matchesHref)) return accessibleSlugs.length > 0;

  return true;
}
