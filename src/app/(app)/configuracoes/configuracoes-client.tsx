"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";

type Provider = "openai" | "anthropic" | "google";
type ImageProvider = "openai" | "google";
type Module = "conversa" | "mensagem" | "imagem" | "email" | "blog";

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

const PROVIDER_LABEL: Record<Provider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic (Claude)",
  google: "Google (Gemini)",
};

const MODULE_LABEL: Record<Module, string> = {
  conversa: "Texto de conversas",
  mensagem: "Texto de mensagens do grupo",
  imagem: "Geração de imagem",
  email: "Texto de e-mails",
  blog: "Texto de posts do blog",
};

// Módulos de texto aceitam os 3 provedores; imagem só os que geram imagem (Anthropic não gera).
const MODULE_PROVIDERS: Record<Module, Provider[]> = {
  conversa: ["openai", "anthropic", "google"],
  mensagem: ["openai", "anthropic", "google"],
  email: ["openai", "anthropic", "google"],
  blog: ["openai", "anthropic", "google"],
  imagem: ["openai", "google"],
};

const TEXT_MODELS: Record<Provider, { id: string; label: string }[]> = {
  openai: [
    { id: "gpt-5.6-sol", label: "GPT-5.6 Sol (mais avançado)" },
    { id: "gpt-5.6-terra", label: "GPT-5.6 Terra" },
    { id: "gpt-5.6-luna", label: "GPT-5.6 Luna (rápido/econômico)" },
    { id: "gpt-4o", label: "GPT-4o" },
    { id: "gpt-4o-mini", label: "GPT-4o mini" },
  ],
  anthropic: [
    { id: "claude-opus-4-8", label: "Claude Opus 4.8 (mais avançado)" },
    { id: "claude-sonnet-5", label: "Claude Sonnet 5" },
    { id: "claude-fable-5", label: "Claude Fable 5" },
    { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (rápido/econômico)" },
  ],
  google: [
    { id: "gemini-3.1-pro", label: "Gemini 3.1 Pro (mais avançado)" },
    { id: "gemini-3-flash", label: "Gemini 3 Flash" },
    { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash" },
    { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite (rápido/econômico)" },
  ],
};

const IMAGE_MODELS: Record<ImageProvider, { id: string; label: string }[]> = {
  openai: [
    { id: "gpt-image-2", label: "GPT Image 2 (mais novo)" },
    { id: "gpt-image-1.5", label: "GPT Image 1.5" },
    { id: "gpt-image-1", label: "GPT Image 1" },
    { id: "dall-e-3", label: "DALL·E 3" },
  ],
  google: [
    { id: "gemini-3-pro-image", label: "Nano Banana Pro (Gemini 3 Pro Image)" },
    { id: "gemini-3.1-flash-image", label: "Nano Banana 2 (Gemini 3.1 Flash Image)" },
    { id: "gemini-3.1-flash-lite-image", label: "Nano Banana 2 Lite" },
    { id: "gemini-2.5-flash-image", label: "Nano Banana (legado)" },
  ],
};

const DEFAULT_TEXT_MODEL: Record<Provider, string> = {
  openai: TEXT_MODELS.openai[4].id,
  anthropic: TEXT_MODELS.anthropic[3].id,
  google: TEXT_MODELS.google[3].id,
};

const DEFAULT_IMAGE_MODEL: Record<ImageProvider, string> = {
  openai: IMAGE_MODELS.openai[2].id,
  google: IMAGE_MODELS.google[1].id,
};

export function ConfiguracoesClient({ isAdmin }: { isAdmin: boolean }) {
  const [credentials, setCredentials] = useState<CredentialStatus[] | null>(null);
  const [settings, setSettings] = useState<ProviderSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [settingsRes, credRes] = await Promise.all([
        fetch("/api/ai/provider-settings"),
        isAdmin ? fetch("/api/ai/credentials") : Promise.resolve(null),
      ]);

      if (settingsRes.ok) {
        const body = await settingsRes.json();
        setSettings(body.settings ?? []);
      }

      if (credRes?.ok) {
        const body = await credRes.json();
        setCredentials(body.credentials ?? []);
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
        model: module === "imagem" ? DEFAULT_IMAGE_MODEL.openai : DEFAULT_TEXT_MODEL.openai,
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
      <Card className="mt-6">
        <LoadingState message="Carregando configurações..." />
      </Card>
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

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {(["openai", "anthropic", "google"] as Provider[]).map((provider) => (
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
          Escolha qual IA e qual modelo usar em cada tipo de geração de conteúdo.
        </p>

        <Card className="mt-4 divide-y divide-border">
          {(["conversa", "mensagem", "blog", "email", "imagem"] as Module[]).map((module) => (
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
  const [editing, setEditing] = useState(!status);

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
      setEditing(false);
    }
  }

  const badge = status
    ? status.is_valid
      ? { tone: "success" as const, label: "Conectada" }
      : { tone: "danger" as const, label: "Inválida" }
    : { tone: "neutral" as const, label: "Não configurada" };

  const placeholder = provider === "openai" ? "sk-..." : provider === "anthropic" ? "sk-ant-..." : "AIza...";

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">{PROVIDER_LABEL[provider]}</span>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>

      {isAdmin && (
        <div className="mt-4 space-y-3">
          {!editing && status ? (
            <div className="flex items-center justify-between gap-2 rounded-input bg-input px-3 py-2.5">
              <span className="text-sm text-text-secondary">•••••••••••••••• (chave registrada)</span>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="shrink-0 text-xs font-medium text-accent-text hover:underline"
              >
                Alterar
              </button>
            </div>
          ) : (
            <>
              <Input
                type="password"
                placeholder={placeholder}
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
                {status && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(false);
                      setApiKey("");
                      setTestResult(null);
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </>
          )}
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

  const isImage = module === "imagem";
  const allowedProviders = MODULE_PROVIDERS[module];
  const modelOptions = isImage ? IMAGE_MODELS[provider as ImageProvider] : TEXT_MODELS[provider];
  const hasCustomModel = !modelOptions.some((m) => m.id === model);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const ok = await onSave(module, provider, model);
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
        {isImage && <p className="text-xs text-text-muted">Geração de imagem suporta OpenAI e Google.</p>}
      </div>

      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
        <Select
          value={provider}
          disabled={!isAdmin}
          onChange={(e) => {
            const next = e.target.value as Provider;
            setProvider(next);
            setModel(isImage ? DEFAULT_IMAGE_MODEL[next as ImageProvider] : DEFAULT_TEXT_MODEL[next]);
          }}
          className="min-w-0 flex-1 sm:w-40 sm:flex-none"
        >
          {allowedProviders.map((p) => (
            <option key={p} value={p}>
              {PROVIDER_LABEL[p]}
            </option>
          ))}
        </Select>
        <Select
          value={model}
          disabled={!isAdmin}
          onChange={(e) => setModel(e.target.value)}
          className="min-w-0 flex-1 sm:w-56 sm:flex-none"
        >
          {hasCustomModel && <option value={model}>{model} (atual)</option>}
          {modelOptions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </Select>
        {isAdmin && (
          <Button type="button" size="sm" variant="secondary" disabled={saving} onClick={handleSave}>
            {saving ? "..." : saved ? "Salvo" : "Salvar"}
          </Button>
        )}
      </div>
    </div>
  );
}
