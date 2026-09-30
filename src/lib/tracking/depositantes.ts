import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { normalizarEmail } from "@/lib/tracking/email";
import { normalizarTelefone } from "@/lib/sendpulse/dispatch";

/*
  Quem depositou na corretora — a lista COMPLETA, direto dos depósitos.

  A lista de "Alunos e contratos" só marca depósito em quem já está nela
  (comprou o curso com o mesmo e-mail), então quem abriu a corretora com
  outro e-mail, ou nunca passou pelo checkout, some dali. Aqui é o contrário:
  parte de cada depósito recebido e agrupa por pessoa, sem depender de ter
  comprado. O nome e o telefone vêm do próprio payload da corretora.
*/

export interface Deposito {
  /** Quando o dinheiro caiu (ISO). */
  em: string;
  valor_cents: number;
  /** "USD" ou "BRL" — a corretora manda a moeda de cada depósito. */
  moeda: "USD" | "BRL";
}

export interface Depositante {
  email: string;
  nome: string;
  phone: string;
  depositos: Deposito[];
  total_usd_cents: number;
  total_brl_cents: number;
}

type Admin = ReturnType<typeof createAdminClient>;

function ehRegistro(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function texto(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Lê nome e telefone do payload cru da corretora (Memex e formato genérico). */
function dadosDoPayload(raw: unknown): { nome: string; phone: string } {
  if (!ehRegistro(raw)) return { nome: "", phone: "" };
  const data = ehRegistro(raw.data) ? raw.data : raw;
  const lead = ehRegistro(data.lead) ? data.lead : null;

  const primeiro = texto(data.firstName) || texto(lead?.firstName);
  const ultimo = texto(data.lastName) || texto(lead?.lastName);
  const nome = [primeiro, ultimo].filter(Boolean).join(" ") || texto(data.name) || texto(raw.name);

  const phone = texto(data.phone) || texto(lead?.phone) || texto(raw.phone);
  return { nome, phone };
}

export async function carregarDepositantes(admin: Admin, productId: string): Promise<Depositante[]> {
  // Em páginas porque o PostgREST corta em 1000 linhas sem avisar — a lista
  // perderia os depósitos mais recentes e ninguém desconfiaria.
  const PAGINA = 1000;
  const eventos: {
    email: string | null;
    lead_id: string | null;
    amount_cents: number | null;
    currency: string | null;
    occurred_at: string;
    raw_payload: Record<string, unknown> | null;
  }[] = [];

  for (let inicio = 0; ; inicio += PAGINA) {
    const { data: pagina } = await admin
      .from("tracking_events")
      .select("email, lead_id, amount_cents, currency, occurred_at, raw_payload")
      .eq("product_id", productId)
      .eq("event_type", "broker_deposit")
      .order("occurred_at", { ascending: true })
      .range(inicio, inicio + PAGINA - 1);

    if (!pagina || pagina.length === 0) break;
    eventos.push(...pagina);
    if (pagina.length < PAGINA) break;
  }

  const porPessoa = new Map<string, Depositante>();

  for (const ev of eventos) {
    const email = normalizarEmail(ev.email) ?? "";
    // Sem e-mail, o lead identifica a pessoa; sem nenhum dos dois, o depósito
    // ainda conta (o dinheiro entrou), mas fica como uma pessoa à parte.
    const chave = email || (ev.lead_id ? `lead:${ev.lead_id}` : `evento:${ev.occurred_at}:${porPessoa.size}`);

    const atual: Depositante = porPessoa.get(chave) ?? {
      email,
      nome: "",
      phone: "",
      depositos: [],
      total_usd_cents: 0,
      total_brl_cents: 0,
    };

    const { nome, phone } = dadosDoPayload(ev.raw_payload);
    // Ordem crescente: o último nome visto é o mais recente.
    if (nome) atual.nome = nome;
    if (phone) atual.phone = normalizarTelefone(phone) || atual.phone;

    const valor = Number(ev.amount_cents) || 0;
    const moeda: Deposito["moeda"] = (ev.currency ?? "").toUpperCase() === "BRL" ? "BRL" : "USD";
    atual.depositos.push({ em: ev.occurred_at, valor_cents: valor, moeda });
    if (moeda === "BRL") atual.total_brl_cents += valor;
    else atual.total_usd_cents += valor;

    porPessoa.set(chave, atual);
  }

  // Quem não trouxe telefone no depósito pode ter deixado em outra etapa da
  // jornada — o lead guarda o que apareceu em qualquer uma.
  const semTelefone = Array.from(porPessoa.values())
    .filter((p) => !p.phone && p.email)
    .map((p) => p.email);
  for (let i = 0; i < semTelefone.length; i += 200) {
    const { data: leads } = await admin
      .from("tracking_leads")
      .select("email, phone")
      .eq("product_id", productId)
      .in("email", semTelefone.slice(i, i + 200))
      .not("phone", "is", null);

    for (const lead of leads ?? []) {
      const alvo = porPessoa.get(normalizarEmail(lead.email) ?? "");
      if (alvo && !alvo.phone && lead.phone) alvo.phone = normalizarTelefone(lead.phone);
    }
  }

  return Array.from(porPessoa.values()).sort(
    (a, b) => b.total_usd_cents - a.total_usd_cents || b.total_brl_cents - a.total_brl_cents
  );
}
