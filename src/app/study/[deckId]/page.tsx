'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  RotateCw,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Trophy,
  Flame,
  Volume2,
  ChevronRight,
  Eye
} from 'lucide-react';
import { Flashcard, Deck, ReviewRating, StudySessionStats } from '@/types';
import { storage } from '@/lib/storage';
import { calculateNextReview, formatIntervalEstimate } from '@/lib/srs';

interface StudyPageProps {
  params: Promise<{ deckId: string }>;
}

export default function StudyPage({ params }: StudyPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const deckId = resolvedParams.deckId;

  const [deck, setDeck] = useState<Deck | null>(null);
  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [stats, setStats] = useState<StudySessionStats>({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
    total: 0,
    startTime: Date.now(),
  });

  useEffect(() => {
    const loadedDecks = storage.getDecks();
    const currentDeck = loadedDecks.find((d) => d.id === deckId);
    if (currentDeck) {
      setDeck(currentDeck);
    }

    const allCards = storage.getCards(deckId);
    // Prioritize cards: learning -> due review -> new
    const sorted = [...allCards].sort((a, b) => {
      const priority = { learning: 0, review: 1, new: 2 };
      return priority[a.state] - priority[b.state];
    });

    setQueue(sorted);
    setStats((prev) => ({ ...prev, startTime: Date.now() }));
  }, [deckId]);

  const currentCard = queue[currentIndex];

  const handleRating = (rating: ReviewRating) => {
    if (!currentCard) return;

    // Update SRS algorithm metadata
    const updatedFields = calculateNextReview(currentCard, rating);
    const updatedCard: Flashcard = {
      ...currentCard,
      ...updatedFields,
    };

    storage.updateCard(updatedCard);

    // Track statistics
    setStats((prev) => ({
      ...prev,
      [rating]: prev[rating] + 1,
      total: prev.total + 1,
    }));

    // If rated 'again', re-insert at the end of the current session queue for reinforcement!
    if (rating === 'again') {
      setQueue((prevQueue) => [...prevQueue, updatedCard]);
    }

    setShowAnswer(false);

    if (currentIndex + 1 < queue.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
      setStats((prev) => ({ ...prev, endTime: Date.now() }));
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished) return;

      if (!showAnswer) {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          setShowAnswer(true);
        }
      } else {
        if (e.key === '1') {
          e.preventDefault();
          handleRating('again');
        } else if (e.key === '2') {
          e.preventDefault();
          handleRating('hard');
        } else if (e.key === '3') {
          e.preventDefault();
          handleRating('good');
        } else if (e.key === '4') {
          e.preventDefault();
          handleRating('easy');
        } else if (e.code === 'Space' || e.code === 'Enter') {
          // Default Good on space
          e.preventDefault();
          handleRating('good');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAnswer, isFinished, currentIndex, queue]);

  if (!deck) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Carregando baralho...
      </div>
    );
  }

  const progressPercentage = queue.length > 0 ? Math.round((currentIndex / queue.length) * 100) : 100;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Top Study Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 py-3 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>{deck.title}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Estudo SRS
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Card {currentIndex + 1} de {queue.length}
              </p>
            </div>
          </div>

          {/* Anki indicators */}
          <div className="flex items-center gap-3 text-xs font-mono font-bold">
            <div className="flex items-center gap-1 text-blue-400" title="Novos">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>{queue.slice(currentIndex).filter((c) => c.state === 'new').length}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-400" title="Aprendendo">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>{queue.slice(currentIndex).filter((c) => c.state === 'learning').length}</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400" title="Revisão">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{queue.slice(currentIndex).filter((c) => c.state === 'review').length}</span>
            </div>
          </div>
        </div>

        {/* Progress line */}
        <div className="w-full bg-slate-800 h-1 mt-3 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </header>

      {/* Main Flashcard Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 flex flex-col justify-center">
        {!isFinished && currentCard ? (
          <div className="space-y-6 animate-fade-in">
            {/* The Flashcard itself */}
            <div className="relative rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-10 min-h-[340px] flex flex-col justify-between transition-all">
              {/* Card Meta / Tags */}
              <div className="flex items-center justify-between text-xs text-slate-500 mb-4 pb-3 border-b border-slate-800/60">
                <span className="uppercase tracking-wider font-semibold">
                  {currentCard.state === 'new'
                    ? 'Novo Card'
                    : currentCard.state === 'learning'
                    ? 'Em Aprendizado'
                    : 'Revisão Espaçada'}
                </span>
                {currentCard.tags && currentCard.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {currentCard.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[11px]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Front of card (Question) */}
              <div className="my-auto py-4">
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2">
                  Pergunta
                </p>
                <div className="text-xl sm:text-2xl font-medium text-white leading-relaxed">
                  {currentCard.front}
                </div>
              </div>

              {/* Back of card (Answer) */}
              {showAnswer ? (
                <div className="mt-6 pt-6 border-t border-slate-800 animate-slide-up space-y-3">
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                    Resposta
                  </p>
                  <div className="text-lg sm:text-xl text-slate-200 leading-relaxed font-normal">
                    {currentCard.back}
                  </div>
                  {currentCard.extra && (
                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-sm text-slate-300 italic">
                      💡 {currentCard.extra}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-slate-500">
                    Pressione <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Espaço</kbd> para mostrar a resposta
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Finished Screen */
          <div className="text-center py-12 px-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl max-w-lg mx-auto space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
              <Trophy className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Parabéns! Revisão Concluída!</h2>
              <p className="text-sm text-slate-400">
                Você finalizou todos os cartões programados para este baralho hoje.
              </p>
            </div>

            {/* Session Stats Breakdown */}
            <div className="grid grid-cols-4 gap-2 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div>
                <p className="text-xs text-red-400 font-medium">Errei</p>
                <p className="text-lg font-bold text-white mt-1">{stats.again}</p>
              </div>
              <div>
                <p className="text-xs text-amber-400 font-medium">Difícil</p>
                <p className="text-lg font-bold text-white mt-1">{stats.hard}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-400 font-medium">Bom</p>
                <p className="text-lg font-bold text-white mt-1">{stats.good}</p>
              </div>
              <div>
                <p className="text-xs text-blue-400 font-medium">Fácil</p>
                <p className="text-lg font-bold text-white mt-1">{stats.easy}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-blue-600/30"
              >
                Voltar aos Baralhos
              </Link>
              <Link
                href={`/deck/${deck.id}`}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-sm transition-colors"
              >
                Gerenciar Baralho
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Action Footer (Reveal or Anki 4-Rating buttons) */}
      {!isFinished && currentCard && (
        <footer className="border-t border-slate-800/80 bg-slate-900/90 backdrop-blur-md p-4 sticky bottom-0 z-20">
          <div className="max-w-3xl mx-auto">
            {!showAnswer ? (
              <button
                onClick={() => setShowAnswer(true)}
                className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Eye className="w-5 h-5" />
                <span>Mostrar Resposta (Espaço)</span>
              </button>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:gap-4">
                {/* 1 - Again */}
                <button
                  onClick={() => handleRating('again')}
                  className="flex flex-col items-center justify-center py-2.5 sm:py-3 px-2 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 transition-all group"
                >
                  <span className="text-xs sm:text-sm font-bold flex items-center gap-1">
                    <span>Errei</span>
                    <kbd className="hidden sm:inline px-1 text-[10px] bg-red-500/20 rounded font-mono">1</kbd>
                  </span>
                  <span className="text-[11px] opacity-75 mt-0.5">
                    {formatIntervalEstimate(currentCard, 'again')}
                  </span>
                </button>

                {/* 2 - Hard */}
                <button
                  onClick={() => handleRating('hard')}
                  className="flex flex-col items-center justify-center py-2.5 sm:py-3 px-2 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:text-amber-300 transition-all group"
                >
                  <span className="text-xs sm:text-sm font-bold flex items-center gap-1">
                    <span>Difícil</span>
                    <kbd className="hidden sm:inline px-1 text-[10px] bg-amber-500/20 rounded font-mono">2</kbd>
                  </span>
                  <span className="text-[11px] opacity-75 mt-0.5">
                    {formatIntervalEstimate(currentCard, 'hard')}
                  </span>
                </button>

                {/* 3 - Good */}
                <button
                  onClick={() => handleRating('good')}
                  className="flex flex-col items-center justify-center py-2.5 sm:py-3 px-2 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 transition-all group"
                >
                  <span className="text-xs sm:text-sm font-bold flex items-center gap-1">
                    <span>Bom</span>
                    <kbd className="hidden sm:inline px-1 text-[10px] bg-emerald-500/20 rounded font-mono">3</kbd>
                  </span>
                  <span className="text-[11px] opacity-75 mt-0.5">
                    {formatIntervalEstimate(currentCard, 'good')}
                  </span>
                </button>

                {/* 4 - Easy */}
                <button
                  onClick={() => handleRating('easy')}
                  className="flex flex-col items-center justify-center py-2.5 sm:py-3 px-2 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:text-blue-300 transition-all group"
                >
                  <span className="text-xs sm:text-sm font-bold flex items-center gap-1">
                    <span>Fácil</span>
                    <kbd className="hidden sm:inline px-1 text-[10px] bg-blue-500/20 rounded font-mono">4</kbd>
                  </span>
                  <span className="text-[11px] opacity-75 mt-0.5">
                    {formatIntervalEstimate(currentCard, 'easy')}
                  </span>
                </button>
              </div>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
