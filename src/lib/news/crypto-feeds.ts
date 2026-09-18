import "server-only";
import { XMLParser } from "fast-xml-parser";

export interface CryptoNewsItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string | null;
  description: string | null;
  highPotential: boolean;
}

const FEEDS: { source: string; url: string }[] = [
  { source: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
  { source: "Cointelegraph", url: "https://cointelegraph.com/rss" },
  { source: "Decrypt", url: "https://decrypt.co/feed" },
];

const MEMECOIN_KEYWORDS = [
  "meme coin",
  "memecoin",
  "meme token",
  "dogecoin",
  "doge",
  "shiba inu",
  "shib",
  "pepe",
  "bonk",
  "wif",
  "dogwifhat",
  "floki",
  "pump.fun",
  "pumpfun",
  "brett",
  "popcat",
  "mog coin",
  "book of meme",
  "bome",
];

function isMemecoinRelated(item: { title: string; description: string | null }): boolean {
  const haystack = `${item.title} ${item.description ?? ""}`.toLowerCase();
  return MEMECOIN_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

const parser = new XMLParser({ ignoreAttributes: false });

let cache: { items: CryptoNewsItem[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

function stripHtml(text: string | undefined): string | null {
  if (!text) return null;
  return text.replace(/<[^>]*>/g, "").trim() || null;
}

async function fetchFeed(source: string, url: string): Promise<CryptoNewsItem[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PROFITXEngine/1.0)" },
      next: { revalidate: 600 },
      // Sem teto, um feed externo lento segura a pagina inteira: o dashboard
      // espera por eles antes de renderizar. Com teto, o pior caso e a pagina
      // abrir sem a noticia.
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const parsed = parser.parse(xml);
    const items = parsed?.rss?.channel?.item;
    const list = Array.isArray(items) ? items : items ? [items] : [];

    return list.slice(0, 15).map((item: Record<string, unknown>) => ({
      title: stripHtml(String(item.title ?? "")) ?? "",
      link: String(item.link ?? ""),
      source,
      publishedAt: item.pubDate ? String(item.pubDate) : null,
      description: stripHtml(String(item.description ?? "")),
      highPotential: false,
    }));
  } catch {
    return [];
  }
}

export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  marketCapRank: number | null;
  priceChangePercentage24h: number | null;
  isMemecoinRelated: boolean;
}

let trendingCache: { coins: TrendingCoin[]; fetchedAt: number } | null = null;

/**
 * Moedas realmente em alta agora (busca dos últimos dias no CoinGecko),
 * não "uma notícia geral mencionou essa palavra". Endpoint público, sem
 * chave — complementa o feed de notícias, que raramente cobre memecoins
 * a tempo (só reportam depois que já viralizou).
 */
export async function getTrendingCoins(): Promise<TrendingCoin[]> {
  if (trendingCache && Date.now() - trendingCache.fetchedAt < CACHE_TTL_MS) {
    return trendingCache.coins;
  }

  try {
    const res = await fetch("https://api.coingecko.com/api/v3/search/trending", {
      headers: { Accept: "application/json" },
      next: { revalidate: 600 },
      // Sem teto, um feed externo lento segura a pagina inteira: o dashboard
      // espera por eles antes de renderizar. Com teto, o pior caso e a pagina
      // abrir sem a noticia.
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return trendingCache?.coins ?? [];

    const body = await res.json();
    const rawCoins: unknown[] = Array.isArray(body?.coins) ? body.coins : [];

    const coins: TrendingCoin[] = rawCoins.map((entry) => {
      const item = (entry as { item?: Record<string, unknown> })?.item ?? {};
      const name = String(item.name ?? "");
      const symbol = String(item.symbol ?? "");
      const data = (item.data ?? {}) as Record<string, unknown>;
      const change = data.price_change_percentage_24h as Record<string, number> | undefined;

      return {
        id: String(item.id ?? ""),
        name,
        symbol,
        thumb: String(item.small ?? item.thumb ?? ""),
        marketCapRank: typeof item.market_cap_rank === "number" ? item.market_cap_rank : null,
        priceChangePercentage24h: typeof change?.usd === "number" ? change.usd : null,
        isMemecoinRelated: isMemecoinRelated({ title: `${name} ${symbol}`, description: null }),
      };
    });

    trendingCache = { coins, fetchedAt: Date.now() };
    return coins;
  } catch {
    return trendingCache?.coins ?? [];
  }
}

export async function getCryptoNews(): Promise<CryptoNewsItem[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.items;
  }

  const results = await Promise.all(FEEDS.map((feed) => fetchFeed(feed.source, feed.url)));
  const seenLinks = new Set<string>();
  const items = results
    .flat()
    .filter((item) => {
      if (!item.title || !item.link || seenLinks.has(item.link)) return false;
      seenLinks.add(item.link);
      return true;
    })
    .map((item) => ({ ...item, highPotential: isMemecoinRelated(item) }))
    .sort((a, b) => {
      const memeA = a.highPotential ? 1 : 0;
      const memeB = b.highPotential ? 1 : 0;
      if (memeA !== memeB) return memeB - memeA;
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });

  cache = { items, fetchedAt: Date.now() };
  return items;
}
