import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { getCryptoNews } from "@/lib/news/crypto-feeds";

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const items = await getCryptoNews();
  return NextResponse.json({ items });
}
