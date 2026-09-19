import {
  LayoutDashboard,
  MessagesSquare,
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
  Radar,
  KeyRound,
  Newspaper,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /**
   * Some do menu e da rota pra quem não é admin.
   *
   * Vale pra ferramenta cujo CONTEÚDO é sensível por natureza, não pra
   * ferramenta "avançada": Acessos guarda senha de conta da empresa e o
   * lugar onde mora o segundo fator.
   */
  soAdmin?: boolean;
}

/**
 * O menu é agrupado por TIPO DE TRABALHO, não por ordem de chegada.
 *
 * Com 14 itens numa lista corrida, achar o que se quer virava leitura de
 * cima a baixo toda vez. Separado, a pessoa pula direto pro bloco certo:
 * quem vai escrever um post não passa os olhos por Tracking.
 */
export interface NavSection {
  titulo: string;
  itens: NavItem[];
}

// Ferramentas compartilhadas — aparecem no menu de TODO produto, inclusive
// os criados depois pela UI (o dado de cada uma é isolado por produto, mas
// o item de menu é o mesmo pra todo mundo).
const NAV_INICIO: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  // Comunidade fica no topo, junto do Dashboard, porque é onde se volta
  // várias vezes por dia — e porque não pertence a nenhum dos blocos
  // seguintes: ela não é criação, nem dado, nem biblioteca.
  { href: "/comunidade", label: "Comunidade", icon: MessagesSquare },
  { href: "/tarefas", label: "Tarefas", icon: KanbanSquare },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
];

const NAV_CRIACAO: NavItem[] = [
  { href: "/gerador-de-criativos", label: "Gerador de Criativos", icon: Wand2 },
  { href: "/blog", label: "Blog", icon: Newspaper },
  { href: "/emails", label: "E-mails", icon: Mail },
  { href: "/conversas", label: "Simulador de Conversas", icon: MessageSquare },
  { href: "/mensagens-x1", label: "Mensagens X1", icon: UsersRound },
];

const NAV_DADOS: NavItem[] = [
  { href: "/tracking", label: "Tracking", icon: Radar },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const NAV_BIBLIOTECA: NavItem[] = [
  { href: "/prompts", label: "Prompts", icon: Library },
  { href: "/biblioteca-imagens", label: "Imagens", icon: Images },
];

// Acessos é só de admin: a tela existe pra abrir a senha das contas da
// empresa e dizer em qual celular está o 2FA. Quem edita conteúdo não
// precisa disso pra trabalhar, e "precisa de vez em quando" não é motivo
// pra deixar o cofre aberto o tempo todo.
const NAV_OPERACAO: NavItem[] = [{ href: "/acessos", label: "Acessos", icon: KeyRound, soAdmin: true }];

// Itens exclusivos de UM produto específico (não aparecem nos outros).
// PROFITX é o único com um hoje — um produto novo criado pela UI não entra
// aqui, e mesmo assim ganha o menu inteiro via SHARED_NAV_TOP/REST.
const EXCLUSIVE_NAV_ITEMS: Record<string, NavItem[]> = {
  profitx: [{ href: "/dinamicas-do-dia", label: "Dinâmicas do Dia", icon: Zap }],
};

export function getNavSections(slug: string, isAdmin = true): NavSection[] {
  const exclusivos = EXCLUSIVE_NAV_ITEMS[slug] ?? [];
  const visiveis = (itens: NavItem[]) => (isAdmin ? itens : itens.filter((i) => !i.soAdmin));
  return [
    // Sem título: o começo do menu não precisa de rótulo pra ser entendido,
    // e um "INÍCIO" ali só empurraria tudo pra baixo.
    { titulo: "", itens: visiveis([...NAV_INICIO, ...exclusivos]) },
    { titulo: "Criação", itens: visiveis(NAV_CRIACAO) },
    { titulo: "Dados", itens: visiveis(NAV_DADOS) },
    { titulo: "Biblioteca", itens: visiveis(NAV_BIBLIOTECA) },
    // A seção inteira some quando o único item dela é de admin — um título
    // "OPERAÇÃO" sozinho seria uma gaveta vazia com etiqueta.
    { titulo: "Operação", itens: visiveis(NAV_OPERACAO) },
  ].filter((s) => s.itens.length > 0);
}

/** Rotas que só admin abre — a lista é derivada do próprio menu. */
const HREFS_SO_ADMIN = new Set(
  [...NAV_INICIO, ...NAV_CRIACAO, ...NAV_DADOS, ...NAV_BIBLIOTECA, ...NAV_OPERACAO]
    .filter((i) => i.soAdmin)
    .map((i) => i.href)
);

export function rotaSoDeAdmin(pathname: string): boolean {
  return Array.from(HREFS_SO_ADMIN).some((href) => pathname === href || pathname.startsWith(`${href}/`));
}

/** Lista corrida — usada por quem só precisa saber quais rotas existem. */
export function getNavItems(slug: string): NavItem[] {
  return getNavSections(slug).flatMap((s) => s.itens);
}

// Usado por telas compartilhadas (Calendário, Analytics) que mostram
// conteúdo derivado de Dinâmicas do Dia — essa ferramenta é exclusiva de
// quem tem ela no menu, então o dado (ícone da dinâmica, KPIs de
// Pepe/Live/Copy) não pode vazar pra produto que não é dono dela.
export function productOwnsExclusiveRoute(slug: string, href: string): boolean {
  return (EXCLUSIVE_NAV_ITEMS[slug] ?? []).some((item) => item.href === href);
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

const SHARED_HREFS = new Set(
  [...NAV_INICIO, ...NAV_CRIACAO, ...NAV_DADOS, ...NAV_BIBLIOTECA, ...NAV_OPERACAO].map((item) => item.href)
);

// Rotas fora de qualquer produto (perfil, configurações, admin, etc.) ficam
// sempre acessíveis, sem checagem de produto. Rotas compartilhadas (menu
// igual em todo produto) liberam pra quem tem acesso a QUALQUER produto —
// só rotas exclusivas (hoje só Dinâmicas do Dia) checam o produto dono
// específico.
export function isPathAccessible(pathname: string, accessibleSlugs: string[]): boolean {
  const matchesHref = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Esta função só é chamada pra quem NÃO é admin (ver (app)/layout.tsx), e
  // por isso a checagem cabe aqui: rota de admin não abre, mesmo que a
  // pessoa digite o endereço na barra.
  if (rotaSoDeAdmin(pathname)) return false;

  const exclusiveOwner = Object.entries(EXCLUSIVE_NAV_ITEMS).find(([, items]) =>
    items.some((item) => matchesHref(item.href))
  );
  if (exclusiveOwner) return accessibleSlugs.includes(exclusiveOwner[0]);

  if (Array.from(SHARED_HREFS).some(matchesHref)) return accessibleSlugs.length > 0;

  return true;
}
