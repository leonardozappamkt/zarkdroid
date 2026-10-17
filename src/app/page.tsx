'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Plus,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  TrendingUp,
  ExternalLink,
  Flame,
  Search,
  MoreVertical,
  Trash2
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import CreateDeckModal from '@/components/CreateDeckModal';
import CreateCardModal from '@/components/CreateCardModal';
import { Deck, Flashcard } from '@/types';
import { storage } from '@/lib/storage';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function HomePage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isNewDeckOpen, setIsNewDeckOpen] = useState(false);
  const [isNewCardOpen, setIsNewCardOpen] = useState(false);
  const [selectedDeckForCard, setSelectedDeckForCard] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSupabaseActive, setIsSupabaseActive] = useState(false);

  const refreshData = () => {
    const loadedCards = storage.getCards();
    storage.recalculateDeckCounts(loadedCards);
    const loadedDecks = storage.getDecks();
    setCards(loadedCards);
    setDecks(loadedDecks);
  };

  useEffect(() => {
    refreshData();
    setIsSupabaseActive(isSupabaseConfigured());
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
  const totalCards = cards.length;

  const filteredDecks = decks.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        onOpenNewDeck={() => setIsNewDeckOpen(true)}
        onOpenNewCard={() => {
          setSelectedDeckForCard(undefined);
          setIsNewCardOpen(true);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero & Quick Welcome */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800/80 p-6 sm:p-8">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-medium">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Fixado em http://localhost:3004</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Zarkdroid Flashcards
              </h1>
              <p className="text-slate-400 text-sm sm:text-base max-w-xl">
                Memorização inteligente inspirada no AnkiDroid com algoritmo de repetição espaçada (SRS).
                Pronto para sincronizar no Supabase e publicar na Vercel.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {decks.length > 0 && (
                <Link
                  href={`/study/${decks[0].id}`}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 transition-all hover:scale-[1.02]"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Iniciar Estudo Rápido</span>
                </Link>
              )}
              <button
                onClick={() => setIsNewDeckOpen(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Baralho</span>
              </button>
            </div>
          </div>

          {/* Background subtle glow */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* SRS Daily Summary Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">A Revisar</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{totalDue}</span>
                <span className="text-xs text-emerald-400 font-medium">hoje</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aprendendo</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{totalLearning}</span>
                <span className="text-xs text-amber-400 font-medium">em progresso</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Novos Cards</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{totalNew}</span>
                <span className="text-xs text-blue-400 font-medium">a iniciar</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Cards</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{totalCards}</span>
                <span className="text-xs text-purple-400 font-medium">{decks.length} baralhos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decks Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <span>Meus Baralhos</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {filteredDecks.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Contadores no padrão AnkiDroid: <span className="text-blue-400 font-medium">Azul (Novos)</span>,{' '}
              <span className="text-amber-400 font-medium">Laranja (Aprendendo)</span> e{' '}
              <span className="text-emerald-400 font-medium">Verde (Revisar Hoje)</span>
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar baralho..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Decks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDecks.map((deck) => {
            const hasDue = (deck.due_count || 0) + (deck.learn_count || 0) + (deck.new_count || 0) > 0;

            return (
              <div
                key={deck.id}
                className="group relative flex flex-col justify-between rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all hover:shadow-xl hover:shadow-black/40 overflow-hidden"
              >
                {/* Top color accent strip */}
                <div
                  className="h-1.5 w-full"
                  style={{ backgroundColor: deck.color || '#3b82f6' }}
                />

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  {/* Card Title & Options */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <Link
                        href={`/deck/${deck.id}`}
                        className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1"
                      >
                        {deck.title}
                      </Link>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {deck.description || 'Sem descrição cadastrada.'}
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleDeleteDeck(e, deck.id)}
                      title="Excluir baralho"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Anki style counts: [New (blue)] [Learning (amber)] [Due (green)] */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center gap-4 text-xs font-mono font-bold">
                      <div className="flex items-center gap-1.5" title="Novos cartões">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-blue-400">{deck.new_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Em aprendizado">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-amber-400">{deck.learn_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Para revisar hoje">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-emerald-400">{deck.due_count || 0}</span>
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-500 font-medium">
                      {deck.total_cards} cards
                    </span>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center gap-2 pt-2">
                    <Link
                      href={`/study/${deck.id}`}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>{hasDue ? 'Estudar Agora' : 'Revisar Novamente'}</span>
                    </Link>

                    <button
                      onClick={() => {
                        setSelectedDeckForCard(deck.id);
                        setIsNewCardOpen(true);
                      }}
                      title="Adicionar card a este baralho"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    <Link
                      href={`/deck/${deck.id}`}
                      title="Gerenciar cards"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredDecks.length === 0 && (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-3xl p-8 bg-slate-900/20">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">Nenhum baralho encontrado</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Crie seu primeiro baralho de flashcards para começar a estudar com repetição espaçada.
            </p>
            <button
              onClick={() => setIsNewDeckOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Baralho</span>
            </button>
          </div>
        )}

        {/* Integration Callout for Supabase & Vercel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Integrações do SaaS
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  isSupabaseActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {isSupabaseActive ? 'Supabase Conectado' : 'Modo Local Ativo'}
              </span>
            </div>
            <h4 className="text-base font-bold text-white">
              Pronto para Banco de Dados na Nuvem e Deploy na Vercel
            </h4>
            <p className="text-xs text-slate-400 max-w-2xl">
              Os dados estão salvos localmente e funcionam 100% offline. Para sincronizar em múltiplos
              aparelhos com o Supabase, basta preencher a chave no arquivo <code>.env.local</code> ou na página de configurações.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
            >
              Configurar Supabase
            </Link>
          </div>
        </div>
      </main>

      {/* Modals */}
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
