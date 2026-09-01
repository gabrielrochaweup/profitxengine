import { NextResponse } from "next/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("tracking_webhook_log")
    .select("id, raw_payload, accepted, error, received_at")
    .eq("endpoint_id", params.id)
    .order("received_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ logs: data ?? [] });
}
