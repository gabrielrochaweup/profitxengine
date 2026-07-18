import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Modelos de imagem mais novos (GPT Image, Gemini/Nano Banana) devolvem a
 * imagem em base64 em vez de uma URL hospedada. Salvamos no nosso Storage
 * (bucket público "generated-images") pra virar uma URL permanente.
 */
export async function uploadGeneratedImage(base64: string, mimeType: string): Promise<string> {
  const admin = createAdminClient();
  const extension = mimeType.split("/")[1] ?? "png";
  const path = `${crypto.randomUUID()}.${extension}`;
  const buffer = Buffer.from(base64, "base64");

  const { error } = await admin.storage.from("generated-images").upload(path, buffer, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) {
    throw new Error(`Erro ao salvar imagem gerada: ${error.message}`);
  }

  const { data } = admin.storage.from("generated-images").getPublicUrl(path);
  return data.publicUrl;
}
