"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError("Não foi possível redefinir a senha. Peça um novo link em \"Esqueci minha senha\".");
      return;
    }

    setDone(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1500);
  }

  if (done) {
    return (
      <Card className="w-full max-w-sm p-8 text-center">
        <h1 className="text-lg font-semibold text-text-primary">Senha redefinida!</h1>
        <p className="mt-2 text-sm text-text-secondary">Te levando pro painel...</p>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm p-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-text-primary">Nova senha</h1>
        <p className="mt-1 text-sm text-text-muted">Escolha uma nova senha para sua conta</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs font-medium text-text-secondary">
            Nova senha
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-xs font-medium text-text-secondary">
            Confirmar senha
          </label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Salvando..." : "Redefinir senha"}
        </Button>
      </form>
    </Card>
  );
}
