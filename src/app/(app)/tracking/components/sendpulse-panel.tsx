"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  SENDPULSE_TIPOS,
  SENDPULSE_ALVOS,
  ALVO_LABEL,
  sendpulseKey,
  type SendPulseTipo,
} from "@/lib/sendpulse/config-keys";

// Os planos que o teste oferece. Reaproveita os alvos da configuração, tirando
// o "geral" — ele é reserva de endereço, não um plano que o aluno tem.
const PLANOS_TESTE = SENDPULSE_ALVOS.filter((a) => a !== "geral").map((a) => ({
  value: a,
  label: ALVO_LABEL[a],
}));

interface SettingRow {
  key: string;
  url: string;
  enabled: boolean;
}

interface LogRow {
  id: string;
  tipo: "boas_vindas" | "contrato";
  email: string;
  phone: string;
  plano: string;
  destino: string;
  status: "enviando" | "enviado" | "falhou";
  erro: string;
  teste: boolean;
  created_at: string;
  sent_at: string | null;
}

export function SendPulsePanel({ productId }: { productId: string }) {
  const toast = useToast();
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [log, setLog] = useState<LogRow[]>([]);
  const [enviados, setEnviados] = useState(0);
  const [falhas, setFalhas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [testeTipo, setTesteTipo] = useState<"boas_vindas" | "contrato">("boas_vindas");
  const [testePlano, setTestePlano] = useState("");
  const [testeEmail, setTesteEmail] = useState("");
  const [testeTelefone, setTesteTelefone] = useState("");
  const [testeNome, setTesteNome] = useState("");
  const [testando, setTestando] = useState(false);

  function recarregar() {
    return fetch(`/api/tracking/sendpulse?product_id=${productId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        setLog(data.log ?? []);
        setEnviados(data.enviados ?? 0);
        setFalhas(data.falhas ?? 0);
      });
  }

  async function dispararTeste() {
    if (!testeEmail.trim()) {
      toast.error("Informe o e-mail.");
      return;
    }
    setTestando(true);
    const res = await fetch("/api/tracking/sendpulse/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: productId,
        tipo: testeTipo,
        plano: testePlano,
        email: testeEmail.trim(),
        phone: testeTelefone.trim() || null,
        nome: testeNome.trim() || null,
      }),
    });
    const json = await res.json().catch(() => null);
    setTestando(false);

    if (json?.ok) toast.success("Disparado — confira o fluxo no SendPulse.");
    else toast.error(json?.motivo || json?.error || "Não foi possível disparar.");

    await recarregar();
  }

  useEffect(() => {
    fetch(`/api/tracking/sendpulse?product_id=${productId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        setSettings(data.settings ?? []);
        setLog(data.log ?? []);
        setEnviados(data.enviados ?? 0);
        setFalhas(data.falhas ?? 0);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  function update(key: string, patch: Partial<SettingRow>) {
    setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }

  function rowFor(key: string): SettingRow {
    return settings.find((s) => s.key === key) ?? { key, url: "", enabled: false };
  }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/tracking/sendpulse", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, items: settings }),
    });
    setSaving(false);
    if (res.ok) toast.success("Endereços salvos.");
    else toast.error("Falha ao salvar os endereços.");
  }

  if (loading) return <Card className="p-5 text-sm text-text-secondary">Carregando…</Card>;

  return (
    <div className="space-y-4">
      {SENDPULSE_TIPOS.map((t) => (
        <Card key={t.tipo} className="p-5">
          <h3 className="text-sm font-semibold text-text-primary">{t.titulo}</h3>
          <p className="mt-1 text-xs text-text-secondary">{t.descricao}</p>

          <div className="mt-4 space-y-3">
            {SENDPULSE_ALVOS.map((alvo) => {
              const key = sendpulseKey(t.tipo as SendPulseTipo, alvo);
              const row = rowFor(key);
              return (
                <div key={key} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label className="w-32 shrink-0 text-xs font-medium text-text-muted">{ALVO_LABEL[alvo]}</label>
                  <Input
                    value={row.url}
                    onChange={(e) => update(key, { url: e.target.value })}
                    placeholder="https://events.sendpulse.com/events/id/..."
                    className="flex-1 font-mono text-xs"
                  />
                  <Button
                    variant={row.enabled ? "secondary" : "ghost"}
                    size="sm"
                    className="sm:w-28"
                    onClick={() => update(key, { enabled: !row.enabled })}
                  >
                    {row.enabled ? "Ativo" : "Inativo"}
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      <Card className="p-5">
        <p className="text-xs text-text-secondary">
          Cole aqui o <strong>POST URL</strong> de cada evento do SendPulse (Automation360 → Gerenciador de eventos).
          O endereço já é a credencial do disparo — quem tem a URL dispara — então trate como senha. Enviamos{" "}
          <strong>phone</strong>, <strong>email</strong>, <strong>nome</strong>, <strong>plano</strong> e{" "}
          <strong>evento</strong>; no SendPulse, use <strong>phone</strong> pra achar o contato do WhatsApp (vai em
          formato internacional, +55…).
        </p>
        <p className="mt-2 text-xs text-text-secondary">
          Desligar a linha de um plano silencia aquele plano de propósito — ela <strong>não</strong> cai no endereço
          geral, senão a pessoa receberia a mensagem errada.
        </p>
        <div className="mt-4">
          <Button onClick={save} disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-text-primary">Testar</h3>
        <p className="mt-1 text-xs text-text-secondary">
          Dispara de verdade no SendPulse e inicia o fluxo — serve pra conferir a ligação sem comprar o curso de
          novo. Ignora as travas de propósito: dá pra repetir à vontade, e testar com o e-mail de um aluno real
          não queima a mensagem de verdade dele. Fica marcado como teste no histórico e fora dos contadores.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">Funil</label>
            <Select value={testeTipo} onChange={(e) => setTesteTipo(e.target.value as "boas_vindas" | "contrato")}>
              <option value="boas_vindas">Boas-vindas</option>
              <option value="contrato">Pós-contrato</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">Plano</label>
            <Select value={testePlano} onChange={(e) => setTestePlano(e.target.value)}>
              <option value="">Descobrir pela compra do e-mail</option>
              {PLANOS_TESTE.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">E-mail</label>
            <Input value={testeEmail} onChange={(e) => setTesteEmail(e.target.value)} placeholder="aluno@email.com" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">
              Telefone <span className="text-text-muted/70">(vazio = usa o do aluno)</span>
            </label>
            <Input
              value={testeTelefone}
              onChange={(e) => setTesteTelefone(e.target.value)}
              placeholder="(47) 99999-9999"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-text-muted">
              Nome <span className="text-text-muted/70">(opcional)</span>
            </label>
            <Input value={testeNome} onChange={(e) => setTesteNome(e.target.value)} placeholder="Nome do aluno" />
          </div>
        </div>

        <div className="mt-4">
          <Button onClick={dispararTeste} disabled={testando}>
            {testando ? "Disparando…" : "Disparar agora"}
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Disparos</h3>
          <div className="flex gap-2 text-xs">
            <Badge tone="success">{enviados} enviados</Badge>
            <Badge tone={falhas > 0 ? "danger" : "neutral"}>{falhas} falharam</Badge>
          </div>
        </div>

        {log.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">Nenhum disparo ainda.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-text-muted">
                <tr>
                  <th className="py-2 pr-3 font-medium">Quando</th>
                  <th className="py-2 pr-3 font-medium">Funil</th>
                  <th className="py-2 pr-3 font-medium">Aluno</th>
                  <th className="py-2 pr-3 font-medium">Telefone</th>
                  <th className="py-2 pr-3 font-medium">Plano</th>
                  <th className="py-2 font-medium">Situação</th>
                </tr>
              </thead>
              <tbody className="text-text-secondary">
                {log.map((l) => (
                  <tr key={l.id}>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-2 pr-3">
                      {l.tipo === "boas_vindas" ? "Boas-vindas" : "Pós-contrato"}
                      {l.teste && (
                        <Badge tone="neutral" className="ml-1">
                          teste
                        </Badge>
                      )}
                    </td>
                    <td className="py-2 pr-3">{l.email}</td>
                    <td className="py-2 pr-3 font-mono">{l.phone || "—"}</td>
                    <td className="py-2 pr-3">
                      {l.plano || "—"}
                      {l.destino === "geral" && <Badge tone="warning" className="ml-1">geral</Badge>}
                    </td>
                    <td className="py-2">
                      <Badge
                        tone={l.status === "enviado" ? "success" : l.status === "falhou" ? "danger" : "neutral"}
                      >
                        {l.status}
                      </Badge>
                      {l.erro && <div className="mt-1 text-[11px] text-danger">{l.erro}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
