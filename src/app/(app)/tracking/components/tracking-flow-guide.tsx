"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WebhookEndpoint } from "./webhook-endpoints-panel";

type StepKind = "landing" | "checkout" | "members_area" | "broker";

interface Step {
  number: number;
  kind: StepKind;
  title: string;
  repeatable: boolean;
  description: string;
  contract?: string;
}

const STEPS: Step[] = [
  {
    number: 1,
    kind: "landing",
    title: "Landing / qualquer site",
    repeatable: true,
    description:
      'O script (aba UTMs, "Script de rastreamento") gera um lead_id único no navegador de quem clicou no anúncio e guarda em cookie + localStorage. Esse lead_id é o fio que conecta todo o resto. Cole o mesmo script em quantas páginas de vendas você quiser — ele já funciona sozinho em qualquer uma.',
  },
  {
    number: 2,
    kind: "checkout",
    title: "Checkout do curso",
    repeatable: true,
    description:
      'Se o botão de comprar usar window.ProfitXTracking.appendRef(url) (com "ref" ou o parâmetro que a plataforma exigir — algumas, como a Onprofit, só devolvem "sck") no link de checkout, a plataforma pode devolver esse valor no webhook de compra aprovada. Use o "Gerador de link" logo abaixo pra montar esse link sem digitar nada na mão. Cada plataforma/página de vendas nova é um endpoint de Checkout novo — pode criar quantos precisar.',
    contract:
      '{ "event": "purchase", "email": "...", "ref": "<lead_id ou null>", "external_id": "...", "amount_cents": 49700, "occurred_at": "..." }',
  },
  {
    number: 3,
    kind: "members_area",
    title: "Área de membros",
    repeatable: true,
    description:
      '(a) Disparar um webhook pra gente no primeiro acesso do aluno. (b) — o passo mais importante — o botão "Abrir minha conta na corretora" dentro da área de membros precisa levar esse mesmo identificador adiante, como ?ref=<lead_id>&email=<email_do_aluno> na URL de cadastro da corretora. Se a área de membros não souber o ref (porque o checkout não propagou), ainda dá pra passar só o e-mail. Assim como o checkout, cada área de membros diferente (por curso, por plataforma) é um endpoint próprio.',
    contract:
      '{ "event": "first_login", "email": "...", "ref": "<lead_id ou null>", "external_id": "<id do aluno>", "occurred_at": "..." }',
  },
  {
    number: 4,
    kind: "broker",
    title: "Corretora",
    repeatable: false,
    description:
      "Ao abrir a conta, a corretora lê o ref/email que veio na URL de cadastro e devolve isso no webhook — é aqui que a gente sabe que ESSE lead específico virou conta na corretora. O mesmo webhook, disparado de novo no primeiro depósito, é o que fecha o funil. Diferente do checkout e da área de membros, a corretora é sempre a mesma — só existe UM endpoint dela, compartilhado por todas as páginas de venda.",
    contract:
      '{ "event": "account_created" | "deposit", "email": "...", "ref": "<lead_id ou null>", "external_id": "...", "amount_cents": 45000, "occurred_at": "..." }',
  },
];

function statusFor(
  step: Step,
  endpoints: WebhookEndpoint[],
  canSeeEndpoints: boolean
): { done: boolean; label: string; entries: WebhookEndpoint[] } {
  if (step.kind === "landing") return { done: true, label: "Já funciona sozinho", entries: [] };
  if (!canSeeEndpoints) return { done: false, label: "Peça a um admin pra ver o status", entries: [] };
  const entries = endpoints.filter((e) => e.kind === step.kind);
  if (step.kind === "broker") {
    return { done: entries.length > 0, label: entries.length > 0 ? "Configurada" : "Ainda não configurada", entries };
  }
  return {
    done: entries.length > 0,
    label: entries.length === 0 ? "Nenhum endpoint ainda" : `${entries.length} configurado${entries.length > 1 ? "s" : ""}`,
    entries,
  };
}

export function TrackingFlowGuide({ endpoints, isAdmin }: { endpoints: WebhookEndpoint[]; isAdmin: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;
    const firstPending = STEPS.find((s) => !statusFor(s, endpoints, isAdmin).done);
    setOpen(firstPending ? firstPending.number : null);
    setInitialized(true);
    // Só decide a etapa inicial uma vez (não reabre sozinho toda vez que a lista de endpoints muda).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  const doneCount = isAdmin ? STEPS.filter((s) => statusFor(s, endpoints, isAdmin).done).length : null;

  return (
    <Card className="p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-text-primary">Como o lead_id viaja até a corretora</h3>
        {doneCount !== null && (
          <span className="text-[11px] font-medium text-text-muted">
            {doneCount === STEPS.length ? "Tudo configurado ✓" : `${doneCount} de ${STEPS.length} configurados`}
          </span>
        )}
      </div>
      <p className="mb-3 text-xs text-text-secondary">
        Passo a passo guiado — clique numa etapa pra ver o que fazer. Checkout e Área de membros são repetíveis: cada
        página de vendas nova ganha seu próprio endpoint. A Corretora é a única etapa que não se repete — é
        compartilhada por tudo. As URLs e tokens ficam na aba Webhooks.
      </p>

      {doneCount !== null && (
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-card-hover">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${(doneCount / STEPS.length) * 100}%` }}
          />
        </div>
      )}

      <div className="space-y-2">
        {STEPS.map((step) => {
          const status = statusFor(step, endpoints, isAdmin);
          const isOpen = open === step.number;
          return (
            <div key={step.number} className="rounded-xl bg-card-hover">
              <button
                type="button"
                onClick={() => setOpen((prev) => (prev === step.number ? null : step.number))}
                className="flex w-full flex-wrap items-center gap-2 p-3 text-left"
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    status.done ? "bg-success text-white" : "bg-accent text-white"
                  )}
                >
                  {status.done ? <Check size={13} /> : step.number}
                </span>
                <span className="text-sm font-medium text-text-primary">{step.title}</span>
                {step.repeatable && (
                  <span className="rounded-button bg-card px-1.5 py-0.5 text-[10px] text-text-muted">repetível</span>
                )}
                <span className="text-[11px] text-text-muted">· {status.label}</span>
                <ChevronDown
                  size={15}
                  className={cn("ml-auto shrink-0 text-text-muted transition-transform", isOpen && "rotate-180")}
                />
              </button>

              {isOpen && (
                <div className="px-3 pb-3">
                  <p className="text-xs leading-relaxed text-text-secondary">{step.description}</p>
                  {step.contract && (
                    <code className="mt-2 block overflow-x-auto whitespace-pre rounded-input bg-input px-3 py-2 text-[11px] text-text-muted">
                      {step.contract}
                    </code>
                  )}
                  {status.entries.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-1.5 text-[11px] font-medium text-text-muted">Já configurados:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {status.entries.map((entry) => (
                          <span
                            key={entry.id}
                            className="inline-flex items-center gap-1 rounded-button bg-card px-2 py-1 text-[11px] text-text-secondary"
                          >
                            <Check size={11} className="text-success" />
                            {entry.label || `${entry.kind}${entry.platform ? ` · ${entry.platform}` : ""}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {step.kind !== "landing" && status.entries.length === 0 && (
                    <p className="mt-3 text-[11px] text-text-muted">
                      Nenhum endpoint desse tipo ainda — crie um na aba Webhooks.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
