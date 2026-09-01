"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Step {
  number: number;
  title: string;
  who: string;
  description: string;
  contract?: string;
  /** Passo 1 é automático — não tem o que "marcar como feito". */
  auto?: boolean;
}

const STEPS: Step[] = [
  {
    number: 1,
    title: "Landing / qualquer site",
    who: "Já funciona sozinho",
    description:
      'O script (aba UTMs, "Script de rastreamento") gera um lead_id único no navegador de quem clicou no anúncio e guarda em cookie + localStorage. Esse lead_id é o fio que conecta todo o resto.',
    auto: true,
  },
  {
    number: 2,
    title: "Checkout do curso",
    who: "Opcional — só se o link de compra carregar o identificador",
    description:
      'Se o botão de comprar usar window.ProfitXTracking.appendRef(url) (com "ref" ou o parâmetro que a plataforma exigir — algumas, como a Onprofit, só devolvem "sck") no link de checkout, a plataforma pode devolver esse valor no webhook de compra aprovada. Use o "Gerador de link" logo abaixo pra montar esse link sem digitar nada na mão.',
    contract:
      '{ "event": "purchase", "email": "...", "ref": "<lead_id ou null>", "external_id": "...", "amount_cents": 49700, "occurred_at": "..." }',
  },
  {
    number: 3,
    title: "Área de membros",
    who: "Precisa de 2 coisas do lado de lá",
    description:
      '(a) Disparar um webhook pra gente no primeiro acesso do aluno. (b) — o passo mais importante — o botão "Abrir minha conta na corretora" dentro da área de membros precisa levar esse mesmo identificador adiante, como ?ref=<lead_id>&email=<email_do_aluno> na URL de cadastro da corretora. Se a área de membros não souber o ref (porque o checkout não propagou), ainda dá pra passar só o e-mail — o casamento cai pra "por e-mail" nesse caso.',
    contract:
      '{ "event": "first_login", "email": "...", "ref": "<lead_id ou null>", "external_id": "<id do aluno>", "occurred_at": "..." }',
  },
  {
    number: 4,
    title: "Corretora",
    who: "Fecha o ciclo",
    description:
      "Ao abrir a conta, a corretora lê o ref/email que veio na URL de cadastro e devolve isso no webhook — é aqui que a gente sabe que ESSE lead específico virou conta na corretora. O mesmo webhook, disparado de novo no primeiro depósito, é o que fecha o funil.",
    contract:
      '{ "event": "account_created" | "deposit", "email": "...", "ref": "<lead_id ou null>", "external_id": "...", "amount_cents": 45000, "occurred_at": "..." }',
  },
];

const TOGGLEABLE = STEPS.filter((s) => !s.auto);

export function TrackingFlowGuide({ productSlug }: { productSlug: string }) {
  const storageKey = `px_flow_guide_done_${productSlug}`;
  const [done, setDone] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState<number | null>(2);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let storedDone: number[] = [];
    try {
      storedDone = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    } catch {
      storedDone = [];
    }
    setDone(new Set(storedDone));
    const firstPending = TOGGLEABLE.find((s) => !storedDone.includes(s.number));
    setOpen(firstPending ? firstPending.number : null);
    setHydrated(true);
  }, [storageKey]);

  function toggleDone(step: Step) {
    setDone((prev) => {
      const next = new Set(prev);
      const willBeDone = !next.has(step.number);
      if (willBeDone) next.add(step.number);
      else next.delete(step.number);
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
      } catch {}
      if (willBeDone) {
        const nextPending = TOGGLEABLE.find((s) => s.number > step.number && !next.has(s.number));
        setOpen(nextPending ? nextPending.number : null);
      }
      return next;
    });
  }

  const doneCount = TOGGLEABLE.filter((s) => done.has(s.number)).length;
  const allDone = hydrated && doneCount === TOGGLEABLE.length;

  return (
    <Card className="p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-text-primary">Como o lead_id viaja até a corretora</h3>
        <span className="text-[11px] font-medium text-text-muted">
          {allDone ? "Tudo implementado ✓" : `${doneCount} de ${TOGGLEABLE.length} implementados`}
        </span>
      </div>
      <p className="mb-3 text-xs text-text-secondary">
        Passo a passo guiado — clique numa etapa pra ver o que fazer e marque como feita conforme for implementando. As
        URLs e tokens de cada webhook ficam na aba Webhooks.
      </p>

      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-card-hover">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${hydrated ? (doneCount / TOGGLEABLE.length) * 100 : 0}%` }}
        />
      </div>

      <div className="space-y-2">
        {STEPS.map((step) => {
          const isDone = step.auto || done.has(step.number);
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
                    isDone ? "bg-success text-white" : "bg-accent text-white"
                  )}
                >
                  {isDone ? <Check size={13} /> : step.number}
                </span>
                <span className="text-sm font-medium text-text-primary">{step.title}</span>
                <span className="text-[11px] text-text-muted">· {step.who}</span>
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
                  {!step.auto && (
                    <label className="mt-3 flex w-fit items-center gap-2 text-xs text-text-secondary">
                      <input
                        type="checkbox"
                        checked={done.has(step.number)}
                        onChange={() => toggleDone(step)}
                        className="h-3.5 w-3.5 accent-accent"
                      />
                      Já implementei essa etapa
                    </label>
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
