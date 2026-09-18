"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Troca entre escuro e claro.
 *
 * O padrão é escuro, e quem nunca clicou aqui nunca sai dele: a escolha só
 * é gravada quando a pessoa troca de verdade. Assim um usuário novo entra no
 * tema que o produto assume, não no que o navegador dele prefere.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const current = (document.documentElement.dataset.theme as "dark" | "light") || "dark";
    setTheme(current);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* navegador com storage bloqueado: o tema vale só nesta aba */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
      aria-label={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-button text-text-secondary transition-colors duration-150 hover:bg-card-hover hover:text-text-primary"
    >
      {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
