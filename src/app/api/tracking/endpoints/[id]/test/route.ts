import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/crypto";

const KIND_PATH: Record<string, string> = {
  checkout: "checkout",
  members_area: "members-area",
  broker: "broker",
  contract: "contract-signed",
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
  if (!profile || !hasRole(profile.role, "admin")) {
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

  const origin = new URL(request.url).origin;
  const targetUrl = `${origin}/api/tracking/webhooks/${KIND_PATH[endpoint.kind]}/${endpoint.endpoint_slug}`;
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
