import type { PromptCategory } from "@/lib/supabase/types";

export const PROMPT_CATEGORY_LABEL: Record<PromptCategory, string> = {
  conversa: "Conversa",
  mensagem: "Mensagem",
  imagem: "Imagem",
  email: "E-mail",
};

export const PROMPT_CATEGORIES: PromptCategory[] = ["conversa", "mensagem", "imagem", "email"];
