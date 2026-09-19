import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { CHECKOUT_ADAPTERS } from "@/lib/tracking/checkout-adapters";
import { resolvePlano } from "@/lib/sendpulse/planos";
import { normalizarTelefone } from "@/lib/sendpulse/dispatch";
import { normalizarEmail } from "@/lib/tracking/email";

/*
  Quem comprou, em que pé está.

  Mora numa lib e não na rota porque duas telas fazem a mesma pergunta: a
  lista de "Alunos e contratos" (que precisa das linhas) e o resumo do
  Dashboard (que precisa só dos totais). Duplicar a montagem daria dois
  números diferentes pra mesma coisa na mesma semana.
*/

export interface Aluno {
  email: string;
  nome: string;
  phone: string;
  plano: string | null;
  assinou: boolean;
  pepe: boolean;
  /** Tem conta na corretora (evento broker_signup com este e-mail). */
  corretora: boolean;
  /** Já pôs dinheiro lá dentro — é quem NÃO tem aqui que se chama pra depositar. */
  depositou: boolean;
  depositos: number;
  /** Sempre em dólar: depósito de corretora não é cobrado em real. */
  depositado_cents: number;
  primeira_compra: string | null;
  ultima_compra: string | null;
  assinado_em: string | null;
  pepe_em: string | null;
  corretora_em: string | null;
  deposito_em: string | null;
}

type Admin = ReturnType<typeof createAdminClient>;

export async function carregarAlunos(admin: Admin, productId: string): Promise<Aluno[]> {

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
      corretora: false,
      depositou: false,
      depositos: 0,
      depositado_cents: 0,
      primeira_compra: null,
      ultima_compra: null,
      assinado_em: null,
      pepe_em: null,
      corretora_em: null,
      deposito_em: null,
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

  // Corretora: conta aberta e dinheiro depositado.
  //
  // Mesma regra do Pepe — marca em aluno que já existe, nunca cria linha —
  // e pelo mesmo motivo: quem só abriu conta na corretora sem comprar o
  // curso não é aluno desta lista.
  //
  // O casamento é por e-mail. Se a pessoa abriu a conta na corretora com
  // outro e-mail, ela aparece aqui como "sem conta" — a tela diz isso na
  // dica da coluna, porque um "não" errado numa lista de cobrança faz
  // alguém receber a mensagem errada.
  const corretoraPorEmail = new Map<string, { conta: string | null; primeiro: string | null; qtd: number; total: number }>();
  for (let inicio = 0; ; inicio += PAGINA) {
    const { data: pagina } = await admin
      .from("tracking_events")
      .select("email, event_type, amount_cents, occurred_at")
      .eq("product_id", productId)
      .in("event_type", ["broker_signup", "broker_deposit"])
      .not("email", "is", null)
      .order("occurred_at", { ascending: true })
      .range(inicio, inicio + PAGINA - 1);

    if (!pagina || pagina.length === 0) break;
    for (const ev of pagina) {
      const email = normalizarEmail(ev.email);
      if (!email) continue;
      const atual = corretoraPorEmail.get(email) ?? { conta: null, primeiro: null, qtd: 0, total: 0 };
      if (ev.event_type === "broker_signup") {
        // Ordem crescente: o primeiro que aparece é o cadastro de verdade.
        atual.conta = atual.conta ?? ev.occurred_at;
      } else {
        atual.primeiro = atual.primeiro ?? ev.occurred_at;
        atual.qtd += 1;
        atual.total += Number(ev.amount_cents) || 0;
      }
      corretoraPorEmail.set(email, atual);
    }
    if (pagina.length < PAGINA) break;
  }

  for (const [email, dados] of Array.from(corretoraPorEmail)) {
    const alvo = porEmail.get(email);
    if (!alvo) continue;
    // Depósito sem cadastro visto ainda é conta na corretora: não dá pra
    // depositar sem ter conta, e o evento de cadastro pode ter chegado
    // antes de existirmos ou com outro e-mail.
    alvo.corretora = dados.conta !== null || dados.qtd > 0;
    alvo.corretora_em = dados.conta;
    alvo.depositou = dados.qtd > 0;
    alvo.depositos = dados.qtd;
    alvo.depositado_cents = dados.total;
    alvo.deposito_em = dados.primeiro;
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

  return Array.from(porEmail.values()).sort((a, b) =>
    (b.ultima_compra ?? "").localeCompare(a.ultima_compra ?? "")
  );
}

/** Os totais que o Dashboard mostra — mesma definição de aluno da lista. */
export function resumoDeAlunos(alunos: Aluno[]) {
  return {
    total: alunos.length,
    semContrato: alunos.filter((a) => !a.assinou).length,
    semPepe: alunos.filter((a) => !a.pepe).length,
    semCorretora: alunos.filter((a) => !a.corretora).length,
    semDeposito: alunos.filter((a) => !a.depositou).length,
  };
}
