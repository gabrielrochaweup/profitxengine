import { NextResponse } from "next/server";
import { resolveTxt } from "dns/promises";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CAMPOS_DOMINIO, nomeRegistroTxt } from "@/lib/blog";

// Confere se o TXT com o token está publicado no domínio.
//
// Prova de posse existe aqui pelo mesmo motivo que existe em qualquer
// ferramenta que publica em nome de alguém: sem ela, bastaria cadastrar
// "concorrente.com" pra escrever no lugar dele quando a parte de servir o
// blog entrar no ar.
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "editor")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: dominio } = await admin
    .from("blog_dominios")
    .select("id, dominio, token_verificacao")
    .eq("id", params.id)
    .single();

  if (!dominio) return NextResponse.json({ error: "Domínio não encontrado." }, { status: 404 });

  const nome = nomeRegistroTxt(dominio.dominio);
  let registros: string[][] = [];
  try {
    registros = await resolveTxt(nome);
  } catch (err) {
    // ENOTFOUND/ENODATA é o caso comum e esperado: ainda não publicaram o
    // TXT, ou publicaram há pouco e não propagou. Qualquer outro código
    // (DNS fora do ar, saída bloqueada) é problema NOSSO, e devolver a
    // mesma frase pros dois faria a pessoa mexer no DNS dela à toa,
    // procurando um erro que não está lá.
    const codigo = (err as NodeJS.ErrnoException)?.code ?? "";
    const aindaNaoPublicado = codigo === "ENOTFOUND" || codigo === "ENODATA";
    return NextResponse.json({
      verificado: false,
      erro: aindaNaoPublicado
        ? `Nenhum registro TXT encontrado em ${nome}. Se acabou de criar, o DNS pode levar alguns minutos.`
        : `Não foi possível consultar o DNS (${codigo || "erro desconhecido"}). Isso é do nosso lado, não do seu domínio.`,
    });
  }

  const valores = registros.map((partes) => partes.join("").trim());
  const bate = valores.includes(dominio.token_verificacao);

  if (!bate) {
    return NextResponse.json({
      verificado: false,
      erro: `O TXT em ${nome} existe mas tem outro valor. Encontrado: ${valores.join(", ") || "(vazio)"}`,
    });
  }

  const { data } = await admin
    .from("blog_dominios")
    .update({ verificado: true, verificado_em: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select(CAMPOS_DOMINIO)
    .single();

  return NextResponse.json({ verificado: true, dominio: data });
}
