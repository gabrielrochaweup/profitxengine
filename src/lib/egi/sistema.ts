import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type Admin = SupabaseClient<Database>;

// Teto do FAQ no contexto. O manual já ocupa ~20 mil tokens; o FAQ cresce
// com o uso, e sem teto chegaria o dia em que a pergunta não cabe mais. As
// mais recentes entram primeiro — são as que refletem a regra de hoje.
const LIMITE_FAQ_CARACTERES = 40_000;

/**
 * O "system" da Egi: o prompt, depois cada arquivo ativo inteiro, depois as
 * respostas que a equipe já aprovou no FAQ.
 *
 * Montado de novo a cada pergunta, de propósito: mudar o prompt ou trocar o
 * manual em Configurações vale na próxima mensagem, sem deploy e sem cache
 * pra invalidar. A ordem (fixo primeiro, FAQ por último) é a que deixa o
 * cache do provedor reaproveitar o começo, que é a parte grande.
 */
export async function montarSistemaDaEgi(admin: Admin, productId: string): Promise<{ system: string; vazio: boolean }> {
  const [{ data: config }, { data: arquivos }, { data: faq }] = await Promise.all([
    admin.from("egi_config").select("prompt").eq("product_id", productId).maybeSingle(),
    admin
      .from("egi_arquivos")
      .select("nome, conteudo")
      .eq("product_id", productId)
      .eq("ativo", true)
      .order("created_at"),
    admin
      .from("egi_faq")
      .select("pergunta, resposta")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(300),
  ]);

  const partes: string[] = [];
  const prompt = config?.prompt?.trim() ?? "";
  if (prompt) partes.push(prompt);

  if (arquivos && arquivos.length > 0) {
    partes.push(
      [
        "═══════════════════════════════════════════",
        "BASE DE CONHECIMENTO",
        "═══════════════════════════════════════════",
        "Os documentos abaixo são a fonte oficial. Responda com base neles; o que não estiver aqui, trate como fora do manual.",
        ...arquivos.map((a) => `\n##### ARQUIVO: ${a.nome}\n\n${a.conteudo}`),
      ].join("\n")
    );
  }

  if (faq && faq.length > 0) {
    let usado = 0;
    const entradas: string[] = [];
    for (const f of faq) {
      const entrada = `PERGUNTA: ${f.pergunta}\nRESPOSTA APROVADA:\n${f.resposta}`;
      if (usado + entrada.length > LIMITE_FAQ_CARACTERES) break;
      entradas.push(entrada);
      usado += entrada.length;
    }
    partes.push(
      [
        "═══════════════════════════════════════════",
        "RESPOSTAS JÁ APROVADAS PELA EQUIPE (FAQ)",
        "═══════════════════════════════════════════",
        "Estas respostas foram revisadas e salvas pela equipe. Se a pergunta for a mesma ou muito parecida, mantenha a mesma orientação e o mesmo tom — a ideia é que o aluno receba a mesma resposta, não importa quem atendeu. Se o manual contradisser uma delas, o manual vale.",
        ...entradas.map((e, i) => `\n--- ${i + 1} ---\n${e}`),
      ].join("\n")
    );
  }

  return { system: partes.join("\n\n"), vazio: !prompt && (!arquivos || arquivos.length === 0) };
}
