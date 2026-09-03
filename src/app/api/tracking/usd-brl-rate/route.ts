import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { getUsdBrlRate } from "@/lib/tracking/usd-brl-rate";

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const result = await getUsdBrlRate();
  return NextResponse.json(result ?? { rate: null, updatedAt: null });
}
