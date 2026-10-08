"use client";

import type { ReactNode } from "react";
import { KeyRound, Cpu, Sparkles, CandlestickChart } from "@/components/ui/icones";
import { AreaComNavegacao } from "@/components/ui/area-com-navegacao";

/**
 * As quatro áreas de Configurações, uma por vez na coluna lateral. Antes era
 * tudo empilhado numa rolagem só, e a Performance de Trading — a mais usada
 * no dia a dia — ficava no fim da página.
 */
export function ConfiguracoesAreas({
  chaves,
  modelos,
  egi,
  trading,
}: {
  chaves: ReactNode;
  modelos: ReactNode;
  egi: ReactNode;
  trading: ReactNode;
}) {
  return (
    <AreaComNavegacao
      rotulo="Seções de Configurações"
      areas={[
        {
          key: "trading",
          label: "Performance de Trading",
          hint: "Placar, cotação e Alavancagem",
          icon: CandlestickChart,
          descricao:
            "Números reais de Pepe/Live/Copy Trader por janela — usados nos cálculos das dinâmicas e no contexto de geração do Direct.",
          conteudo: trading,
        },
        {
          key: "chaves",
          label: "Chaves de IA",
          hint: "OpenAI, Anthropic e Google",
          icon: KeyRound,
          descricao: "As chaves que ligam o app aos provedores de IA.",
          conteudo: chaves,
        },
        {
          key: "modelos",
          label: "Modelos por tarefa",
          hint: "Qual IA gera o quê",
          icon: Cpu,
          descricao: "Qual provedor e qual modelo cada tipo de geração usa.",
          conteudo: modelos,
        },
        {
          key: "egi",
          label: "Egi — IA",
          hint: "Prompt e arquivos",
          icon: Sparkles,
          descricao:
            "O prompt e os arquivos que guiam a Egi. O provedor e o modelo dela ficam em Modelos por tarefa.",
          conteudo: egi,
        },
      ]}
    />
  );
}
