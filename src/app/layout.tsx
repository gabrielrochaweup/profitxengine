import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { Chakra_Petch } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import "./globals.css";

// Fonte técnica: títulos, faixas de seção, rótulos em caixa-alta e números
// grandes. O texto corrido e as tabelas continuam em Geist, que lê melhor
// em leitura longa.
const fonteTecnica = Chakra_Petch({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ENGINE",
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
      <body className={`${GeistSans.variable} ${fonteTecnica.variable} font-sans antialiased bg-app text-text-primary`}>
        <ToastProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
