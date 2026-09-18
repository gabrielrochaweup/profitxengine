import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { ToastProvider } from "@/components/ui/toast";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import "./globals.css";

export const metadata: Metadata = {
  title: "PROFITX Engine",
  description: "Content engine interna para geração de conversas, mensagens e e-mails",
};

// viewportFit: "cover" habilita env(safe-area-inset-*) no CSS — necessário
// pro menu inferior mobile respeitar a faixa do home indicator/notch em
// iPhones (sem isso, env() sempre retorna 0).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Tema escuro fixo. O script que lia localStorage saiu junto com o tema
    // claro: sem ele, quem já tinha "light" salvo no navegador não fica preso
    // num tema que não existe mais.
    <html lang="pt-BR" className="dark" data-theme="dark">
      <body className={`${GeistSans.variable} font-sans antialiased bg-app text-text-primary`}>
        <ToastProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
