'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2, Plus } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { storage } from '@/lib/storage';
import { LIBRARY, type LibraryDeck } from '@/lib/library';

export default function LibraryPage() {
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const ids = new Set(storage.getDecks().map((d) => d.id));
    setAdded(new Set(LIBRARY.filter((d) => ids.has(`deck-${d.id}`)).map((d) => d.id)));
  }, []);

  const add = async (deck: LibraryDeck) => {
    setBusy(deck.id);
    setError('');
    try {
      const cards = await deck.load();
      const result = await storage.importDecks([{ key: deck.id, title: deck.title, description: deck.description, cards }]);
      setAdded((prev) => new Set(prev).add(deck.id));
      if (!result.synced) setError('Adicionado neste aparelho. A sincronização com a nuvem falhou e será tentada de novo depois.');
    } catch {
      setError('Não foi possível adicionar o baralho. Tente de novo.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-10 px-4 py-10 sm:px-6">
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
            Baralhos
          </Link>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">Biblioteca</h1>
              <p className="max-w-xl text-sm text-mute">Baralhos prontos para adicionar à sua conta. Você pode editar, apagar e estudar como qualquer outro.</p>
            </div>
            <Link href="/import" className="btn-outline self-start">
              Importar do Anki ou CSV
            </Link>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-ink px-3.5 py-2.5 text-sm">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {LIBRARY.map((deck) => {
            const isAdded = added.has(deck.id);
            return (
              <article key={deck.id} className="card flex flex-col justify-between gap-5 p-5">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold tracking-tight">{deck.title}</h2>
                    <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[11px] text-mute">{deck.level}</span>
                  </div>
                  <p className="text-sm text-mute">{deck.description}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-mute">{deck.count} cards</span>
                  {isAdded ? (
                    <span className="inline-flex items-center gap-1.5 text-sm text-mute">
                      <Check className="h-4 w-4" />
                      Adicionado
                    </span>
                  ) : (
                    <button onClick={() => add(deck)} disabled={busy !== null} className="btn-primary">
                      {busy === deck.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Adicionar
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <p className="text-xs text-mute">
          Traduções preparadas pela equipe do Zarkdroid. Encontrou algo errado? Edite o card no seu baralho.
        </p>
      </main>
    </div>
  );
}
