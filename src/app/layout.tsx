import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AuthGate from "@/components/AuthGate";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Zarkdroid — Flashcards com repetição espaçada",
  description: "Estude inglês com flashcards e repetição espaçada (SRS), inspirado no AnkiDroid. Simples, rápido e minimalista.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon-512.png" },
  appleWebApp: { capable: true, title: "Zarkdroid", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased"><AuthGate>{children}</AuthGate></body>
    </html>
  );
}
