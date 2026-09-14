import { NextResponse } from "next/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CHECKOUT_ADAPTERS } from "@/lib/tracking/checkout-adapters";
import { resolvePlano } from "@/lib/sendpulse/planos";
import { normalizarTelefone } from "@/lib/sendpulse/dispatch";

// Quem comprou, em que plano está e se já assinou o contrato — com e-mail e
// telefone à mão, porque a razão de existir desta tela é cobrar quem ainda
// não assinou (sem assinatura o acesso não abre).
//
// Admin only: é uma lista de contatos de clientes.

interface Aluno {
  email: string;
  nome: string;
  phone: string;
  plano: string | null;
  assinou: boolean;
  primeira_compra: string | null;
  ultima_compra: string | null;
  assinado_em: string | null;
}

export async function GET(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const productId = new URL(request.url).searchParams.get("product_id");
  if (!productId) return NextResponse.json({ error: "product_id é obrigatório." }, { status: 400 });

  const admin = createAdminClient();

  const { data: eventos } = await admin
    .from("tracking_events")
    .select("email, event_type, source, offer_name, raw_payload, occurred_at")
    .eq("product_id", productId)
    .in("event_type", ["purchase", "contract_signed"])
    .not("email", "is", null)
    .order("occurred_at", { ascending: true });

  const porEmail = new Map<string, Aluno>();

  for (const ev of eventos ?? []) {
    const email = (ev.email ?? "").trim().toLowerCase();
    if (!email) continue;

    const atual: Aluno = porEmail.get(email) ?? {
      email,
      nome: "",
      phone: "",
      plano: null,
      assinou: false,
      primeira_compra: null,
      ultima_compra: null,
      assinado_em: null,
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
      const alvo = porEmail.get((lead.email ?? "").toLowerCase());
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
  });
}
