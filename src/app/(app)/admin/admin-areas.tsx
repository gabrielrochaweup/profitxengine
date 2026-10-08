"use client";

import type { ReactNode } from "react";
import { Users, Package, Activity } from "@/components/ui/icones";
import { AreaComNavegacao } from "@/components/ui/area-com-navegacao";

/** Equipe, produtos e uso de IA — uma área por vez em vez de três cartões empilhados. */
export function AdminAreas({
  pendentes,
  equipe,
  produtos,
  uso,
}: {
  /** Cadastros esperando aprovação — vira o selo de atenção da Equipe. */
  pendentes: number;
  equipe: ReactNode;
  produtos: ReactNode;
  uso: ReactNode;
}) {
  return (
    <AreaComNavegacao
      rotulo="Seções do Admin"
      areas={[
        {
          key: "equipe",
          label: "Equipe",
          hint: "Aprovação e papéis",
          icon: Users,
          descricao: "Aprove cadastros novos e gerencie os papéis da equipe.",
          ...(pendentes > 0
            ? {
                badge: String(pendentes),
                tone: "warning" as const,
                badgeLabel: `${pendentes} ${pendentes === 1 ? "cadastro esperando" : "cadastros esperando"} aprovação`,
              }
            : {}),
          conteudo: equipe,
        },
        {
          key: "produtos",
          label: "Produtos",
          hint: "Produtos do app",
          icon: Package,
          descricao: "Os produtos do app e quem enxerga cada um.",
          conteudo: produtos,
        },
        {
          key: "uso",
          label: "Uso de IA",
          hint: "Últimas 50 gerações",
          icon: Activity,
          descricao: "O que foi gerado por IA, por quem, com qual modelo e quanto custou.",
          conteudo: uso,
        },
      ]}
    />
  );
}
