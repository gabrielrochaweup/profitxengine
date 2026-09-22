import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { getActiveProduct } from "@/lib/products-server";
import { getNicheNews } from "@/lib/news/niche-feeds";

export async function GET(request: Request) {
  const profile = await getSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const activeProduct = await getActiveProduct(profile.userId);

  const { searchParams } = new URL(request.url);
  const before = searchParams.get("before");

  const { items: allItems, trending, label } = await getNicheNews(activeProduct?.niche);

  let items = allItems;
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

  return NextResponse.json({ items, trending, label });
}
