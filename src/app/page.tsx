'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Play, Search, Trash2, ArrowUpRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import CreateDeckModal from '@/components/CreateDeckModal';
import CreateCardModal from '@/components/CreateCardModal';
import { Deck, Flashcard } from '@/types';
import { storage } from '@/lib/storage';

export default function HomePage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isNewDeckOpen, setIsNewDeckOpen] = useState(false);
  const [isNewCardOpen, setIsNewCardOpen] = useState(false);
  const [selectedDeckForCard, setSelectedDeckForCard] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  const refreshData = () => {
    const loadedCards = storage.getCards();
    storage.recalculateDeckCounts(loadedCards);
    setCards(loadedCards);
    setDecks(storage.getDecks());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleCreateDeck = (title: string, description: string, color: string) => {
    storage.createDeck(title, description, color);
    refreshData();
  };

  const handleCreateCard = (cardData: Omit<Flashcard, 'id' | 'created_at' | 'updated_at'>) => {
    storage.createCard(cardData);
    refreshData();
  };

  const handleDeleteDeck = (e: React.MouseEvent, deckId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm('Tem certeza de que deseja excluir este baralho e todos os seus cards?')) {
      storage.deleteDeck(deckId);
      refreshData();
    }
  };

  const totalDue = decks.reduce((acc, d) => acc + (d.due_count || 0), 0);
  const totalLearning = decks.reduce((acc, d) => acc + (d.learn_count || 0), 0);
  const totalNew = decks.reduce((acc, d) => acc + (d.new_count || 0), 0);

  const query = searchQuery.toLowerCase();
  const filteredDecks = decks.filter(
    (d) => d.title.toLowerCase().includes(query) || d.description.toLowerCase().includes(query)
  );

  const stats = [
    { label: 'Revisar', value: totalDue },
    { label: 'Aprendendo', value: totalLearning },
    { label: 'Novos', value: totalNew },
    { label: 'Total', value: cards.length },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        onOpenNewDeck={() => setIsNewDeckOpen(true)}
        onOpenNewCard={() => {
          setSelectedDeckForCard(undefined);
          setIsNewCardOpen(true);
        }}
      />

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-12 px-4 py-10 sm:px-6 sm:py-14">
        {/* Hero */}
        <section className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Estude um pouco.
              <br />
              <span className="text-mute">Todo dia.</span>
            </h1>
            <p className="max-w-md text-sm text-mute sm:text-base">
              Flashcards com repetição espaçada para fixar inglês de verdade.
            </p>
          </div>

          {decks.length > 0 && (
            <Link href={`/study/${decks[0].id}`} className="btn-primary self-start px-6 py-3 sm:self-auto">
              <Play className="h-4 w-4 fill-current" />
              Estudar agora
            </Link>
          )}
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-paper p-5">
              <p className="text-xs uppercase tracking-wider text-mute">{s.label}</p>
              <p className="mt-2 font-mono text-3xl font-semibold tabular-nums">{s.value}</p>
            </div>
          ))}
        </section>

        {/* Decks */}
        <section className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">
              Baralhos <span className="ml-1 font-mono text-sm font-normal text-mute">{filteredDecks.length}</span>
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
              <input
                type="text"
                placeholder="Buscar"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="field rounded-full py-2 pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredDecks.map((deck) => (
              <article
                key={deck.id}
                className="card group flex flex-col justify-between gap-6 p-5 transition-colors hover:border-ink"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/deck/${deck.id}`}
                      className="line-clamp-1 text-lg font-semibold tracking-tight hover:underline"
                    >
                      {deck.title}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-sm text-mute">
                      {deck.description || 'Sem descrição.'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteDeck(e, deck.id)}
                    title="Excluir baralho"
                    className="rounded-full p-2 text-mute transition-colors hover:bg-soft hover:text-ink"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-end justify-between">
                  <dl className="flex gap-6 font-mono text-sm">
                    <div title="Novos">
                      <dd className="text-xl font-semibold tabular-nums">{deck.new_count || 0}</dd>
                      <dt className="text-[10px] uppercase tracking-wider text-mute">novos</dt>
                    </div>
                    <div title="Em aprendizado">
                      <dd className="text-xl font-semibold tabular-nums">{deck.learn_count || 0}</dd>
                      <dt className="text-[10px] uppercase tracking-wider text-mute">aprender</dt>
                    </div>
                    <div title="Para revisar hoje">
                      <dd className="text-xl font-semibold tabular-nums">{deck.due_count || 0}</dd>
                      <dt className="text-[10px] uppercase tracking-wider text-mute">revisar</dt>
                    </div>
                  </dl>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedDeckForCard(deck.id);
                        setIsNewCardOpen(true);
                      }}
                      title="Adicionar card"
                      className="btn-outline h-9 w-9 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <Link href={`/deck/${deck.id}`} title="Gerenciar cards" className="btn-outline h-9 w-9 p-0">
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                    <Link href={`/study/${deck.id}`} className="btn-primary h-9">
                      Estudar
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredDecks.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line py-16 text-center">
              <p className="font-medium">Nenhum baralho por aqui</p>
              <p className="mx-auto mt-1 max-w-xs text-sm text-mute">
                Crie um baralho para começar a estudar com repetição espaçada.
              </p>
              <button onClick={() => setIsNewDeckOpen(true)} className="btn-primary mt-5">
                <Plus className="h-4 w-4" />
                Criar baralho
              </button>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6 text-xs text-mute sm:px-6">
          <span>Zarkdroid</span>
          <nav className="flex gap-4">
            <Link href="/privacy" className="hover:text-ink">
              Privacidade
            </Link>
            <Link href="/download" className="hover:text-ink">
              Baixar app Android
            </Link>
          </nav>
        </div>
      </footer>

      <CreateDeckModal
        isOpen={isNewDeckOpen}
        onClose={() => setIsNewDeckOpen(false)}
        onCreate={handleCreateDeck}
      />

      <CreateCardModal
        isOpen={isNewCardOpen}
        onClose={() => setIsNewCardOpen(false)}
        decks={decks}
        currentDeckId={selectedDeckForCard}
        onCreate={handleCreateCard}
      />
    </div>
  );
}
