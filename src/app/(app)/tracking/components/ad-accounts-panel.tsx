"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Pencil, KeyRound, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Bloco, Cartao, ItemMenu, MenuMais, Ponto, Vazio } from "./ui";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import { STATUS_BM, STATUS_BM_LABEL, type StatusBm } from "@/lib/tracking/bms";

const TOM_STATUS: Record<StatusBm, "ok" | "neutro" | "alerta" | "erro"> = {
  ativa: "ok",
  pronta: "neutro",
  restrita: "alerta",
  bloqueada: "erro",
};

export interface AdAccount {
  id: string;
  platform: "meta" | "google";
  label: string | null;
  ad_account_id: string | null;
  is_valid: boolean;
  /**
   * Marcação manual de quem administra as contas — mesmos estados da BM.
   * Diferente de is_valid: aquele diz se o token responde, e conta restrita
   * costuma responder normalmente enquanto se recusa a entregar anúncio.
   */
  status: StatusBm;
  last_checked_at: string | null;
  last_synced_at: string | null;
}

interface MetaFieldsValue {
  access_token: string;
  ad_account_id: string;
}

interface GoogleFieldsValue {
  developer_token: string;
  client_id: string;
  client_secret: string;
  refresh_token: string;
  customer_id: string;
  login_customer_id: string;
}

const EMPTY_META: MetaFieldsValue = { access_token: "", ad_account_id: "" };
const EMPTY_GOOGLE: GoogleFieldsValue = {
  developer_token: "",
  client_id: "",
  client_secret: "",
  refresh_token: "",
  customer_id: "",
  login_customer_id: "",
};

export function AdAccountsPanel({
  productId,
  platform,
  accounts,
  setAccounts,
}: {
  productId: string;
  /** A aba já é por plataforma; o painel mostra só o lado que ela abriu. */
  platform: "meta" | "google";
  accounts: AdAccount[];
  setAccounts: Dispatch<SetStateAction<AdAccount[]>>;
}) {
  function upsert(account: AdAccount) {
    setAccounts((prev) => {
      const exists = prev.some((a) => a.id === account.id);
      return exists ? prev.map((a) => (a.id === account.id ? account : a)) : [...prev, account];
    });
  }

  function remove(id: string) {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <PlatformSection
      platform={platform}
      title={platform === "meta" ? "Contas Meta Ads" : "Contas Google Ads"}
      productId={productId}
      accounts={accounts.filter((a) => a.platform === platform)}
      onUpsert={upsert}
      onRemove={remove}
    />
  );
}

function PlatformSection({
  platform,
  title,
  productId,
  accounts,
  onUpsert,
  onRemove,
}: {
  platform: "meta" | "google";
  title: string;
  productId: string;
  accounts: AdAccount[];
  onUpsert: (a: AdAccount) => void;
  onRemove: (id: string) => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <Bloco
      titulo={title}
      acoes={
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          Adicionar conta
        </Button>
      }
    >
      {accounts.length === 0 ? (
        <Cartao>
          <Vazio>Nenhuma conta conectada ainda.</Vazio>
        </Cartao>
      ) : (
        <div className="divide-y divide-border rounded-card bg-card shadow-card [&>*:first-child]:rounded-t-card [&>*:last-child]:rounded-b-card">
          {accounts.map((account) => (
            <AccountRow key={account.id} platform={platform} account={account} onUpsert={onUpsert} onRemove={onRemove} />
          ))}
        </div>
      )}

      <CreateAccountModal
        platform={platform}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        productId={productId}
        onCreated={(a) => {
          onUpsert(a);
          setCreateOpen(false);
        }}
      />
    </Bloco>
  );
}

