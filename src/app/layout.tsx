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
    <html lang="pt-BR" className="dark" data-theme="dark">
      <head>
        {/* Aplica o tema salvo antes da primeira pintura. Sem isso, quem usa
            o claro vê um lampejo escuro em todo carregamento. O padrão é
            "dark": só quem trocou de propósito tem algo salvo. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try {
  const theme = localStorage.getItem("theme") || "dark";
  document.documentElement.dataset.theme = theme;
} catch (e) {}`,
          }}
        />
      </head>
      <body className={`${GeistSans.variable} font-sans antialiased bg-app text-text-primary`}>
        <ToastProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
