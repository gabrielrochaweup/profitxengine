import { Card } from "@/components/ui/card";

interface Step {
  number: string;
  title: string;
  who: string;
  description: string;
  contract?: string;
}

const STEPS: Step[] = [
  {
    number: "1",
    title: "Landing / qualquer site",
    who: "Já funciona — nada a fazer",
    description:
      'O script (aba UTMs, "Script de rastreamento") gera um lead_id único no navegador de quem clicou no anúncio e guarda em cookie + localStorage. Esse lead_id é o fio que conecta todo o resto.',
  },
  {
    number: "2",
    title: "Checkout do curso",
    who: "Opcional — só se o link de compra carregar o ref",
    description:
      "Se o botão de comprar usar window.ProfitXTracking.appendRef(url) (ou anexar ?ref=<lead_id> manualmente) no link de checkout, a plataforma pode devolver esse ref no webhook de compra aprovada.",
    contract:
      '{ "event": "purchase", "email": "...", "ref": "<lead_id ou null>", "external_id": "...", "amount_cents": 49700, "occurred_at": "..." }',
  },
  {
    number: "3",
    title: "Área de membros",
    who: "Precisa de 2 coisas do lado de lá",
    description:
      '(a) Disparar um webhook pra gente no primeiro acesso do aluno. (b) — o passo mais importante — o botão "Abrir minha conta na corretora" dentro da área de membros precisa levar esse mesmo identificador adiante, como ?ref=<lead_id>&email=<email_do_aluno> na URL de cadastro da corretora. Se a área de membros não souber o ref (porque o checkout não propagou), ainda dá pra passar só o e-mail — o casamento cai pra "por e-mail" nesse caso.',
    contract:
      '{ "event": "first_login", "email": "...", "ref": "<lead_id ou null>", "external_id": "<id do aluno>", "occurred_at": "..." }',
  },
  {
    number: "4",
    title: "Corretora",
    who: "Fecha o ciclo",
    description:
      "Ao abrir a conta, a corretora lê o ref/email que veio na URL de cadastro e devolve isso no webhook — é aqui que a gente sabe que ESSE lead específico virou conta na corretora. O mesmo webhook, disparado de novo no primeiro depósito, é o que fecha o funil.",
    contract:
      '{ "event": "account_created" | "deposit", "email": "...", "ref": "<lead_id ou null>", "external_id": "...", "amount_cents": 45000, "occurred_at": "..." }',
  },
];

export function TrackingFlowGuide() {
  return (
    <Card className="p-5">
      <h3 className="mb-1 text-sm font-medium text-text-primary">Como o lead_id viaja até a corretora</h3>
      <p className="mb-4 text-xs text-text-secondary">
        Passo a passo de ponta a ponta — o que já funciona sozinho e o que precisa ser implementado do lado da área de
        membros e da corretora. As URLs e tokens de cada webhook ficam na aba Webhooks.
      </p>

      <div className="space-y-3">
        {STEPS.map((step) => (
          <div key={step.number} className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                {step.number}
              </span>
              <span className="text-sm font-medium text-text-primary">{step.title}</span>
              <span className="text-[11px] text-text-muted">· {step.who}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-text-secondary">{step.description}</p>
            {step.contract && (
              <code className="mt-2 block overflow-x-auto whitespace-pre rounded-input bg-input px-3 py-2 text-[11px] text-text-muted">
                {step.contract}
              </code>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
