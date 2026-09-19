"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { NICHE_OPTIONS } from "@/lib/products";
import type { Database } from "@/lib/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];

/*
  Criar e editar projeto.

  Mora fora da barra de abas porque a barra deixou de ser o lugar dessas
  ações: elas agora vivem em Configurações de Projeto, no menu do usuário. A
  barra continua importando o de criar (o "+" segue lá, que é ação de um
  clique e não destrói nada), e o painel do Admin importa o mesmo — três
  telas, um formulário só.
*/

export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "produto";
}

/**
 * Editar muda o que se lê e de onde vêm as notícias: nome, ícone e nicho.
 *
 * O slug fica como está de propósito — ele é a chave do produto ativo, das
 * rotas e do menu de cada produto. Trocar o slug junto com o nome quebraria o
 * link que alguém salvou e o produto selecionado de quem estivesse com o app
 * aberto, pra resolver um problema que ninguém tem.
 */
export function EditProductModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product;
  onClose: () => void;
  onSaved: (product: Product) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(product.name);
  const [icon, setIcon] = useState(product.icon ?? "");
  const [niche, setNiche] = useState(product.niche ?? NICHE_OPTIONS[0].value);
  const [saving, setSaving] = useState(false);

  async function salvar() {
    if (!name.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .update({ name: name.trim(), icon: icon.trim() || null, niche })
      .eq("id", product.id)
      .select()
      .single();
    setSaving(false);
    if (error || !data) {
      toast.error("Erro ao salvar o projeto. Tente novamente.");
      return;
    }
    onSaved(data);
    toast.success(`Agora é "${data.name}".`);
    onClose();
  }

  return (
    <Modal open onClose={onClose} title="Editar projeto">
      <div className="space-y-3">
        <div className="grid grid-cols-[1fr_80px] gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Nome</label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") salvar();
              }}
              placeholder="Nome do projeto"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Ícone</label>
            <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="✨" className="text-center" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Nicho</label>
          <Select value={niche} onChange={(e) => setNiche(e.target.value)}>
            {NICHE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <p className="text-[11px] text-text-muted">Define de onde vêm as notícias mostradas no Calendário.</p>
        </div>

        <p className="text-[11px] text-text-tertiary">
          O endereço do projeto (<code className="text-text-secondary">{product.slug}</code>) não muda — links
          salvos continuam funcionando.
        </p>
        <Button type="button" onClick={salvar} disabled={saving || !name.trim()} className="w-full">
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </Modal>
  );
}

export function CreateProductModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (product: Product) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("✨");
  const [niche, setNiche] = useState<string>(NICHE_OPTIONS[0].value);
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("products")
      .insert({
        slug: slugify(name),
        name: name.trim(),
        icon: icon.trim() || null,
        niche,
        created_by: user?.id ?? null,
      })
      .select()
      .single();
    if (!error && data) {
      onCreated(data);
      setName("");
      setIcon("✨");
      setNiche(NICHE_OPTIONS[0].value);
      onClose();
    } else {
      toast.error("Erro ao criar o projeto. Tente novamente.");
    }
    setSaving(false);
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo projeto">
      <div className="space-y-3">
        <div className="grid grid-cols-[1fr_80px] gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Nome</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Produto 2" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Ícone</label>
            <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="✨" className="text-center" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Nicho</label>
          <Select value={niche} onChange={(e) => setNiche(e.target.value)}>
            {NICHE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <p className="text-[11px] text-text-muted">Define de onde vêm as notícias mostradas no Calendário.</p>
        </div>
        <Button type="button" onClick={handleCreate} disabled={saving || !name.trim()} className="w-full">
          {saving ? "Criando..." : "Criar projeto"}
        </Button>
      </div>
    </Modal>
  );
}
