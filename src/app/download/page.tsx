import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Download, Smartphone } from 'lucide-react';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Download — Zarkdroid',
  description: 'Baixe o app Android do Zarkdroid.',
};

const REPO = process.env.NEXT_PUBLIC_GITHUB_REPO || 'leonardozappamkt/zarkdroid';
const APK_URL = `https://github.com/${REPO}/releases/latest/download/zarkdroid.apk`;

const STEPS = [
  'Baixe o arquivo zarkdroid.apk no seu Android.',
  'Abra o arquivo. Se o Android pedir, permita a instalação de apps desta fonte.',
  'Toque em Instalar e abra o Zarkdroid.',
];

export default function DownloadPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-12 px-4 py-10 sm:px-6 sm:py-14">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          Baralhos
        </Link>

        <section className="space-y-5">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Zarkdroid
            <br />
            <span className="text-mute">no seu Android.</span>
          </h1>
          <p className="max-w-md text-mute">
            Estude seus flashcards em qualquer lugar. Mesmos baralhos, mesma repetição espaçada.
          </p>
          <a href={APK_URL} className="btn-primary px-6 py-3 text-base">
            <Download className="h-5 w-5" />
            Baixar APK
          </a>
          <p className="text-xs text-mute">Android 7.0 ou superior · arquivo .apk</p>
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-semibold tracking-tight">Como instalar</h2>
          <ol className="mt-4 space-y-3">
            {STEPS.map((step, i) => (
              <li key={step} className="flex gap-4 text-sm">
                <span className="font-mono text-mute">{String(i + 1).padStart(2, '0')}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="card flex items-start gap-4 p-6">
          <Smartphone className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-1">
            <h2 className="font-semibold tracking-tight">Prefere sem APK?</h2>
            <p className="text-sm text-mute">
              Abra este site no Chrome do celular, toque em ⋮ e depois em “Adicionar à tela inicial”. Funciona como um app.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
