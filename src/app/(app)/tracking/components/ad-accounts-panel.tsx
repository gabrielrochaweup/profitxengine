"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

export interface AdCredentialStatus {
  platform: "meta" | "google";
  ad_account_id: string | null;
  is_valid: boolean;
  last_checked_at: string | null;
  last_synced_at: string | null;
}

export function AdAccountsPanel({
  productId,
  initialCredentials,
}: {
  productId: string;
  initialCredentials: AdCredentialStatus[];
}) {
  const [statuses, setStatuses] = useState<AdCredentialStatus[]>(initialCredentials);

  function upsertStatus(next: AdCredentialStatus) {
    setStatuses((prev) => [...prev.filter((s) => s.platform !== next.platform), next]);
  }

  const metaStatus = statuses.find((s) => s.platform === "meta") ?? null;
  const googleStatus = statuses.find((s) => s.platform === "google") ?? null;

  return (
    <div className="space-y-4">
      <MetaCard productId={productId} status={metaStatus} onSaved={upsertStatus} />
      <GoogleCard productId={productId} status={googleStatus} onSaved={upsertStatus} />
    </div>
  );
}

function StatusBadge({ status }: { status: AdCredentialStatus | null }) {
  if (!status) return <Badge tone="neutral">Não configurada</Badge>;
  if (status.is_valid) return <Badge tone="success">Conectada</Badge>;
  return <Badge tone="danger">Falha na conexão</Badge>;
}

function MetaCard({
  productId,
  status,
  onSaved,
}: {
  productId: string;
  status: AdCredentialStatus | null;
  onSaved: (s: AdCredentialStatus) => void;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(!status);
  const [accessToken, setAccessToken] = useState("");
  const [adAccountId, setAdAccountId] = useState(status?.ad_account_id ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/ads/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: productId,
        platform: "meta",
        meta: { access_token: accessToken, ad_account_id: adAccountId },
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(json.error ?? "Falha ao salvar.");
      return;
    }
    if (json.valid) {
      toast.success(`Conectado — ${json.label ?? "conta confirmada"}.`);
    } else {
      toast.error(`Salvo, mas a conexão falhou: ${json.error ?? "verifique o token."}`);
    }
    onSaved({
      platform: "meta",
      ad_account_id: adAccountId,
      is_valid: json.valid,
      last_checked_at: new Date().toISOString(),
      last_synced_at: status?.last_synced_at ?? null,
    });
    setAccessToken("");
    setEditing(false);
  }

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">Meta Ads</h3>
        <StatusBadge status={status} />
      </div>

      {!editing ? (
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-secondary">
            Conta <code>{status?.ad_account_id}</code>
            {status?.last_checked_at && (
              <span className="text-text-muted"> · testado em {new Date(status.last_checked_at).toLocaleString("pt-BR")}</span>
            )}
          </p>
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
            Alterar
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">Access token (System User)</label>
            <Input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="EAAG..."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">ID da conta de anúncio</label>
            <Input value={adAccountId} onChange={(e) => setAdAccountId(e.target.value)} placeholder="act_1234567890" />
          </div>
          <div className="flex justify-end gap-2">
            {status && (
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            )}
            <Button size="sm" onClick={save} disabled={saving || !accessToken || !adAccountId}>
              {saving ? "Testando e salvando..." : "Salvar e testar"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function GoogleCard({
  productId,
  status,
  onSaved,
}: {
  productId: string;
  status: AdCredentialStatus | null;
  onSaved: (s: AdCredentialStatus) => void;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(!status);
  const [developerToken, setDeveloperToken] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [customerId, setCustomerId] = useState(status?.ad_account_id ?? "");
  const [loginCustomerId, setLoginCustomerId] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = developerToken && clientId && clientSecret && refreshToken && customerId;

  async function save() {
    setSaving(true);
    const res = await fetch("/api/ads/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: productId,
        platform: "google",
        google: {
          developer_token: developerToken,
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          customer_id: customerId,
          login_customer_id: loginCustomerId || undefined,
        },
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(json.error ?? "Falha ao salvar.");
      return;
    }
    if (json.valid) {
      toast.success(`Conectado — ${json.label ?? "conta confirmada"}.`);
    } else {
      toast.error(`Salvo, mas a conexão falhou: ${json.error ?? "verifique as credenciais."}`);
    }
    onSaved({
      platform: "google",
      ad_account_id: customerId,
      is_valid: json.valid,
      last_checked_at: new Date().toISOString(),
      last_synced_at: status?.last_synced_at ?? null,
    });
    setDeveloperToken("");
    setClientId("");
    setClientSecret("");
    setRefreshToken("");
    setEditing(false);
  }

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">Google Ads</h3>
        <StatusBadge status={status} />
      </div>

      {!editing ? (
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-secondary">
            Conta <code>{status?.ad_account_id}</code>
            {status?.last_checked_at && (
              <span className="text-text-muted"> · testado em {new Date(status.last_checked_at).toLocaleString("pt-BR")}</span>
            )}
          </p>
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
            Alterar
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-text-muted">Developer token</label>
            <Input type="password" value={developerToken} onChange={(e) => setDeveloperToken(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">OAuth Client ID</label>
            <Input value={clientId} onChange={(e) => setClientId(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">OAuth Client Secret</label>
            <Input type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-text-muted">Refresh token</label>
            <Input type="password" value={refreshToken} onChange={(e) => setRefreshToken(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">Customer ID (conta)</label>
            <Input value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="123-456-7890" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">
              Login Customer ID <span className="text-text-muted/70">(se usar conta gerenciadora — opcional)</span>
            </label>
            <Input value={loginCustomerId} onChange={(e) => setLoginCustomerId(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            {status && (
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            )}
            <Button size="sm" onClick={save} disabled={saving || !canSave}>
              {saving ? "Testando e salvando..." : "Salvar e testar"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
