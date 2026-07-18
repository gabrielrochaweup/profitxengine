import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "PROFITX Engine",
  description: "Content engine interna para geração de conversas, mensagens e e-mails",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" data-theme="dark">
      <head>
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
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
