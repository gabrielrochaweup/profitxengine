import { Card } from "@/components/ui/card";

const PARAMS: { param: string; meaning: string; example: string }[] = [
  { param: "utm_source", meaning: "de onde veio o clique", example: "meta, google" },
  { param: "utm_medium", meaning: "tipo de mídia", example: "cpc, social, organic" },
  { param: "utm_campaign", meaning: "nome da campanha (o que aparece nos relatórios de Análises)", example: "lancamento_setembro" },
  { param: "utm_content", meaning: "identifica qual anúncio/criativo, opcional", example: "video_1, carrossel_a" },
  { param: "utm_term", meaning: "palavra-chave, opcional (mais usado no Google)", example: "trading-para-iniciantes" },
  { param: "mcid", meaning: "ID real da campanha no Meta Ads — usar {{campaign.id}} no modelo de URL do anúncio", example: "{{campaign.id}}" },
  { param: "gcid", meaning: "ID real da campanha no Google Ads — ValueTrack no modelo de URL de rastreamento", example: "{campaignid}" },
];

export function UtmGuide() {
  return (
    <Card className="p-5">
      <h3 className="mb-1 text-sm font-medium text-text-primary">Parâmetros que o script reconhece</h3>
      <p className="mb-4 text-xs text-text-secondary">
        Monte o link do anúncio com esses parâmetros na URL de destino. <code>utm_source</code>/<code>utm_campaign</code>{" "}
        são o que aparece na aba Análises hoje; <code>mcid</code>/<code>gcid</code> são opcionais, mas recomendados —
        são o que vai permitir cruzar com o gasto de anúncio assim que a conta Meta/Google estiver conectada, em vez
        de depender só do nome digitado.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border text-text-muted">
              <th className="py-2 pr-3 font-medium">Parâmetro</th>
              <th className="py-2 pr-3 font-medium">O que é</th>
              <th className="py-2 font-medium">Exemplo</th>
            </tr>
          </thead>
          <tbody>
            {PARAMS.map((p) => (
              <tr key={p.param} className="border-b border-border/50 text-text-secondary">
                <td className="py-2 pr-3 whitespace-nowrap font-mono text-accent">{p.param}</td>
                <td className="py-2 pr-3">{p.meaning}</td>
                <td className="py-2 whitespace-nowrap font-mono text-text-muted">{p.example}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-xl bg-input p-3">
        <p className="mb-1 text-[11px] font-medium text-text-muted">Exemplo de link completo pro Meta Ads</p>
        <code className="block overflow-x-auto whitespace-nowrap text-xs text-text-secondary">
          https://escolaprofitx.com/?utm_source=meta&amp;utm_medium=cpc&amp;utm_campaign=lancamento_setembro&amp;mcid={"{{"}
          campaign.id{"}}"}
        </code>
      </div>
    </Card>
  );
}
