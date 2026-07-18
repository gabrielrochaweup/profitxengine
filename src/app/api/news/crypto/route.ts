import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { getCryptoNews, getTrendingCoins } from "@/lib/news/crypto-feeds";

export async function GET(request: Request) {
  const profile = await getSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const before = searchParams.get("before");

  let items = await getCryptoNews();

  if (before) {
    const endOfDay = new Date(`${before}T23:59:59.999Z`).getTime();
    if (!Number.isNaN(endOfDay)) {
      items = items.filter((item) => {
        if (!item.publishedAt) return true;
        const publishedAt = new Date(item.publishedAt).getTime();
        return Number.isNaN(publishedAt) || publishedAt <= endOfDay;
      });
    }
  }

  // Trending só faz sentido pra "agora" — não filtramos por data porque a
  // API não tem dado histórico, só o momento atual.
  const trending = await getTrendingCoins();

  return NextResponse.json({ items, trending });
}
