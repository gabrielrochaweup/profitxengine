"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type Mode = "login" | "signup";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState<"pending" | "confirm-email" | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setSignupDone(null);
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError("E-mail ou senha inválidos.");
      return;
    }

    const next = searchParams.get("next") || "/dashboard";
    router.push(next);
    router.refresh();
  }

  async function handleSignup(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message === "User already registered" ? "Esse e-mail já tem cadastro." : "Não foi possível concluir o cadastro.");
      return;
    }

    if (data.session) {
      router.push("/pendente");
      router.refresh();
    } else {
      setSignupDone("confirm-email");
    }
  }

  if (signupDone === "confirm-email") {
    return (
      <Card className="w-full max-w-sm p-8 text-center">
        <h1 className="text-lg font-semibold text-text-primary">Confirme seu e-mail</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Enviamos um link de confirmação pra {email}. Depois de confirmar, faça login — seu acesso fica
          liberado assim que um administrador aprovar o cadastro.
        </p>
        <Button type="button" variant="secondary" className="mt-6 w-full" onClick={() => switchMode("login")}>
          Voltar pro login
        </Button>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm p-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-text-primary">PROFITX Engine</h1>
        <p className="mt-1 text-sm text-text-muted">
          {mode === "login" ? "Entre com sua conta para continuar" : "Crie sua conta para solicitar acesso"}
        </p>
      </div>

      <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-4">
        {mode === "signup" && (
          <div className="space-y-1.5">
            <label htmlFor="fullName" className="text-xs font-medium text-text-secondary">
              Nome completo
            </label>
            <Input
              id="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-medium text-text-secondary">
            E-mail
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs font-medium text-text-secondary">
            Senha
          </label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Enviando..." : mode === "login" ? "Entrar" : "Criar conta"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        {mode === "login" ? (
          <>
            Não tem conta?{" "}
            <button type="button" onClick={() => switchMode("signup")} className="font-medium text-accent hover:underline">
              Criar conta
            </button>
          </>
        ) : (
          <>
            Já tem conta?{" "}
            <button type="button" onClick={() => switchMode("login")} className="font-medium text-accent hover:underline">
              Entrar
            </button>
          </>
        )}
      </p>
    </Card>
  );
}
