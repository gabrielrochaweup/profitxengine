"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ProfileSettingsProps {
  userId: string;
  email: string | null;
  initialFullName: string | null;
}

export function ProfileSettings({ userId, email, initialFullName }: ProfileSettingsProps) {
  const [fullName, setFullName] = useState(initialFullName ?? "");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  async function handleSaveName() {
    setSavingName(true);
    setNameSaved(false);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ full_name: fullName || null }).eq("id", userId);
    setSavingName(false);
    if (!error) {
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    }
  }

  async function handleChangePassword() {
    setPasswordError(null);
    setPasswordSaved(false);

    if (newPassword.length < 6) {
      setPasswordError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem.");
      return;
    }

    setSavingPassword(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) {
      setPasswordError("Não foi possível atualizar a senha.");
      return;
    }

    setPasswordSaved(true);
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordSaved(false), 2000);
  }

  return (
    <section>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm font-medium text-text-primary">Dados pessoais</p>
          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Nome completo</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">E-mail</label>
              <Input value={email ?? ""} disabled />
            </div>
            <Button type="button" size="sm" disabled={savingName} onClick={handleSaveName}>
              {savingName ? "Salvando..." : nameSaved ? "Salvo" : "Salvar nome"}
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-medium text-text-primary">Nova senha</p>
          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Nova senha</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Confirmar nova senha</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {passwordError && <p className="text-xs text-danger">{passwordError}</p>}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={savingPassword || !newPassword}
              onClick={handleChangePassword}
            >
              {savingPassword ? "Atualizando..." : passwordSaved ? "Senha atualizada" : "Atualizar senha"}
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
