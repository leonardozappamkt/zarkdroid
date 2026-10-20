'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Play, Trash2, Search } from 'lucide-react';
import Navbar from '@/components/Navbar';
import CreateCardModal from '@/components/CreateCardModal';
import { Deck, Flashcard } from '@/types';
import { storage } from '@/lib/storage';

interface DeckDetailPageProps {
  params: Promise<{ deckId: string }>;
}

export default function DeckDetailPage({ params }: DeckDetailPageProps) {
  const resolvedParams = use(params);
  const deckId = resolvedParams.deckId;

  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isNewCardOpen, setIsNewCardOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const loadData = () => {
    const loadedDecks = storage.getDecks();
    const currentDeck = loadedDecks.find((d) => d.id === deckId);
    if (currentDeck) {
      setDeck(currentDeck);
    }
    const deckCards = storage.getCards(deckId);
    setCards(deckCards);
  };

  useEffect(() => {
    loadData();
  }, [deckId]);

  const handleDeleteCard = (cardId: string) => {
    if (confirm('Tem certeza de que deseja excluir este flashcard?')) {
      storage.deleteCard(cardId);
      loadData();
    }
  };

  const handleCreateCard = (cardData: Omit<Flashcard, 'id' | 'created_at' | 'updated_at'>) => {
    storage.createCard(cardData);
    loadData();
  };

  if (!deck) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-mute">
        Carregando…
      </div>
    );
  }

  const filter = searchFilter.toLowerCase();
  const filteredCards = cards.filter(
    (c) => c.front.toLowerCase().includes(filter) || c.back.toLowerCase().includes(filter)
  );

  const stateLabel: Record<Flashcard['state'], string> = {
    new: 'novo',
    learning: 'aprendendo',
    review: 'revisão',
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onOpenNewCard={() => setIsNewCardOpen(true)} />

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-10 px-4 py-10 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          Baralhos
        </Link>

        <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{deck.title}</h1>
            <p className="max-w-xl text-sm text-mute">
              {deck.description || 'Baralho de estudos e repetição espaçada.'}
            </p>
            <p className="font-mono text-xs text-mute">
              {cards.length} cards · {deck.due_count || 0} para revisar
            </p>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setIsNewCardOpen(true)} className="btn-outline">
              <Plus className="h-4 w-4" />
              Card
            </button>
            <Link href={`/study/${deck.id}`} className="btn-primary">
              <Play className="h-4 w-4 fill-current" />
              Estudar
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">
              Cards <span className="ml-1 font-mono text-sm font-normal text-mute">{filteredCards.length}</span>
            </h2>
            <div className="relative w-full max-w-[16rem]">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
              <input
                type="text"
                placeholder="Filtrar"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="field rounded-full py-2 pl-10"
              />
            </div>
          </div>

          <ul className="card divide-y divide-line overflow-hidden">
            {filteredCards.map((card) => (
              <li key={card.id} className="flex items-start justify-between gap-4 p-4 sm:p-5">
                <div className="grid min-w-0 flex-1 gap-1 sm:grid-cols-2 sm:gap-6">
                  <p className="font-medium">{card.front}</p>
                  <div>
                    <p className="line-clamp-2 text-sm text-mute">{card.back}</p>
                    {card.extra && <p className="mt-1 text-xs italic text-mute">{card.extra}</p>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="hidden rounded-full border border-line px-2 py-0.5 text-[11px] text-mute sm:inline">
                    {stateLabel[card.state]}
                    {card.interval > 0 && ` · ${card.interval}d`}
                  </span>
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    title="Excluir card"
                    className="rounded-full p-2 text-mute hover:bg-soft hover:text-ink"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}

            {filteredCards.length === 0 && (
              <li className="py-14 text-center text-sm text-mute">Nenhum card encontrado.</li>
            )}
          </ul>
        </section>
      </main>

      <CreateCardModal
        isOpen={isNewCardOpen}
        onClose={() => setIsNewCardOpen(false)}
        decks={[deck]}
        currentDeckId={deck.id}
        onCreate={handleCreateCard}
      />
    </div>
  );
}
