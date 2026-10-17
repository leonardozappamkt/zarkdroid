'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Play,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  Search,
  BookOpen,
  Clock,
  RotateCcw
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import CreateCardModal from '@/components/CreateCardModal';
import { Deck, Flashcard } from '@/types';
import { storage } from '@/lib/storage';

interface DeckDetailPageProps {
  params: Promise<{ deckId: string }>;
}

export default function DeckDetailPage({ params }: DeckDetailPageProps) {
  const router = useRouter();
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Carregando informações do baralho...
      </div>
    );
  }

  const filteredCards = cards.filter(
    (c) =>
      c.front.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.back.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar onOpenNewCard={() => setIsNewCardOpen(true)} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Painel</span>
          </Link>
          <span>/</span>
          <span className="text-slate-200 font-medium">{deck.title}</span>
        </div>

        {/* Deck Header Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: deck.color || '#3b82f6' }}
              />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{deck.title}</h1>
            </div>
            <p className="text-slate-400 text-sm max-w-xl">
              {deck.description || 'Baralho de estudos e repetição espaçada.'}
            </p>
            <div className="flex items-center gap-4 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-400" />
                <strong className="text-white">{cards.length}</strong> cards no total
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <strong className="text-white">{deck.due_count || 0}</strong> para revisar
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/study/${deck.id}`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Estudar Baralho</span>
            </Link>
            <button
              onClick={() => setIsNewCardOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Card</span>
            </button>
          </div>
        </div>

        {/* Search & List of Cards */}
        <div className="flex items-center justify-between gap-4 pt-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Flashcards</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {filteredCards.length}
            </span>
          </h2>

          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Filtrar cartões..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Cards Table / List */}
        <div className="space-y-3">
          {filteredCards.map((card, idx) => (
            <div
              key={card.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500">#{idx + 1}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider ${
                      card.state === 'new'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : card.state === 'learning'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {card.state}
                  </span>
                  {card.interval > 0 && (
                    <span className="text-[11px] text-slate-400">
                      Intervalo: {card.interval} dia(s) (Fator: {card.ease_factor}x)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Frente
                    </p>
                    <p className="text-sm font-medium text-white mt-0.5">{card.front}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Verso
                    </p>
                    <p className="text-sm text-slate-300 mt-0.5 line-clamp-2">{card.back}</p>
                  </div>
                </div>

                {card.extra && (
                  <p className="text-xs text-slate-400 italic">💡 {card.extra}</p>
                )}
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  title="Excluir card"
                  className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {filteredCards.length === 0 && (
            <div className="text-center py-12 rounded-2xl border border-dashed border-slate-800 p-8 text-slate-400 text-sm">
              Nenhum flashcard encontrado neste baralho.
            </div>
          )}
        </div>
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
