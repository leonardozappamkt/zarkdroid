import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zarkdroid — SaaS de Flashcards & Repetição Espaçada",
  description: "Plataforma de alta performance para memorização com algoritmo de repetição espaçada (SRS), inspirada no AnkiDroid.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen selection:bg-blue-500/30 selection:text-blue-200">
        {children}
      </body>
    </html>
  );
}
