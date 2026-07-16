import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/crypto";
import { DEFAULT_MODELS, type AiProvider } from "./types";
import type { AiModule } from "@/lib/supabase/types";

export async function getDecryptedKey(provider: AiProvider): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("ai_credentials")
    .select("encrypted_key, is_valid")
    .eq("provider", provider)
    .maybeSingle();

  if (!data || !data.is_valid) return null;
  return decryptSecret(data.encrypted_key);
}

export async function getProviderSettings(
  module: AiModule
): Promise<{ provider: AiProvider; model: string }> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("ai_provider_settings")
    .select("provider, model")
    .eq("module", module)
    .maybeSingle();

  if (data) return data;

  return { provider: "openai", model: DEFAULT_MODELS.openai.text };
}

export async function incrementPromptUsage(promptId: string): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("prompts")
    .select("usage_count")
    .eq("id", promptId)
    .maybeSingle();

  if (data) {
    await admin.from("prompts").update({ usage_count: data.usage_count + 1 }).eq("id", promptId);
  }
}
