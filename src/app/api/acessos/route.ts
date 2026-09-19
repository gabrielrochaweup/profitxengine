import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptSecret } from "@/lib/crypto";
import { CAMPOS_ACESSO, ehCategoria, ehCiclo, ehMoeda } from "@/lib/acessos";

// Só admin, nas três rotas de Acessos.
//
// A tela nasceu aberta pra editor, com o argumento de que trancar em admin
// devolveria todo mundo pro grupo do WhatsApp pedindo senha. A decisão foi
// revista: aqui moram as senhas das contas da empresa e o lugar onde está o
// segundo fator, e esse conteúdo não é insumo de quem edita conteúdo.
//
// A checagem é repetida em cada handler de propósito — a rota é o portão de
// verdade. Esconder o item do menu é conveniência; sem isto, bastava chamar
// a URL direto.

export async function GET(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const productId = new URL(request.url).searchParams.get("product_id");
  if (!productId) return NextResponse.json({ error: "product_id é obrigatório." }, { status: 400 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("acessos")
    .select(`${CAMPOS_ACESSO}, encrypted_senha`)
    .eq("product_id", productId)
    .order("categoria", { ascending: true })
    .order("nome", { ascending: true });

  // A senha cifrada nunca sai daqui — a listagem só conta se existe uma.
  const acessos = (data ?? []).map(({ encrypted_senha, ...resto }) => ({
    ...resto,
    tem_senha: !!encrypted_senha,
  }));

  return NextResponse.json({ acessos });
}

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const productId: string | undefined = body?.product_id;
  const nome: string = typeof body?.nome === "string" ? body.nome.trim() : "";
  if (!productId || !nome) {
    return NextResponse.json({ error: "product_id e nome são obrigatórios." }, { status: 400 });
  }

  const senha: string = typeof body?.senha === "string" ? body.senha : "";
  const assinatura = body?.assinatura === true;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("acessos")
    .insert({
      product_id: productId,
      nome,
      categoria: ehCategoria(body?.categoria) ? body.categoria : "rede",
      url: texto(body?.url),
      usuario: texto(body?.usuario),
      encrypted_senha: senha ? encryptSecret(senha) : null,
      login_google: body?.login_google === true,
      tem_2fa: body?.tem_2fa === true,
      onde_2fa: texto(body?.onde_2fa),
      responsavel: texto(body?.responsavel),
      assinatura,
      // Zera o valor quando não é assinatura: guardar preço num acesso
      // gratuito faria o total subir sem nada na tela explicando por quê.
      valor_cents: assinatura ? centavos(body?.valor_cents) : 0,
      moeda: ehMoeda(body?.moeda) ? body.moeda : "BRL",
      ciclo: ehCiclo(body?.ciclo) ? body.ciclo : "mensal",
      observacoes: texto(body?.observacoes),
      created_by: profile.userId,
    })
    .select(CAMPOS_ACESSO)
    .single();

  if (error || !data) return NextResponse.json({ error: "Falha ao salvar." }, { status: 500 });

  return NextResponse.json({ acesso: { ...data, tem_senha: !!senha } });
}

function texto(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function centavos(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}
