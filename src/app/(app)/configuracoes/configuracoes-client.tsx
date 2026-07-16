"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type Provider = "openai" | "anthropic";
type Module = "conversa" | "mensagem" | "imagem" | "email";

interface CredentialStatus {
  provider: Provider;
  is_valid: boolean;
  last_validated_at: string | null;
}

interface ProviderSetting {
  module: Module;
  provider: Provider;
  model: string;
}

const PROVIDER_LABEL: Record<Provider, string> = { openai: "OpenAI", anthropic: "Anthropic (Claude)" };
const MODULE_LABEL: Record<Module, string> = {
  conversa: "Texto de conversas",
  mensagem: "Texto de mensagens do grupo",
  imagem: "Geração de imagem",
  email: "Texto de e-mails",
};
const DEFAULT_MODEL: Record<Provider, string> = { openai: "gpt-4o-mini", anthropic: "claude-sonnet-4-5" };

export function ConfiguracoesClient({ isAdmin }: { isAdmin: boolean }) {
  const [credentials, setCredentials] = useState<CredentialStatus[] | null>(null);
  const [settings, setSettings] = useState<ProviderSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const settingsRes = await fetch("/api/ai/provider-settings");
      if (settingsRes.ok) {
        const body = await settingsRes.json();
        setSettings(body.settings ?? []);
      }

      if (isAdmin) {
        const credRes = await fetch("/api/ai/credentials");
        if (credRes.ok) {
          const body = await credRes.json();
          setCredentials(body.credentials ?? []);
        }
      }
      setLoading(false);
    }
    load();
  }, [isAdmin]);

  function statusFor(provider: Provider): CredentialStatus | undefined {
    return credentials?.find((c) => c.provider === provider);
  }

  function settingFor(module: Module): ProviderSetting {
    return (
      settings.find((s) => s.module === module) ?? {
        module,
        provider: "openai",
        model: DEFAULT_MODEL.openai,
      }
    );
  }

  async function handleSaveSetting(module: Module, provider: Provider, model: string) {
    const res = await fetch("/api/ai/provider-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module, provider, model }),
    });
    if (res.ok) {
      setSettings((prev) => {
        const next = prev.filter((s) => s.module !== module);
        return [...next, { module, provider, model }];
      });
    }
    return res.ok;
  }

  if (loading) {
    return (
      <Card className="mt-6 px-6 py-10 text-center text-sm text-text-muted">Carregando configurações...</Card>
    );
  }

  return (
    <div className="mt-6 space-y-8">
      <section>
        <h2 className="text-base font-medium text-text-primary">Chaves de API</h2>
        <p className="mt-1 text-sm text-text-muted">
          {isAdmin
            ? "Armazenadas de forma criptografada. Nunca expostas no navegador."
            : "Apenas administradores podem cadastrar ou alterar chaves de API."}
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {(["openai", "anthropic"] as Provider[]).map((provider) => (
            <CredentialCard
              key={provider}
              provider={provider}
              isAdmin={isAdmin}
              status={statusFor(provider)}
              onSaved={(status) =>
                setCredentials((prev) => {
                  const rest = (prev ?? []).filter((c) => c.provider !== provider);
                  return [...rest, status];
                })
              }
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-base font-medium text-text-primary">Provedor por tipo de tarefa</h2>
        <p className="mt-1 text-sm text-text-muted">
          Escolha qual IA usar em cada tipo de geração de conteúdo.
        </p>

        <Card className="mt-4 divide-y divide-border">
          {(["conversa", "mensagem", "imagem", "email"] as Module[]).map((module) => (
            <ModuleSettingRow
              key={module}
              module={module}
              isAdmin={isAdmin}
              initial={settingFor(module)}
              onSave={handleSaveSetting}
            />
          ))}
        </Card>
      </section>
    </div>
  );
}

function CredentialCard({
  provider,
  isAdmin,
  status,
  onSaved,
}: {
  provider: Provider;
  isAdmin: boolean;
  status?: CredentialStatus;
  onSaved: (status: CredentialStatus) => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; error?: string } | null>(null);

  async function handleTest() {
    if (!apiKey) return;
    setTesting(true);
    setTestResult(null);
    const res = await fetch("/api/ai/validate-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey }),
    });
    const body = await res.json();
    setTestResult(body);
    setTesting(false);
  }

  async function handleSave() {
    if (!apiKey) return;
    setSaving(true);
    const res = await fetch("/api/ai/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey }),
    });
    const body = await res.json();
    setSaving(false);
    if (res.ok) {
      onSaved({ provider, is_valid: body.is_valid, last_validated_at: new Date().toISOString() });
      setApiKey("");
      setTestResult(null);
    }
  }

  const badge = status
    ? status.is_valid
      ? { tone: "success" as const, label: "Conectada" }
      : { tone: "danger" as const, label: "Inválida" }
    : { tone: "neutral" as const, label: "Não configurada" };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">{PROVIDER_LABEL[provider]}</span>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>

      {isAdmin && (
        <div className="mt-4 space-y-3">
          <Input
            type="password"
            placeholder={provider === "openai" ? "sk-..." : "sk-ant-..."}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />

          {testResult && (
            <p className={`text-xs ${testResult.valid ? "text-success" : "text-danger"}`}>
              {testResult.valid ? "Conexão válida." : testResult.error || "Chave inválida."}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!apiKey || testing}
              onClick={handleTest}
            >
              {testing ? "Testando..." : "Testar conexão"}
            </Button>
            <Button type="button" size="sm" disabled={!apiKey || saving} onClick={handleSave}>
              {saving ? "Salvando..." : "Salvar chave"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function ModuleSettingRow({
  module,
  isAdmin,
  initial,
  onSave,
}: {
  module: Module;
  isAdmin: boolean;
  initial: ProviderSetting;
  onSave: (module: Module, provider: Provider, model: string) => Promise<boolean>;
}) {
  const [provider, setProvider] = useState<Provider>(initial.provider);
  const [model, setModel] = useState(initial.model);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const imageLocked = module === "imagem";

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const ok = await onSave(module, imageLocked ? "openai" : provider, model);
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-text-primary">{MODULE_LABEL[module]}</p>
        {imageLocked && <p className="text-xs text-text-muted">Geração de imagem só suporta OpenAI.</p>}
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={imageLocked ? "openai" : provider}
          disabled={!isAdmin || imageLocked}
          onChange={(e) => {
            const next = e.target.value as Provider;
            setProvider(next);
            setModel(DEFAULT_MODEL[next]);
          }}
          className="w-40"
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
        </Select>
        <Input
          value={model}
          disabled={!isAdmin}
          onChange={(e) => setModel(e.target.value)}
          className="w-44"
        />
        {isAdmin && (
          <Button type="button" size="sm" variant="secondary" disabled={saving} onClick={handleSave}>
            {saving ? "..." : saved ? "Salvo" : "Salvar"}
          </Button>
        )}
      </div>
    </div>
  );
}
