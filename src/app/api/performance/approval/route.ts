import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { getApprovalContext } from "@/lib/performance/message-approval";

export async function GET(request: Request) {
  const profile = await getSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const scope = new URL(request.url).searchParams.get("scope");
  if (scope !== "grupo" && scope !== "direct") {
    return NextResponse.json({ error: "scope deve ser 'grupo' ou 'direct'." }, { status: 400 });
  }

  const context = await getApprovalContext(scope);
  return NextResponse.json({ context });
}
