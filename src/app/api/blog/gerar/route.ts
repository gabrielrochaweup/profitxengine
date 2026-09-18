import { NextResponse } from "next/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateText } from "@/lib/ai";
import { getDecryptedKey, getProviderSettings } from "@/lib/ai/credentials";
import { CAMPOS_POST, gerarSlug, temaDaSlug } from "@/lib/blog";

// Texto longo demora; o padrão de 10s do Vercel mataria a função no meio da
// escrita e a pessoa veria só um erro genérico.
export const maxDuration = 60;

interface Gerado {
  titulo: string;
  meta_descricao: string;
  palavra_chave: string;
  slug: string;
  conteudo_md: string;
  imagem_prompt: string;
  imagem_alt: string;
}

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "editor")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const productId: string | undefined = body?.product_id;
  const dominioId: string | null = typeof body?.dominio_id === "string" ? body.dominio_id : null;
  const slugPedida: string = typeof body?.slug === "string" ? gerarSlug(body.slug) : "";
  const temaPedido: string = typeof body?.tema === "string" ? body.tema.trim() : "";

  // Os dois caminhos de criação terminam na mesma frase: quem entrega só a
  // slug recebe ela virada em texto, pra o modelo escrever a partir de uma
  // frase e não de um identificador com hífen.
  const tema = temaPedido || (slugPedida ? temaDaSlug(slugPedida) : "");
  if (!productId || !tema) {
    return NextResponse.json({ error: "Informe um tema ou uma slug." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: dominio } = dominioId
    ? await admin
        .from("blog_dominios")
        .select("dominio, nome, idioma, publico_alvo, tom")
        .eq("id", dominioId)
        .single()
    : { data: null };

  try {
    const settings = await getProviderSettings("blog");
    const apiKey = await getDecryptedKey(settings.provider);
    if (!apiKey) {
      return NextResponse.json(
        { error: `Nenhuma chave configurada para ${settings.provider}. Configure em Configurações.` },
        { status: 422 }
      );
    }

    const { text, tokensUsed } = await generateText(
      {
        prompt: montarPrompt(tema, slugPedida, dominio),
        provider: settings.provider,
        model: settings.model,
        system: SISTEMA,
        maxTokens: 8000,
      },
      apiKey
    );

    const gerado = lerJson(text);
    if (!gerado) {
      return NextResponse.json({ error: "O modelo respondeu fora do formato esperado. Tente de novo." }, { status: 502 });
    }

    await admin.from("ai_usage_log").insert({
      module: "blog",
      provider: settings.provider,
      model: settings.model,
      tokens_used: tokensUsed,
      created_by: profile.userId,
    });

    // Slug pedida manda: quem digitou "como-declarar-cripto" está mirando
    // essa URL, e deixar o modelo reescrever ela devolveria outra página.
    const slug = slugPedida || gerarSlug(gerado.slug || gerado.titulo);

    const { data, error } = await admin
      .from("blog_posts")
      .insert({
        product_id: productId,
        dominio_id: dominioId,
        slug,
        titulo: gerado.titulo,
        meta_descricao: gerado.meta_descricao,
        palavra_chave: gerado.palavra_chave,
        conteudo_md: gerado.conteudo_md,
        imagem_alt: gerado.imagem_alt,
        tema,
        created_by: profile.userId,
      })
      .select(CAMPOS_POST)
      .single();

    if (error) {
      const repetido = error.code === "23505";
      return NextResponse.json(
        {
          error: repetido
            ? `Já existe um post com a slug "${slug}" nesse domínio.`
            : "O texto foi gerado mas falhou ao salvar.",
        },
        { status: repetido ? 409 : 500 }
      );
    }

    // O prompt da imagem volta pro cliente em vez de virar coluna: ele serve
    // uma vez, pra chamada de imagem logo em seguida, e guardar prompt de
    // imagem em post seria dado morto na tabela.
    return NextResponse.json({ post: data, imagem_prompt: gerado.imagem_prompt });
  } catch (err) {
    const motivo = err instanceof Error ? err.message : "Falha ao gerar o texto.";
    return NextResponse.json({ error: motivo.slice(0, 300) }, { status: 500 });
  }
}

const SISTEMA = `Você é redator de conteúdo para blogs corporativos brasileiros, com foco em busca orgânica.

Escreva como quem conhece o assunto de dentro e está explicando para uma pessoa específica — não como quem preenche espaço. Regras que valem sempre:

- Responda à intenção de quem buscou já nos dois primeiros parágrafos. Nada de aquecimento.
- Use exemplos concretos, números e situações reais. Um parágrafo que serviria para qualquer empresa do ramo não serve para nenhuma.
- Frases diretas. Sem "no mundo de hoje", "é importante ressaltar", "neste artigo vamos".
- Não invente dado, estatística, data, preço nem citação. Se a afirmação precisa de um número que você não tem, escreva a ideia sem o número.
- Subtítulos que dizem o que vem abaixo, não rótulos vagos como "Conclusão" ou "Considerações finais".
- A palavra-chave aparece onde faz sentido na frase. Repetir por repetir piora o texto e não ajuda o ranqueamento.

Responda SOMENTE com um objeto JSON válido, sem cercas de código e sem texto antes ou depois, neste formato:

{
  "titulo": "título do post, até 60 caracteres",
  "meta_descricao": "resumo para o Google, 140 a 158 caracteres",
  "palavra_chave": "a expressão principal de busca",
  "slug": "slug-sugerida-em-minusculas",
  "conteudo_md": "o post em Markdown, começando por um parágrafo (NUNCA por # título) e usando ## para os subtítulos",
  "imagem_prompt": "descrição em inglês de uma imagem de capa fotográfica, sem texto na imagem, sem logotipo, sem rosto reconhecível",
  "imagem_alt": "texto alternativo da imagem, em português"
}`;

function montarPrompt(
  tema: string,
  slug: string,
  dominio: { dominio: string; nome: string | null; idioma: string; publico_alvo: string | null; tom: string | null } | null
): string {
  const linhas = [`Tema do post: ${tema}`];
  if (slug) linhas.push(`A URL já está definida como "${slug}" — escreva o post para essa página.`);
  if (dominio) {
    linhas.push(`Site: ${dominio.nome ?? dominio.dominio} (${dominio.dominio})`);
    linhas.push(`Idioma: ${dominio.idioma}`);
    if (dominio.publico_alvo) linhas.push(`Quem lê: ${dominio.publico_alvo}`);
    if (dominio.tom) linhas.push(`Tom de voz: ${dominio.tom}`);
  }
  linhas.push("Tamanho: entre 900 e 1400 palavras.");
  return linhas.join("\n");
}

/**
 * Lê o JSON da resposta, tolerando o que os modelos costumam grudar em volta.
 *
 * Mesmo mandando "só JSON", vem cerca de markdown ou uma frase antes. Cair
 * fora por causa disso jogaria no lixo um texto que já foi pago.
 */
function lerJson(texto: string): Gerado | null {
  const limpo = texto
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const inicio = limpo.indexOf("{");
  const fim = limpo.lastIndexOf("}");
  if (inicio === -1 || fim <= inicio) return null;

  try {
    const obj = JSON.parse(limpo.slice(inicio, fim + 1)) as Partial<Gerado>;
    if (!obj.titulo || !obj.conteudo_md) return null;
    return {
      titulo: String(obj.titulo).slice(0, 200),
      meta_descricao: String(obj.meta_descricao ?? "").slice(0, 300),
      palavra_chave: String(obj.palavra_chave ?? "").slice(0, 120),
      slug: String(obj.slug ?? ""),
      conteudo_md: String(obj.conteudo_md),
      imagem_prompt: String(obj.imagem_prompt ?? `editorial cover photo about ${obj.titulo}`),
      imagem_alt: String(obj.imagem_alt ?? String(obj.titulo)).slice(0, 300),
    };
  } catch {
    return null;
  }
}
