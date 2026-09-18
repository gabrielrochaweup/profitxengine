"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type Mode = "login" | "signup" | "forgot";

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
  const [resetSent, setResetSent] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setSignupDone(null);
    setResetSent(false);
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

  async function handleForgotPassword(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });

    setLoading(false);
    if (resetError) {
      setError("Não foi possível enviar o link. Confira o e-mail e tente de novo.");
      return;
    }
    setResetSent(true);
  }

  async function handleGoogleLogin() {
    setError(null);
    setGoogleLoading(true);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
    if (oauthError) {
      setGoogleLoading(false);
      setError("Não foi possível iniciar o login com Google.");
    }
    // Em caso de sucesso o navegador é redirecionado pro Google — não há mais nada a fazer aqui.
  }

  if (mode === "forgot") {
    return (
      <Card className="w-full max-w-sm p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-text-primary">Esqueci minha senha</h1>
          <p className="mt-1 text-sm text-text-muted">
            {resetSent
              ? `Enviamos um link de redefinição pra ${email}, se esse e-mail tiver cadastro.`
              : "Informe seu e-mail e mandamos um link pra você redefinir a senha."}
          </p>
        </div>

        {!resetSent && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="forgotEmail" className="text-xs font-medium text-text-secondary">
                E-mail
              </label>
              <Input
                id="forgotEmail"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
              />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Enviar link de redefinição"}
            </Button>
          </form>
        )}

        <Button type="button" variant="secondary" className="mt-6 w-full" onClick={() => switchMode("login")}>
          Voltar pro login
        </Button>
      </Card>
    );
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
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-card bg-accent">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon.svg" alt="" className="h-7 w-auto" />
        </span>
        <h1 className="text-2xl font-semibold tracking-wide text-text-primary">ENGINE</h1>
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
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-xs font-medium text-text-secondary">
              Senha
            </label>
            {mode === "login" && (
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                className="text-xs font-medium text-accent-text hover:underline"
              >
                Esqueci minha senha
              </button>
            )}
          </div>
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

      {mode === "login" && (
        <>
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-text-muted">ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={googleLoading}
            onClick={handleGoogleLogin}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A11.998 11.998 0 0 0 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56V6.61H1.27a12 12 0 0 0 0 10.78l4-3.11Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.61l4 3.11C6.22 6.86 8.87 4.75 12 4.75Z"
              />
            </svg>
            {googleLoading ? "Redirecionando..." : "Continuar com Google"}
          </Button>
        </>
      )}

      <p className="mt-6 text-center text-sm text-text-muted">
        {mode === "login" ? (
          <>
            Não tem conta?{" "}
            <button type="button" onClick={() => switchMode("signup")} className="font-medium text-accent-text hover:underline">
              Criar conta
            </button>
          </>
        ) : (
          <>
            Já tem conta?{" "}
            <button type="button" onClick={() => switchMode("login")} className="font-medium text-accent-text hover:underline">
              Entrar
            </button>
          </>
        )}
      </p>
    </Card>
  );
}
