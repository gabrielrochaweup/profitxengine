import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/crypto";

export async function getWebhookSecret(key: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("webhook_secrets")
    .select("encrypted_secret")
    .eq("key", key)
    .maybeSingle();

  if (!data) return null;
  return decryptSecret(data.encrypted_secret);
}
