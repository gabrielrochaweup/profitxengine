"use client";

import { useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { SideNav, SplitLayout, type SideNavTone } from "./panel";

export interface AreaDaNavegacao<T extends string> {
  key: T;
  label: string;
  hint?: string;
  icon: LucideIcon;
  /** Frase de abertura da área, embaixo do título. */
  descricao?: string;
  badge?: ReactNode;
  tone?: SideNavTone;
  badgeLabel?: string;
  conteudo: ReactNode;
}

/**
 * Página com várias áreas: coluna lateral (nível 1) à esquerda e UMA área
 * por vez à direita — em vez de todas empilhadas numa rolagem só.
 *
 * A área aberta fica na URL (?area=) pra link salvo e o "voltar" do
 * navegador caírem no mesmo lugar. Escrita com history.replaceState: o
 * conteúdo já está todo no cliente, não há o que buscar de novo.
 */
export function AreaComNavegacao<T extends string>({
  areas,
  rotulo,
}: {
  areas: AreaDaNavegacao<T>[];
  /** Nome da navegação pra leitor de tela (ex: "Seções de Configurações"). */
  rotulo: string;
}) {
  const searchParams = useSearchParams();
  const daUrl = searchParams.get("area");
  const [ativa, setAtiva] = useState<T>(
    areas.some((a) => a.key === daUrl) ? (daUrl as T) : areas[0].key
  );

  function trocar(key: T) {
    setAtiva(key);
    const params = new URLSearchParams(window.location.search);
    params.set("area", key);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    window.scrollTo({ top: 0 });
  }

  const atual = areas.find((a) => a.key === ativa) ?? areas[0];

  return (
    <SplitLayout
      nav={
        <SideNav
          label={rotulo}
          active={ativa}
          onChange={trocar}
          items={areas.map(({ key, label, hint, icon, badge, tone, badgeLabel }) => ({
            key,
            label,
            hint,
            icon,
            badge,
            tone,
            badgeLabel,
          }))}
        />
      }
    >
      <header className="min-w-0">
        <h2 className="text-[20px] font-semibold leading-tight text-text-primary">{atual.label}</h2>
        {atual.descricao && <p className="mt-1 text-[13px] text-text-tertiary">{atual.descricao}</p>}
      </header>
      <div className="min-w-0">{atual.conteudo}</div>
    </SplitLayout>
  );
}