function AccountRow({
  platform,
  account,
  onUpsert,
  onRemove,
}: {
  platform: "meta" | "google";
  account: AdAccount;
  onUpsert: (a: AdAccount) => void;
  onRemove: (id: string) => void;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [renaming, setRenaming] = useState(false);
  const [editingCreds, setEditingCreds] = useState(false);
  const [label, setLabel] = useState(account.label ?? "");
  const [savingLabel, setSavingLabel] = useState(false);
  const [syncing, setSyncing] = useState(false);

  async function syncAccount() {
    setSyncing(true);
    const res = await fetch("/api/ads/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential_id: account.id }),
    });
    const json = await res.json();
    setSyncing(false);
    if (!res.ok) {
      toast.error(json.error ?? "Falha ao sincronizar.");
      return;
    }
    onUpsert({ ...account, last_synced_at: new Date().toISOString() });
    toast.success(
      json.days > 0
        ? `Sincronizado — ${json.days} linha(s), R$ ${(json.totalSpendCents / 100).toLocaleString("pt-BR")} de gasto nos últimos 30 dias.`
        : "Sincronizado — nenhum gasto encontrado nos últimos 30 dias."
    );
  }

  async function saveLabel() {
    setSavingLabel(true);
    const res = await fetch(`/api/ads/credentials/${account.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim() || null }),
    });
    const json = await res.json();
    setSavingLabel(false);
    if (!res.ok) {
      toast.error(json.error ?? "Falha ao renomear.");
      return;
    }
    onUpsert(json.account);
    setRenaming(false);
  }

  // Otimista e sem confirmação: é o gesto mais repetido dessa tela, e
  // desfazer é trocar de volta no mesmo select.
  async function trocarStatus(status: StatusBm) {
    const antes = account.status;
    onUpsert({ ...account, status });
    const res = await fetch(`/api/ads/credentials/${account.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      onUpsert({ ...account, status: antes });
      toast.error("Falha ao mudar o status.");
    }
  }

  async function deleteAccount() {
    const ok = await confirm({
      title: "Excluir conta",
      description: `Excluir "${account.label || account.ad_account_id}"? Isso apaga a credencial salva.`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;

    const res = await fetch(`/api/ads/credentials/${account.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Falha ao excluir.");
      return;
    }
    onRemove(account.id);
    toast.success("Conta removida.");
  }

  return (
    <div className="px-4 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          {renaming ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Nome da conta"
                className="h-8 w-48 text-xs"
              />
              <Button size="sm" onClick={saveLabel} disabled={savingLabel}>
                Salvar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRenaming(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="truncate text-[13px] font-medium text-text-primary">
                {account.label || account.ad_account_id}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px]">
                <Ponto tom={TOM_STATUS[account.status]} />
                <span className="text-text-tertiary">{STATUS_BM_LABEL[account.status]}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px]">
                <Ponto tom={account.is_valid ? "ok" : "erro"} />
                <span className={account.is_valid ? "text-text-tertiary" : "text-danger"}>
                  {account.is_valid ? "Conectada" : "Falha na conexão"}
                </span>
              </span>
            </div>
          )}
          {/* Linha técnica: id, último teste e última sincronização. É o
              terceiro nível — está ali pra quando se procura, não pra
              disputar leitura com o nome da conta. */}
          <p className="mt-0.5 truncate text-[11px] text-text-tertiary">
            <code className="font-mono">{account.ad_account_id}</code>
            {account.last_checked_at && (
              <span> · testado em {new Date(account.last_checked_at).toLocaleString("pt-BR")}</span>
            )}
            {account.last_synced_at ? (
              <span> · gasto sincronizado em {new Date(account.last_synced_at).toLocaleString("pt-BR")}</span>
            ) : (
              <span> · gasto ainda não sincronizado</span>
            )}
          </p>
        </div>

        {!renaming && (
          <div className="flex shrink-0 items-center gap-1.5">
            <Select
              className="h-8 w-40 text-xs"
              value={account.status}
              onChange={(e) => trocarStatus(e.target.value as StatusBm)}
            >
              {STATUS_BM.map((st) => (
                <option key={st} value={st}>
                  {STATUS_BM_LABEL[st]}
                </option>
              ))}
            </Select>
            <Button
              size="sm"
              variant="secondary"
              onClick={syncAccount}
              disabled={syncing || !account.is_valid}
              title={account.is_valid ? undefined : "Conecte a credencial primeiro"}
            >
              {syncing ? "Sincronizando..." : "Sincronizar gasto"}
            </Button>
            <MenuMais>
              {(fechar) => (
                <>
                  <ItemMenu
                    icone={<Pencil size={13} />}
                    onClick={() => {
                      setRenaming(true);
                      fechar();
                    }}
                  >
                    Renomear
                  </ItemMenu>
                  <ItemMenu
                    icone={<KeyRound size={13} />}
                    onClick={() => {
                      setEditingCreds((v) => !v);
                      fechar();
                    }}
                  >
                    Alterar credenciais
                  </ItemMenu>
                  <ItemMenu
                    perigo
                    icone={<Trash2 size={13} />}
                    onClick={() => {
                      deleteAccount();
                      fechar();
                    }}
                  >
                    Excluir
                  </ItemMenu>
                </>
              )}
            </MenuMais>
          </div>
        )}
      </div>

      {editingCreds && (
        <div className="mt-3 border-t border-border pt-3">
          <EditCredentialsForm
            platform={platform}
            accountId={account.id}
            onSaved={(a) => {
              onUpsert(a);
              setEditingCreds(false);
            }}
            onCancel={() => setEditingCreds(false)}
          />
        </div>
      )}
    </div>
  );
}

function EditCredentialsForm({
  platform,
  accountId,
  onSaved,
  onCancel,
}: {
  platform: "meta" | "google";
  accountId: string;
  onSaved: (a: AdAccount) => void;
  onCancel: () => void;
}) {
  const toast = useToast();
  const [meta, setMeta] = useState<MetaFieldsValue>(EMPTY_META);
  const [google, setGoogle] = useState<GoogleFieldsValue>(EMPTY_GOOGLE);
  const [saving, setSaving] = useState(false);

  const canSave =
    platform === "meta"
      ? !!meta.access_token && !!meta.ad_account_id
      : !!google.developer_token && !!google.client_id && !!google.client_secret && !!google.refresh_token && !!google.customer_id;

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/ads/credentials/${accountId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        platform === "meta"
          ? { meta }
          : { google: { ...google, login_customer_id: google.login_customer_id || undefined } }
      ),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(json.error ?? "Falha ao salvar.");
      return;
    }
    if (json.account.is_valid) {
      toast.success(`Conectado — ${json.testLabel ?? "conta confirmada"}.`);
    } else {
      toast.error(`Salvo, mas a conexão falhou: ${json.testError ?? "verifique as credenciais."}`);
    }
    onSaved(json.account);
  }

  return (
    <div className="space-y-3">
      {platform === "meta" ? (
        <MetaFields value={meta} onChange={setMeta} />
      ) : (
        <GoogleFields value={google} onChange={setGoogle} />
      )}
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button size="sm" onClick={save} disabled={saving || !canSave}>
          {saving ? "Testando e salvando..." : "Salvar e testar"}
        </Button>
      </div>
    </div>
  );
}

function MetaFields({ value, onChange }: { value: MetaFieldsValue; onChange: (v: MetaFieldsValue) => void }) {
  return (
    <>
      <div>
        <label className="mb-1 block text-xs font-medium text-text-secondary">Access token (System User)</label>
        <Input
          type="password"
          value={value.access_token}
          onChange={(e) => onChange({ ...value, access_token: e.target.value })}
          placeholder="EAAG..."
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-text-secondary">ID da conta de anúncio</label>
        <Input
          value={value.ad_account_id}
          onChange={(e) => onChange({ ...value, ad_account_id: e.target.value })}
          placeholder="act_1234567890"
        />
      </div>
    </>
  );
}

function GoogleFields({ value, onChange }: { value: GoogleFieldsValue; onChange: (v: GoogleFieldsValue) => void }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-medium text-text-secondary">Developer token</label>
        <Input type="password" value={value.developer_token} onChange={(e) => onChange({ ...value, developer_token: e.target.value })} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-text-secondary">OAuth Client ID</label>
        <Input value={value.client_id} onChange={(e) => onChange({ ...value, client_id: e.target.value })} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-text-secondary">OAuth Client Secret</label>
        <Input type="password" value={value.client_secret} onChange={(e) => onChange({ ...value, client_secret: e.target.value })} />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-medium text-text-secondary">Refresh token</label>
        <Input type="password" value={value.refresh_token} onChange={(e) => onChange({ ...value, refresh_token: e.target.value })} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-text-secondary">Customer ID (conta)</label>
        <Input value={value.customer_id} onChange={(e) => onChange({ ...value, customer_id: e.target.value })} placeholder="123-456-7890" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-text-secondary">
          Login Customer ID <span className="text-text-muted/70">(conta gerenciadora — opcional)</span>
        </label>
        <Input value={value.login_customer_id} onChange={(e) => onChange({ ...value, login_customer_id: e.target.value })} />
      </div>
    </div>
  );
}

function CreateAccountModal({
  platform,
  open,
  onClose,
  productId,
  onCreated,
}: {
  platform: "meta" | "google";
  open: boolean;
  onClose: () => void;
  productId: string;
  onCreated: (a: AdAccount) => void;
}) {
  const toast = useToast();
  const [label, setLabel] = useState("");
  const [meta, setMeta] = useState<MetaFieldsValue>(EMPTY_META);
  const [google, setGoogle] = useState<GoogleFieldsValue>(EMPTY_GOOGLE);
  const [saving, setSaving] = useState(false);

  const canSave =
    platform === "meta"
      ? !!meta.access_token && !!meta.ad_account_id
      : !!google.developer_token && !!google.client_id && !!google.client_secret && !!google.refresh_token && !!google.customer_id;

  function reset() {
    setLabel("");
    setMeta(EMPTY_META);
    setGoogle(EMPTY_GOOGLE);
  }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/ads/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: productId,
        platform,
        label: label.trim() || null,
        ...(platform === "meta"
          ? { meta }
          : { google: { ...google, login_customer_id: google.login_customer_id || undefined } }),
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(json.error ?? "Falha ao salvar.");
      return;
    }
    if (json.account.is_valid) {
      toast.success(`Conectado — ${json.testLabel ?? "conta confirmada"}.`);
    } else {
      toast.error(`Salvo, mas a conexão falhou: ${json.testError ?? "verifique as credenciais."}`);
    }
    onCreated(json.account);
    reset();
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={`Adicionar conta ${platform === "meta" ? "Meta Ads" : "Google Ads"}`}
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            Nome da conta <span className="text-text-muted/70">(opcional, só pra identificar aqui)</span>
          </label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Conta principal" />
        </div>

        {platform === "meta" ? <MetaFields value={meta} onChange={setMeta} /> : <GoogleFields value={google} onChange={setGoogle} />}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving || !canSave}>
            {saving ? "Testando e salvando..." : "Salvar e testar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
