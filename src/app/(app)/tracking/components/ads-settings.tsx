"use client";

import type { Dispatch, SetStateAction } from "react";
import { Megaphone } from "@/components/ui/icones";
import { cn } from "@/lib/utils";
import { BmsPanel } from "./bms-panel";
import { AdAccountsPanel, type AdAccount } from "./ad-accounts-panel";
import { PixelsPanel } from "./pixels-panel";

export type { AdAccount };

/*
  Configurações → Anúncios.

  Aqui é "quais contas estão conectadas", não "o que as campanhas fizeram" —
  isso é Performance. As duas coisas usam as mesmas contas e por isso viviam
  na mesma aba; separadas, cada tela responde uma pergunta só.

  Sobre a marca das plataformas: os logos da Meta e do Google Ads são
  marcas registradas, e redesenhá-los de memória é pior do que não usá-los —
  sai errado e as diretrizes das duas proíbem versão modificada. Enquanto os
  arquivos oficiais não forem baixados dos respectivos brand centers (o que
  exige aceitar os termos deles), a identificação é feita do jeito que as
  próprias diretrizes permitem sem asset: o nome escrito, na cor da
  plataforma, num ladrilho. É reconhecível de longe e não inventa logo nenhum.
*/
const PLATAFORMAS = {
  meta: {
    nome: "Meta Ads",
    // #0081FB é o azul que a Meta publica como cor de marca.
    cor: "#0081FB",
    descricao: "Business Managers, contas de anúncio e Pixel/API de Conversões.",
  },
  google: {
    nome: "Google Ads",
    // #4285F4 é o azul do Google; o Ads usa a mesma família.
    cor: "#4285F4",
    descricao: "Contas de gerente (MCC), contas de anúncio e tag de conversão.",
  },
} as const;

type Plataforma = keyof typeof PLATAFORMAS;

export function AdsSettings({
  productId,
  plataforma,
  onTrocarPlataforma,
  accounts,
  setAccounts,
}: {
  productId: string;
  plataforma: Plataforma;
  onTrocarPlataforma: (p: Plataforma) => void;
  accounts: AdAccount[];
  setAccounts: Dispatch<SetStateAction<AdAccount[]>>;
}) {

  return (
    <div>
      {/* Terceiro nível: dois cartões de seleção, não uma terceira barra de
          abas. Cada um mostra a identidade da plataforma, que é justamente o
          que se procura ao chegar aqui. */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-2xl">
        {(Object.keys(PLATAFORMAS) as Plataforma[]).map((chave) => {
          const p = PLATAFORMAS[chave];
          const ativa = chave === plataforma;
          return (
            <button
              key={chave}
              type="button"
              onClick={() => onTrocarPlataforma(chave)}
              aria-pressed={ativa}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors duration-150",
                ativa
                  ? "border-accent bg-accent-soft"
                  : "border-border bg-card shadow-card hover:border-border-strong hover:bg-card-hover"
              )}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-button"
                style={{ backgroundColor: `${p.cor}1f`, color: p.cor }}
              >
                <Megaphone size={17} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold" style={{ color: ativa ? p.cor : undefined }}>
                  <span className={ativa ? "" : "text-text-primary"}>{p.nome}</span>
                </span>
                <span className="block truncate text-[11px] text-text-tertiary">{p.descricao}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* A conexão da conta de anúncio vem primeiro: é o que faz o gasto, o
          ROI e as campanhas aparecerem no resto do Tracking — e era o que
          ninguém achava. Pixel em seguida; BMs (controle manual) por último. */}
      <div className="space-y-5">
        <AdAccountsPanel
          productId={productId}
          platform={plataforma}
          accounts={accounts}
          setAccounts={setAccounts}
        />
        <PixelsPanel productId={productId} platform={plataforma} />
        <BmsPanel productId={productId} platform={plataforma} />
      </div>
    </div>
  );
}
