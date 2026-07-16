import "server-only";
import { XMLParser } from "fast-xml-parser";

export interface CryptoNewsItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string | null;
  description: string | null;
}

const FEEDS: { source: string; url: string }[] = [
  { source: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
  { source: "Cointelegraph", url: "https://cointelegraph.com/rss" },
  { source: "Decrypt", url: "https://decrypt.co/feed" },
];

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
    }));
  } catch {
    return [];
  }
}

export async function getCryptoNews(): Promise<CryptoNewsItem[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.items;
  }

  const results = await Promise.all(FEEDS.map((feed) => fetchFeed(feed.source, feed.url)));
  const items = results
    .flat()
    .filter((item) => item.title && item.link)
    .sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });

  cache = { items, fetchedAt: Date.now() };
  return items;
}
