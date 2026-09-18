import { NextResponse } from "next/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CAMPOS_POST } from "@/lib/blog";

export async function GET(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "editor")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const productId = new URL(request.url).searchParams.get("product_id");
  if (!productId) return NextResponse.json({ error: "product_id é obrigatório." }, { status: 400 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_posts")
    .select(CAMPOS_POST)
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(500);

  return NextResponse.json({ posts: data ?? [] });
}
