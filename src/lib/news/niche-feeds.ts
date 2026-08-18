import "server-only";
import { XMLParser } from "fast-xml-parser";
import { getCryptoNews, getTrendingCoins, type CryptoNewsItem, type TrendingCoin } from "./crypto-feeds";
import { DEFAULT_NICHE, nicheLabel } from "@/lib/products";

export interface NicheNewsItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string | null;
  description: string | null;
  highPotential: boolean;
}

export interface NicheNewsResult {
  items: NicheNewsItem[];
  trending: TrendingCoin[];
  label: string;
}

// Cripto continua com os feeds curados de sempre (crypto-feeds.ts) — já
// existiam e trazem trending do CoinGecko, que não faz sentido pra outro
// nicho. Todo o resto busca no Google News por palavra-chave: cobre
// qualquer nicho novo sem precisar sair caçando feed específico por
// vertical (RSS público, sem chave).
const SEARCH_QUERIES: Record<string, string> = {
  "saude-bem-estar": "saúde bem-estar wellness",
  "financas-pessoais": "finanças pessoais investimentos economia",
  "fitness-emagrecimento": "fitness emagrecimento treino dieta",
  "beleza-estetica": "beleza estética procedimentos skincare",
  "marketing-digital": "marketing digital redes sociais",
  "educacao-cursos": "educação cursos online ensino",
  imoveis: "mercado imobiliário imóveis",
  "apostas-esportivas": "apostas esportivas betting",
};

const parser = new XMLParser({ ignoreAttributes: false });
const genericCache = new Map<string, { items: NicheNewsItem[]; fetchedAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

function stripHtml(text: string | undefined): string | null {
  if (!text) return null;
  return text.replace(/<[^>]*>/g, "").trim() || null;
}

async function fetchGoogleNews(query: string): Promise<NicheNewsItem[]> {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PROFITXEngine/1.0)" },
      next: { revalidate: 600 },
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const parsed = parser.parse(xml);
    const items = parsed?.rss?.channel?.item;
    const list = Array.isArray(items) ? items : items ? [items] : [];

    return list.slice(0, 20).map((item: Record<string, unknown>) => ({
      title: stripHtml(String(item.title ?? "")) ?? "",
      link: String(item.link ?? ""),
      source: String((item.source as Record<string, unknown> | undefined)?.["#text"] ?? "Google News"),
      publishedAt: item.pubDate ? String(item.pubDate) : null,
      description: stripHtml(String(item.description ?? "")),
      highPotential: false,
    }));
  } catch {
    return [];
  }
}

function fallbackNicheNews(item: CryptoNewsItem): NicheNewsItem {
  return item;
}

export async function getNicheNews(niche: string | null | undefined): Promise<NicheNewsResult> {
  const resolvedNiche = niche || DEFAULT_NICHE;
  const label = nicheLabel(resolvedNiche);

  if (resolvedNiche === "cripto-trading") {
    const [items, trending] = await Promise.all([getCryptoNews(), getTrendingCoins()]);
    return { items: items.map(fallbackNicheNews), trending, label };
  }

  const cached = genericCache.get(resolvedNiche);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { items: cached.items, trending: [], label };
  }

  const query = SEARCH_QUERIES[resolvedNiche] ?? label;
  const items = await fetchGoogleNews(query);
  genericCache.set(resolvedNiche, { items, fetchedAt: Date.now() });
  return { items, trending: [], label };
}
