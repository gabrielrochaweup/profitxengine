"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileJson } from "@/components/ui/icones";
import { createClient } from "@/lib/supabase/client";
import { Panel, SegmentedControl } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import { camposVazios, linhaDosCampos, registrarContagem, type CamposSwipe } from "@/lib/swipes";
import { ColarJson, ResumoLeitura, type LeituraOk } from "../components/colar-json";
import { SwipeForm } from "../components/swipe-form";
import { BarraSalvar } from "../components/barra-salvar";

type Modo = "colar" | "campos";

export function NovoSwipe({ productId, userId }: { productId: string; userId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [modo, setModo] = useState<Modo>("colar");
  const [campos, setCampos] = useState<CamposSwipe>(camposVazios);
  const [leitura, setLeitura] = useState<LeituraOk | null>(null);
  const [salvando, setSalvando] = useState(false);

  function aoLer(r: LeituraOk) {
    setCampos({ ...camposVazios(), ...r.campos });
    setLeitura(r);
    setModo("campos");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvar() {
    const linha = linhaDosCampos(campos);
    if (!linha.nome) {
      toast.error("Dê um nome ao produto antes de salvar.");
      document.getElementById("sw-nome")?.focus();
      return;
    }
    setSalvando(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("swipes")
      .insert({
        ...linha,
        product_id: productId,
        created_by: userId,
        historico_anuncios: registrarContagem([], linha.anuncios_ativos),
      })
      .select("id")
      .single();
    if (error || !data) {
      setSalvando(false);
      toast.error("Falha ao salvar o swipe.");
      return;
    }
    toast.success("Swipe salvo.");
    router.push(`/swipes/${data.id}`);
    router.refresh();
  }

  return (
    <div>
      <SegmentedControl<Modo>
        label="Como preencher"
        value={modo}
        onChange={setModo}
        options={[
          { key: "colar", label: "Colar JSON" },
          { key: "campos", label: "Preencher campos" },
        ]}
        className="mb-5"
      />

      {modo === "colar" ? (
        <Panel
          title="Colar JSON"
          icon={FileJson}
          description="A estrutura que vocês já usam: nome, nicho, oferta, links, anúncios, promessa, ganchos, score... Os campos ficam preenchidos e editáveis antes de salvar."
        >
          <ColarJson onLido={aoLer} />
        </Panel>
      ) : (
        <>
          {leitura && <ResumoLeitura leitura={leitura} onFechar={() => setLeitura(null)} />}
          <SwipeForm productId={productId} valor={campos} onChange={setCampos} />
          <BarraSalvar salvando={salvando} onSalvar={salvar} onCancelar={() => router.push("/swipes")} />
        </>
      )}
    </div>
  );
}
