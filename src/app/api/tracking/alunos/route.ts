import { NextResponse } from "next/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CHECKOUT_ADAPTERS } from "@/lib/tracking/checkout-adapters";
import { resolvePlano } from "@/lib/sendpulse/planos";
import { normalizarTelefone } from "@/lib/sendpulse/dispatch";
import { normalizarEmail } from "@/lib/tracking/email";

// Quem comprou, em que plano está, se já assinou o contrato e se já criou
// conta no Pepe — com e-mail e telefone à mão, porque a razão de existir
// desta tela é cobrar quem ficou pelo caminho (sem assinatura o acesso nem
// abre; sem conta no Pepe a pessoa comprou e não está usando a ferramenta).
//
// Admin only: é uma lista de contatos de clientes.

interface Aluno {
  email: string;
  nome: string;
  phone: string;
  plano: string | null;
  assinou: boolean;
  pepe: boolean;
  primeira_compra: string | null;
  ultima_compra: string | null;
  assinado_em: string | null;
  pepe_em: string | null;
}

export async function GET(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const productId = new URL(request.url).searchParams.get("product_id");
  if (!productId) return NextResponse.json({ error: "product_id é obrigatório." }, { status: 400 });

  const admin = createAdminClient();

  // Em páginas porque o PostgREST corta em 1000 linhas por padrão, sem
  // avisar. Passando disso, a lista simplesmente perderia os alunos mais
  // recentes (a ordem é crescente) e ninguém desconfiaria — é o tipo de
  // erro que só aparece quando alguém reclama de não ter sido cobrado.
  const PAGINA = 1000;
  const eventos: {
    email: string | null;
    event_type: string;
    source: string;
    offer_name: string | null;
    raw_payload: Record<string, unknown> | null;
    occurred_at: string;
  }[] = [];

  for (let inicio = 0; ; inicio += PAGINA) {
    const { data: pagina } = await admin
      .from("tracking_events")
      .select("email, event_type, source, offer_name, raw_payload, occurred_at")
      .eq("product_id", productId)
      .in("event_type", ["purchase", "contract_signed"])
      .not("email", "is", null)
      .order("occurred_at", { ascending: true })
      .range(inicio, inicio + PAGINA - 1);

    if (!pagina || pagina.length === 0) break;
    eventos.push(...pagina);
    if (pagina.length < PAGINA) break;
  }

  const porEmail = new Map<string, Aluno>();

  for (const ev of eventos) {
    const email = normalizarEmail(ev.email);
    if (!email) continue;

    const atual: Aluno = porEmail.get(email) ?? {
      email,
      nome: "",
      phone: "",
      plano: null,
      assinou: false,
      pepe: false,
      primeira_compra: null,
      ultima_compra: null,
      assinado_em: null,
      pepe_em: null,
    };

    if (ev.event_type === "contract_signed") {
      atual.assinou = true;
      atual.assinado_em = ev.occurred_at;
      // A assinatura traz telefone quando a compra não trouxe — o modelo da
      // ZapSign exige o campo.
      const zap = ev.raw_payload as Record<string, unknown> | null;
      if (!atual.phone && zap && typeof zap.phone === "string") {
        atual.phone = normalizarTelefone(zap.phone);
      }
      if (!atual.nome && zap && typeof zap.name === "string") atual.nome = zap.name;
    } else {
      // Relê o payload guardado com o mesmo adapter que o interpretou na
      // chegada, em vez de repetir aqui o formato de cada plataforma.
      const adapter = ev.source ? CHECKOUT_ADAPTERS[ev.source] : undefined;
      const lido = adapter ? adapter(ev.raw_payload) : null;

      // Eventos vêm em ordem crescente, então a última compra vista é a mais
      // recente — é ela que define o plano atual.
      atual.plano = resolvePlano(lido?.offerId ?? null, lido?.offerName ?? ev.offer_name) ?? atual.plano;
      atual.primeira_compra = atual.primeira_compra ?? ev.occurred_at;
      atual.ultima_compra = ev.occurred_at;
      if (lido?.name) atual.nome = lido.name;
      if (lido?.phone) atual.phone = normalizarTelefone(lido.phone) || atual.phone;
    }

    porEmail.set(email, atual);
  }

  // Cadastro no Pepe entra como marca num aluno que já existe, nunca criando
  // linha nova: esta lista é "quem comprou ou assinou", e alguém que só criou
  // conta na ferramenta (time, teste, convidado) não virou aluno. Por isso é
  // uma segunda passada, e não mais um event_type na busca de cima — ali um
  // cadastro no Pepe anterior à compra chegaria antes de existir a linha
  // pra marcar.
  const pepePorEmail = new Map<string, string>();
  for (let inicio = 0; ; inicio += PAGINA) {
    const { data: pagina } = await admin
      .from("tracking_events")
      .select("email, occurred_at")
      .eq("product_id", productId)
      .eq("event_type", "tool_signup")
      .not("email", "is", null)
      .order("occurred_at", { ascending: true })
      .range(inicio, inicio + PAGINA - 1);

    if (!pagina || pagina.length === 0) break;
    for (const ev of pagina) {
      const email = normalizarEmail(ev.email);
      // Ordem crescente: o primeiro que aparece é o cadastro de verdade.
      if (email && !pepePorEmail.has(email)) pepePorEmail.set(email, ev.occurred_at);
    }
    if (pagina.length < PAGINA) break;
  }

  for (const [email, quando] of Array.from(pepePorEmail)) {
    const alvo = porEmail.get(email);
    if (alvo) {
      alvo.pepe = true;
      alvo.pepe_em = quando;
    }
  }

  // Completa o telefone de quem não trouxe em nenhum evento: o lead guarda o
  // que apareceu em qualquer etapa da jornada.
  const semTelefone = Array.from(porEmail.values()).filter((a) => !a.phone).map((a) => a.email);
  if (semTelefone.length > 0) {
    const { data: leads } = await admin
      .from("tracking_leads")
      .select("email, phone")
      .eq("product_id", productId)
      .in("email", semTelefone)
      .not("phone", "is", null);

    for (const lead of leads ?? []) {
      const alvo = porEmail.get(normalizarEmail(lead.email) ?? "");
      if (alvo && lead.phone) alvo.phone = normalizarTelefone(lead.phone);
    }
  }

  const alunos = Array.from(porEmail.values()).sort((a, b) =>
    (b.ultima_compra ?? "").localeCompare(a.ultima_compra ?? "")
  );

  return NextResponse.json({
    alunos,
    total: alunos.length,
    sem_contrato: alunos.filter((a) => !a.assinou).length,
    sem_pepe: alunos.filter((a) => !a.pepe).length,
  });
}
