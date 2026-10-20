'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Flashcard, Deck, ReviewRating, StudySessionStats } from '@/types';
import { storage } from '@/lib/storage';
import { calculateNextReview, formatIntervalEstimate } from '@/lib/srs';

interface StudyPageProps {
  params: Promise<{ deckId: string }>;
}

export default function StudyPage({ params }: StudyPageProps) {
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
      <div className="flex min-h-screen items-center justify-center text-sm text-mute">
        Carregando…
      </div>
    );
  }

  const remaining = queue.slice(currentIndex);
  const counts = [
    { label: 'novos', value: remaining.filter((c) => c.state === 'new').length },
    { label: 'aprender', value: remaining.filter((c) => c.state === 'learning').length },
    { label: 'revisar', value: remaining.filter((c) => c.state === 'review').length },
  ];
  const progressPercentage = queue.length > 0 ? Math.round((currentIndex / queue.length) * 100) : 100;

  const ratings: { key: ReviewRating; label: string; hotkey: string }[] = [
    { key: 'again', label: 'Errei', hotkey: '1' },
    { key: 'hard', label: 'Difícil', hotkey: '2' },
    { key: 'good', label: 'Bom', hotkey: '3' },
    { key: 'easy', label: 'Fácil', hotkey: '4' },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Link href="/" aria-label="Voltar" className="rounded-full p-2 text-mute hover:bg-soft hover:text-ink">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold">{deck.title}</h1>
              <p className="font-mono text-xs text-mute">
                {Math.min(currentIndex + 1, queue.length)} / {queue.length}
              </p>
            </div>
          </div>

          <dl className="flex gap-4 font-mono text-xs">
            {counts.map((c) => (
              <div key={c.label} className="text-center" title={c.label}>
                <dd className="font-semibold tabular-nums">{c.value}</dd>
                <dt className="text-[9px] uppercase tracking-wider text-mute">{c.label}</dt>
              </div>
            ))}
          </dl>
        </div>
        <div className="h-px w-full bg-line">
          <div className="h-px bg-ink transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-8">
        {!isFinished && currentCard ? (
          <div className="card animate-fade-in flex min-h-[360px] flex-col justify-between p-6 sm:p-10">
            <div className="flex items-center justify-between text-xs text-mute">
              <span className="uppercase tracking-wider">
                {currentCard.state === 'new' ? 'Novo' : currentCard.state === 'learning' ? 'Aprendendo' : 'Revisão'}
              </span>
              {currentCard.tags && currentCard.tags.length > 0 && (
                <div className="flex flex-wrap justify-end gap-1.5">
                  {currentCard.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-line px-2 py-0.5 text-[11px]">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="py-8 text-center text-3xl font-semibold leading-snug tracking-tight sm:text-4xl">
              {currentCard.front}
            </div>

            {showAnswer ? (
              <div className="animate-slide-up space-y-3 border-t border-line pt-6 text-center">
                <div className="text-xl text-ink sm:text-2xl">{currentCard.back}</div>
                {currentCard.extra && <p className="text-sm italic text-mute">{currentCard.extra}</p>}
              </div>
            ) : (
              <p className="text-center text-xs text-mute">
                Pressione <kbd className="rounded border border-line px-1.5 py-0.5 font-mono">espaço</kbd> para ver a resposta
              </p>
            )}
          </div>
        ) : (
          <div className="card mx-auto w-full max-w-md animate-fade-in space-y-8 p-10 text-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">Tudo revisado.</h2>
              <p className="text-sm text-mute">Você terminou os cards de hoje deste baralho.</p>
            </div>

            <dl className="grid grid-cols-4 gap-px overflow-hidden rounded-xl border border-line bg-line">
              {ratings.map((r) => (
                <div key={r.key} className="bg-paper py-3">
                  <dd className="font-mono text-xl font-semibold tabular-nums">{stats[r.key]}</dd>
                  <dt className="text-[10px] uppercase tracking-wider text-mute">{r.label}</dt>
                </div>
              ))}
            </dl>

            <div className="flex flex-col justify-center gap-2 sm:flex-row">
              <Link href="/" className="btn-primary">
                Voltar aos baralhos
              </Link>
              <Link href={`/deck/${deck.id}`} className="btn-outline">
                Gerenciar
              </Link>
            </div>
          </div>
        )}
      </main>

      {!isFinished && currentCard && (
        <footer className="sticky bottom-0 z-20 border-t border-line bg-paper/90 p-4 backdrop-blur-md">
          <div className="mx-auto max-w-3xl">
            {!showAnswer ? (
              <button onClick={() => setShowAnswer(true)} className="btn-primary w-full py-3.5 text-base">
                Mostrar resposta
              </button>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {ratings.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => handleRating(r.key)}
                    className={`flex flex-col items-center rounded-2xl border px-2 py-2.5 transition-colors ${
                      r.key === 'good'
                        ? 'border-ink bg-ink text-paper hover:opacity-85'
                        : 'border-line hover:border-ink'
                    }`}
                  >
                    <span className="text-sm font-medium">
                      {r.label} <kbd className="hidden font-mono text-[10px] opacity-50 sm:inline">{r.hotkey}</kbd>
                    </span>
                    <span className="mt-0.5 font-mono text-[11px] opacity-60">
                      {formatIntervalEstimate(currentCard, r.key)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
