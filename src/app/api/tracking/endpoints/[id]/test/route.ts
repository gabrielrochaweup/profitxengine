import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSessionProfile, ehAprovado } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/crypto";

const KIND_PATH: Record<string, string> = {
  checkout: "checkout",
  members_area: "members-area",
  broker: "broker",
  contract: "contract-signed",
  tool: "tool",
  daily_results: "resultados-do-dia",
};

// Payload sintético por kind/plataforma — mesmo formato que a plataforma
// real manda (ver src/lib/tracking/checkout-adapters/*.ts e os contratos
// documentados nas rotas de members-area/broker), só pra provar que
// URL+token+adapter estão certos antes de colar isso no painel externo.
function buildTestPayload(kind: string, platform: string | null): unknown {
  const testId = `test-${randomBytes(4).toString("hex")}`;
  const now = new Date();

  if (kind === "checkout") {
    if (platform === "hotmart") {
      return {
        event: "PURCHASE_APPROVED",
        data: {
          buyer: { email: "teste@profitx.com" },
          product: { name: "Produto de teste" },
          purchase: {
            transaction: testId,
            price: { value: 1 },
            origin: { sck: "test-lead-id" },
            approved_date: now.getTime(),
          },
        },
      };
    }
    if (platform === "torkpay") {
      return {
        event: "Compra aprovada",
        platform: "TorkPay",
        timestamp: now.toISOString(),
        payload_version: "2.0",
        data: {
          transaction_id: testId,
          buyer: { name: "Teste", email: "teste@profitx.com", phone: "(11) 90000-0000" },
          order: { amount: 1, status: "paid", currency: "BRL", installments: 1, payment_method: "pix" },
          product: { id: "prod_teste", name: "Oferta de teste" },
          sck: "test-lead-id",
        },
      };
    }
    if (platform === "onprofit") {
      return {
        object: "order",
        status: "PAID",
        id: testId,
        price: 1,
        offer_name: "Oferta de teste",
        customer: { email: "teste@profitx.com" },
        sck: "test-lead-id",
        confirmation_purchase_date: now.toISOString().slice(0, 19).replace("T", " "),
      };
    }
    return {
      event: "purchase",
      email: "teste@profitx.com",
      amount_cents: 100,
      external_id: testId,
      ref: "test-lead-id",
      offer_name: "Oferta de teste",
      occurred_at: now.toISOString(),
    };
  }

  if (kind === "members_area") {
    if (platform === "cademi") {
      return {
        event_id: testId,
        event_type: "usuario.criado",
        event: {
          usuario: {
            id: 999999,
            nome: "Teste ProfitX",
            email: "teste@profitx.com",
            criado_em: now.toISOString(),
          },
        },
      };
    }
    return {
      event: "first_login",
      email: "teste@profitx.com",
      ref: "test-lead-id",
      external_id: testId,
      occurred_at: now.toISOString(),
    };
  }

  // Mesmo formato do payload real da Vortex (28/09/2026).
  if (kind === "daily_results") {
    return {
      event: "resultados_do_dia",
      data: now.toISOString().slice(0, 10),
      fuso: "America/Sao_Paulo",
      preenchido: true,
      houve_operacao: true,
      texto: "Resultados de teste · Lives com Traders: 3x1 · 75,0% de acerto",
      pilares: {
        live: { nome: "Lives com Traders", operou: true, placar: "3x1", vitorias: 3, derrotas: 1, taxa: 75, acumulado: { sete_dias: 72.2, trinta_dias: 72.2 } },
        pepe: { nome: "PEPE Signal", operou: true, placar: "10x2", vitorias: 10, derrotas: 2, taxa: 83.3, acumulado: { sete_dias: 87.9, trinta_dias: 87.9 } },
        copy: { nome: "Copy Trader", operou: false, placar: "", vitorias: 0, derrotas: 0, taxa: 0, rentabilidade: 0, acumulado: { sete_dias: 81.8, trinta_dias: 81.8 } },
      },
    };
  }

  // SendPulse manda um ARRAY com um objeto (ver
  // tool-adapters/sendpulse-reengajamento.ts). Sem este caso, o teste desse
  // endpoint recebia o formato do Pepe e acusava falha num endpoint certo.
  if (kind === "tool" && platform === "sendpulse-reengajamento") {
    return [
      {
        info: null,
        service: "whatsapp",
        title: "Teste ProfitX",
        bot: { id: "profitx-self-test", name: "Teste" },
        contact: { id: testId, name: "Teste ProfitX", email: "teste@profitx.com", phone: "5511999999999" },
        date: Math.floor(now.getTime() / 1000),
      },
    ];
  }

  if (kind === "tool") {
    return {
      id: testId,
      event: "user.first_access",
      occurred_at: now.toISOString(),
      app: platform ?? "pepe",
      user: {
        id: 999999,
        name: "Teste ProfitX",
        email: "teste@profitx.com",
        phone: "5511999999999",
        plan: "starter",
        cadastrado: true,
        cadastrado_em: now.toISOString(),
        acesso_criado: true,
        acesso_criado_em: now.toISOString(),
        ativo: true,
        status: "active",
        ultimo_acesso: now.toISOString(),
      },
      data: { ip: "0.0.0.0" },
    };
  }

  if (kind === "contract") {
    return {
      event: "contrato_assinado",
      doc_token: testId,
      doc_name: "Contrato de teste",
      email: "teste@profitx.com",
      name: "Teste ProfitX",
      phone: "5511999999999",
      signed_at: now.toISOString(),
    };
  }

  // broker
  if (platform === "memextrade") {
    return {
      method: "REGISTER",
      data: {
        email: "teste@profitx.com",
        userId: testId,
        registeredAt: now.toISOString(),
        utm: { referralCode: "test-lead-id" },
      },
      attempt: 1,
      timestamp: now.toISOString(),
      webhookId: "profitx-self-test",
    };
  }
  return {
    event: "account_created",
    email: "teste@profitx.com",
    ref: "test-lead-id",
    external_id: testId,
    amount_cents: 100,
    occurred_at: now.toISOString(),
  };
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const profile = await getSessionProfile();
  if (!ehAprovado(profile)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: endpoint } = await admin
    .from("tracking_webhook_endpoints")
    .select("id, kind, platform, endpoint_slug, encrypted_secret, active")
    .eq("id", params.id)
    .maybeSingle();

  if (!endpoint) {
    return NextResponse.json({ error: "Endpoint não encontrado." }, { status: 404 });
  }
  if (!endpoint.active) {
    return NextResponse.json({ error: "Endpoint está desativado — ative antes de testar." }, { status: 400 });
  }

  let token: string;
  try {
    token = decryptSecret(endpoint.encrypted_secret);
  } catch {
    return NextResponse.json({ error: "Falha ao ler o token do endpoint." }, { status: 500 });
  }

  const targetUrl = `${origemPraChamarAMimMesmo(request)}/api/tracking/webhooks/${KIND_PATH[endpoint.kind]}/${endpoint.endpoint_slug}`;
  const payload = buildTestPayload(endpoint.kind, endpoint.platform);

  let ok = false;
  let detail: string | null = null;
  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-profitx-test": "1",
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    ok = res.ok && json?.ok === true && json?.tested === true;
    if (!ok) {
      detail = json?.ignored
        ? "O endpoint respondeu, mas não reconheceu o payload de teste no formato esperado — confira a plataforma selecionada."
        : (json?.error ?? `Resposta inesperada do endpoint (status ${res.status}).`);
    }
  } catch (err) {
    detail = err instanceof Error ? err.message : "Falha ao chamar o endpoint.";
  }

  await admin
    .from("tracking_webhook_endpoints")
    .update({ last_test_at: new Date().toISOString(), last_test_ok: ok })
    .eq("id", params.id);

  return NextResponse.json(ok ? { ok: true } : { ok: false, error: detail });
}

/**
 * O endereco que o servidor usa pra chamar a PROPRIA rota de webhook.
 *
 * Atras do nginx da VPS, request.url vira "https://localhost:3400/..." — o
 * host e o interno (o nginx repassa Host: localhost:3400) mas o protocolo vem
 * do x-forwarded-proto, que e https. Essa combinacao nao existe: o Next
 * escuta HTTP puro naquela porta, entao o fetch morria no handshake TLS e o
 * botao "Testar" reportava falha de um endpoint que estava perfeito.
 *
 * Usar x-forwarded-host pra montar o endereco publico resolveria o protocolo,
 * mas seria pior: o header e controlado por quem chama, e este fetch leva o
 * token do endpoint no Authorization — daria pra fazer a Engine entregar o
 * token decifrado num servidor de fora. Corrigir so o protocolo do loopback
 * mantem a chamada dentro da maquina.
 */
function origemPraChamarAMimMesmo(request: Request): string {
  const url = new URL(request.url);
  const ehLoopback = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  return ehLoopback ? `http://${url.host}` : url.origin;
}
