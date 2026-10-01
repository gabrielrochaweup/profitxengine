"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { Bloco, Cartao, Interruptor, Ponto, Tabela, TabelaWrap, Td, Th, Tr, Vazio } from "./ui";
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

  if (loading) return <Cartao className="text-sm text-text-secondary">Carregando…</Cartao>;

  return (
    <div className="space-y-6">
      {/* Cada funil é um bloco: título, as quatro linhas de plano e nada
          mais. As URLs são longas, então ficam em fonte de largura fixa e
          altura de input compacta — elas não são o conteúdo da tela, são o
          campo de um formulário. */}
      {SENDPULSE_TIPOS.map((t) => (
        <Bloco key={t.tipo} titulo={t.titulo}>
          <p className="-mt-1 mb-3 max-w-[80ch] text-[11px] text-text-tertiary">{t.descricao}</p>
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-app">
            {SENDPULSE_ALVOS.map((alvo) => {
              const key = sendpulseKey(t.tipo as SendPulseTipo, alvo);
              const row = rowFor(key);
              return (
                <div key={key} className="flex flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:gap-3">
                  <label className="w-24 shrink-0 text-[11px] font-medium text-text-secondary">
                    {ALVO_LABEL[alvo]}
                  </label>
                  <Input
                    value={row.url}
                    onChange={(e) => update(key, { url: e.target.value })}
                    placeholder="https://events.sendpulse.com/events/id/..."
                    className="h-8 flex-1 font-mono text-[11px]"
                  />
                  <Interruptor
                    checked={row.enabled}
                    onChange={() => update(key, { enabled: !row.enabled })}
                    label={`${t.titulo} — ${ALVO_LABEL[alvo]}`}
                  />
                </div>
              );
            })}
          </div>
        </Bloco>
      ))}

      <Cartao>
        <p className="max-w-[90ch] text-xs leading-relaxed text-text-secondary">
          Cole aqui o <strong>POST URL</strong> de cada evento do SendPulse (Automation360 → Gerenciador de eventos).
          O endereço já é a credencial do disparo — quem tem a URL dispara — então trate como senha. Enviamos{" "}
          <strong>phone</strong>, <strong>email</strong>, <strong>nome</strong>, <strong>plano</strong> e{" "}
          <strong>evento</strong>; no SendPulse, use <strong>phone</strong> pra achar o contato do WhatsApp (vai em
          formato internacional, +55…).
        </p>
        <p className="mt-2 max-w-[90ch] text-xs leading-relaxed text-text-secondary">
          Desligar a linha de um plano silencia aquele plano de propósito — ela <strong>não</strong> cai no endereço
          geral, senão a pessoa receberia a mensagem errada.
        </p>
        <div className="mt-3">
          <Button onClick={save} disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </Cartao>

      <Bloco titulo="Testar">
        <p className="-mt-1 mb-3 max-w-[90ch] text-[11px] leading-relaxed text-text-tertiary">
          Dispara de verdade no SendPulse e inicia o fluxo — serve pra conferir a ligação sem comprar o curso de
          novo. Ignora as travas de propósito: dá pra repetir à vontade, e testar com o e-mail de um aluno real não
          queima a mensagem de verdade dele. Fica marcado como teste no histórico e fora dos contadores.
        </p>
        <Cartao>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
            <div className="sm:col-span-3">
              <label className="mb-1.5 block text-[11px] font-medium text-text-secondary">Funil</label>
              <Select
                value={testeTipo}
                onChange={(e) => setTesteTipo(e.target.value as "boas_vindas" | "contrato")}
                className="h-8 text-xs"
              >
                <option value="boas_vindas">Boas-vindas</option>
                <option value="contrato">Pós-contrato</option>
              </Select>
            </div>
            <div className="sm:col-span-3">
              <label className="mb-1.5 block text-[11px] font-medium text-text-secondary">Plano</label>
              <Select value={testePlano} onChange={(e) => setTestePlano(e.target.value)} className="h-8 text-xs">
                <option value="">Descobrir pela compra do e-mail</option>
                {PLANOS_TESTE.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-6">
              <label className="mb-1.5 block text-[11px] font-medium text-text-secondary">E-mail</label>
              <Input
                value={testeEmail}
                onChange={(e) => setTesteEmail(e.target.value)}
                placeholder="aluno@email.com"
                className="h-8 text-xs"
              />
            </div>
            <div className="sm:col-span-6">
              <label className="mb-1.5 block text-[11px] font-medium text-text-secondary">
                Telefone <span className="font-normal text-text-tertiary">(vazio = usa o do aluno)</span>
              </label>
              <Input
                value={testeTelefone}
                onChange={(e) => setTesteTelefone(e.target.value)}
                placeholder="(47) 99999-9999"
                className="h-8 text-xs"
              />
            </div>
            <div className="sm:col-span-6">
              <label className="mb-1.5 block text-[11px] font-medium text-text-secondary">
                Nome <span className="font-normal text-text-tertiary">(opcional)</span>
              </label>
              <Input
                value={testeNome}
                onChange={(e) => setTesteNome(e.target.value)}
                placeholder="Nome do aluno"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="mt-4">
            <Button onClick={dispararTeste} disabled={testando}>
              {testando ? "Disparando…" : "Disparar agora"}
            </Button>
          </div>
        </Cartao>
      </Bloco>

      <Bloco
        titulo="Disparos"
        acoes={
          <div className="flex items-center gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1.5">
              <Ponto tom="ok" />
              <span className="text-text-tertiary">
                <span className="font-semibold tabular-nums text-text-primary">{enviados}</span> enviados
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Ponto tom={falhas > 0 ? "erro" : "neutro"} />
              <span className="text-text-tertiary">
                <span className="font-semibold tabular-nums text-text-primary">{falhas}</span> falharam
              </span>
            </span>
          </div>
        }
      >
        <Cartao>
          {log.length === 0 ? (
            <Vazio>Nenhum disparo ainda.</Vazio>
          ) : (
            <TabelaWrap>
              <Tabela>
                <thead>
                  <tr className="border-b border-border">
                    <Th>Quando</Th>
                    <Th>Funil</Th>
                    <Th>Aluno</Th>
                    <Th>Telefone</Th>
                    <Th>Plano</Th>
                    <Th>Situação</Th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((l) => (
                    <Tr key={l.id}>
                      <Td fraco className="font-mono text-[11px]">
                        {new Date(l.created_at).toLocaleString("pt-BR")}
                      </Td>
                      <Td forte>
                        {l.tipo === "boas_vindas" ? "Boas-vindas" : "Pós-contrato"}
                        {l.teste && (
                          <span className="ml-1.5 rounded-button bg-card-hover px-1.5 py-0.5 text-[10px] font-normal text-text-tertiary">
                            teste
                          </span>
                        )}
                      </Td>
                      <Td className="max-w-[220px] truncate" title={l.email}>
                        {l.email}
                      </Td>
                      <Td className="font-mono text-[11px]">{l.phone || "—"}</Td>
                      <Td>
                        {l.plano || "—"}
                        {l.destino === "geral" && (
                          <span className="ml-1.5 rounded-button bg-warning-soft px-1.5 py-0.5 text-[10px] text-warning">
                            geral
                          </span>
                        )}
                      </Td>
                      <Td>
                        <span className="inline-flex items-center gap-1.5">
                          <Ponto
                            tom={l.status === "enviado" ? "ok" : l.status === "falhou" ? "erro" : "neutro"}
                          />
                          <span className={l.status === "falhou" ? "text-danger" : "text-text-tertiary"}>
                            {l.status}
                          </span>
                        </span>
                        {l.erro && <div className="mt-0.5 text-[11px] text-danger">{l.erro}</div>}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Tabela>
            </TabelaWrap>
          )}
        </Cartao>
      </Bloco>
    </div>
  );
}
