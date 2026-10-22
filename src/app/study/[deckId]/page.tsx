'use client';

import React, { useEffect, useMemo, useRef, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mic, Undo2, Volume2, VolumeX, ArrowLeftRight } from 'lucide-react';
import { Flashcard, Deck, ReviewRating, ReviewLog, StudyMode, StudySettings } from '@/types';
import { storage } from '@/lib/storage';
import { applyRating, previewLabels, formatDelay, isLeech, LEECH_THRESHOLD, RATINGS } from '@/lib/scheduler';
import { buildQueue, nextDueAt, queueCounts, remainingNew } from '@/lib/queue';
import { DEFAULT_STUDY_SETTINGS, getStudySettings, saveStudySettings } from '@/lib/settings';
import { matchAnswer, matchAnyAnswer, suggestedRating, type AnswerMatch } from '@/lib/answer';
import { hasCloze, renderCloze } from '@/lib/cloze';
import { canRecognize, listenOnce, stopListening } from '@/lib/recognition';
import RichText from '@/components/RichText';
import { canSpeak, getAutoSpeak, setAutoSpeak, speak, stopSpeaking } from '@/lib/speech';

interface StudyPageProps {
  params: Promise<{ deckId: string }>;
}

type UndoEntry = { before: Flashcard; logId: string; rating: ReviewRating };

const MODE_OPTIONS: { value: StudyMode; label: string }[] = [
  { value: 'flip', label: 'Virar' },
  { value: 'type', label: 'Digitar' },
  { value: 'listen', label: 'Ouvir' },
  { value: 'speak', label: 'Falar' },
];

const RATING_LABEL: Record<ReviewRating, { label: string; hotkey: string; style: string }> = {
  again: {
    label: 'Errei',
    hotkey: '1',
    style: 'border-red-500/30 bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400',
  },
  hard: {
    label: 'Difícil',
    hotkey: '2',
    style: 'border-amber-500/30 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400',
  },
  good: {
    label: 'Bom',
    hotkey: '3',
    style: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400',
  },
  easy: {
    label: 'Fácil',
    hotkey: '4',
    style: 'border-sky-500/30 bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 dark:text-sky-400',
  },
};

export default function StudyPage({ params }: StudyPageProps) {
  const { deckId } = use(params);

  const [deck, setDeck] = useState<Deck | null>(null);
  const [settings, setSettings] = useState<StudySettings>(DEFAULT_STUDY_SETTINGS);
  const [ready, setReady] = useState(false);
  // Bumped after every change to cards/logs so derived data is recomputed from storage.
  const [version, setVersion] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [extraNew, setExtraNew] = useState(0);
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [forcedId, setForcedId] = useState<string | null>(null);
  const [leechNotice, setLeechNotice] = useState(false);
  const [initialTotal, setInitialTotal] = useState<number | null>(null);
  const [session, setSession] = useState({ again: 0, hard: 0, good: 0, easy: 0, total: 0 });
  const [autoSpeak, setAutoSpeakState] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [recognitionAvailable, setRecognitionAvailable] = useState(false);
  const [typed, setTyped] = useState('');
  const [checked, setChecked] = useState<AnswerMatch | null>(null);
  const [heard, setHeard] = useState('');
  const [listening, setListening] = useState(false);
  const [speakError, setSpeakError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDeck(storage.getDecks().find((d) => d.id === deckId) ?? null);
    setSettings(getStudySettings());
    setSpeechAvailable(canSpeak());
    setRecognitionAvailable(canRecognize());
    setAutoSpeakState(getAutoSpeak());
    setReady(true);
    return () => {
      stopSpeaking();
      stopListening();
    };
  }, [deckId]);

  const cards = useMemo(() => (ready ? storage.getCards(deckId) : []), [ready, deckId, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const queue = useMemo(
    () => (ready ? buildQueue(cards, settings, storage.getReviewLogs(), new Date(), { extraNew }, deckId) : []),
    [ready, cards, settings, extraNew, deckId],
  );

  const forcedCard = forcedId ? cards.find((c) => c.id === forcedId) : undefined;
  const currentCard = forcedCard ?? queue[0];
  const isFinished = ready && !currentCard;

  // Which way this card is answered. Cloze cards always use the fill-in-the-blank flip view.
  const isCloze = !!currentCard && hasCloze(currentCard.front);
  const wanted: StudyMode = settings.mode;
  const mode: StudyMode = isCloze || (wanted === 'speak' && !recognitionAvailable) ? ('flip' as StudyMode) : wanted;
  const reverse = settings.reverse && (mode === 'flip' || mode === 'type') && !isCloze;
  // Text the typed/spoken answer is compared with: the English side for listen/speak, otherwise the hidden side.
  const expected = !currentCard ? '' : mode === 'listen' || mode === 'speak' ? currentCard.front : reverse ? currentCard.front : currentCard.back;
  // The front is the answer (so it must not be spoken before reveal) in these cases.
  const frontIsAnswer = mode === 'speak' || reverse;

  useEffect(() => {
    if (ready && initialTotal === null) setInitialTotal(queue.length);
  }, [ready, initialTotal, queue.length]);

  const labels = useMemo(
    () => (currentCard ? previewLabels(currentCard, settings.desiredRetention) : null),
    [currentCard?.id, settings.desiredRetention], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Fresh input for every card shown (also when the same card comes back after "Errei", hence `version`).
  useEffect(() => {
    setTyped('');
    setChecked(null);
    setHeard('');
    setSpeakError('');
    stopListening();
  }, [currentCard?.id, version]);

  // Speak the word when a card appears; dictation always does. When the front is the answer, speak it on reveal instead.
  useEffect(() => {
    if (!currentCard || isFinished) return;
    if (mode === 'listen') speak(currentCard.front);
    else if (autoSpeak && !frontIsAnswer) speak(currentCard.front);
  }, [autoSpeak, currentCard?.id, version, isFinished, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (showAnswer && currentCard && autoSpeak && frontIsAnswer) speak(currentCard.front);
  }, [showAnswer]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeSettings = (patch: Partial<StudySettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveStudySettings(next);
  };

  const submitTyped = () => {
    if (!currentCard || checked || !typed.trim()) return;
    setChecked(matchAnswer(typed, expected));
    setShowAnswer(true);
    inputRef.current?.blur();
  };

  const giveUp = () => {
    if (!currentCard) return;
    setChecked({ result: 'wrong', expected: matchAnswer('', expected).expected });
    setShowAnswer(true);
    inputRef.current?.blur();
  };

  const startSpeaking = async () => {
    if (!currentCard || listening || checked) return;
    setSpeakError('');
    setListening(true);
    try {
      const alternatives = await listenOnce('en-US');
      setHeard(alternatives[0]);
      setChecked(matchAnyAnswer(alternatives, expected));
      setShowAnswer(true);
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      setSpeakError(code === 'not-allowed' ? 'Permita o microfone para praticar a fala.' : 'Não ouvi nada. Tente de novo.');
    } finally {
      setListening(false);
    }
  };

  const suggested = checked ? suggestedRating(checked.result) : null;

  const toggleAutoSpeak = () => {
    const next = !autoSpeak;
    setAutoSpeakState(next);
    setAutoSpeak(next);
    if (!next) stopSpeaking();
  };

  const handleRating = (rating: ReviewRating) => {
    if (!currentCard) return;
    const now = new Date();
    const fields = applyRating(currentCard, rating, settings.desiredRetention, now);
    let updated: Flashcard = { ...currentCard, ...fields, updated_at: now.toISOString() };

    const becameLeech = !isLeech(currentCard) && isLeech(updated);
    if (becameLeech && !(updated.tags ?? []).includes('leech')) {
      updated = { ...updated, tags: [...(updated.tags ?? []), 'leech'] };
    }

    const log: ReviewLog = {
      id: `log-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
      card_id: currentCard.id,
      deck_id: currentCard.deck_id,
      rating,
      state_before: currentCard.state,
      reviewed_at: now.toISOString(),
      scheduled_days: fields.interval,
      stability: fields.stability ?? 0,
      difficulty: fields.difficulty ?? 0,
    };

    storage.updateCard(updated);
    storage.addReviewLog(log);

    setUndoStack((stack) => [...stack.slice(-19), { before: currentCard, logId: log.id, rating }]);
    setSession((s) => ({ ...s, [rating]: s[rating] + 1, total: s.total + 1 }));
    setLeechNotice(becameLeech);
    setForcedId(null);
    setShowAnswer(false);
    setVersion((v) => v + 1);
  };

  const handleUndo = () => {
    const entry = undoStack[undoStack.length - 1];
    if (!entry) return;
    storage.updateCard(entry.before);
    storage.removeReviewLog(entry.logId);
    setUndoStack((stack) => stack.slice(0, -1));
    setSession((s) => ({ ...s, [entry.rating]: Math.max(0, s[entry.rating] - 1), total: Math.max(0, s.total - 1) }));
    setForcedId(entry.before.id);
    setShowAnswer(false);
    setLeechNotice(false);
    setVersion((v) => v + 1);
  };

  // Keyboard shortcuts.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if ((e.key === 'z' || e.key === 'Z') && undoStack.length > 0) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (isFinished || !currentCard) return;

      if (!showAnswer) {
        // Typed/dictation/speech modes need an answer first; only the classic flip reveals with space.
        if (mode === 'flip' && (e.code === 'Space' || e.code === 'Enter')) {
          e.preventDefault();
          setShowAnswer(true);
        }
        return;
      }
      const byKey: Record<string, ReviewRating> = { '1': 'again', '2': 'hard', '3': 'good', '4': 'easy' };
      if (byKey[e.key]) {
        e.preventDefault();
        handleRating(byKey[e.key]);
      } else if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleRating(suggested ?? 'good');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }); // re-bound every render so it always sees the latest card and state

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-mute">Carregando…</div>;
  }

  if (!deck) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-sm text-mute">
        <p>Baralho não encontrado.</p>
        <Link href="/" className="btn-outline">
          Voltar
        </Link>
      </div>
    );
  }

  const counts = queueCounts(queue);
  const remaining = queue.length;
  const total = Math.max(initialTotal ?? 0, session.total + remaining, 1);
  const progressPercentage = Math.round((session.total / total) * 100);
  const headerCounts = [
    { label: 'novos', value: counts.new },
    { label: 'aprender', value: counts.learning },
    { label: 'revisar', value: counts.review },
  ];

  const moreNew = remainingNew(cards, deckId);
  const nextDue = isFinished ? nextDueAt(cards) : null;

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
                {session.total} feitos · {remaining} restantes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              title="Desfazer (Z)"
              aria-label="Desfazer a última resposta"
              className="rounded-full p-2 text-mute hover:bg-soft hover:text-ink disabled:opacity-30"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            {speechAvailable && (
              <button
                onClick={toggleAutoSpeak}
                aria-pressed={autoSpeak}
                title={autoSpeak ? 'Voz automática ligada' : 'Voz automática desligada'}
                className={`rounded-full p-2 hover:bg-soft ${autoSpeak ? 'text-ink' : 'text-mute'}`}
              >
                {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
            )}
            <dl className="flex gap-3 font-mono text-xs sm:gap-4">
              {headerCounts.map((c) => (
                <div key={c.label} className="text-center" title={c.label}>
                  <dd className="font-semibold tabular-nums">{c.value}</dd>
                  <dt className="text-[9px] uppercase tracking-wider text-mute">{c.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <div className="mx-auto flex max-w-3xl items-center gap-1.5 overflow-x-auto px-4 pb-2.5 text-xs">
          {MODE_OPTIONS.filter((m) => m.value !== 'speak' || recognitionAvailable).map((m) => (
            <button
              key={m.value}
              onClick={() => changeSettings({ mode: m.value })}
              aria-pressed={settings.mode === m.value}
              className={`whitespace-nowrap rounded-full border px-3 py-1 transition-colors ${
                settings.mode === m.value ? 'border-ink bg-ink text-paper' : 'border-line text-mute hover:text-ink'
              }`}
            >
              {m.label}
            </button>
          ))}
          <button
            onClick={() => changeSettings({ reverse: !settings.reverse })}
            aria-pressed={settings.reverse}
            title="Mostrar o verso e pedir a frente"
            className={`ml-auto flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 transition-colors ${
              settings.reverse ? 'border-ink bg-ink text-paper' : 'border-line text-mute hover:text-ink'
            }`}
          >
            <ArrowLeftRight className="h-3 w-3" />
            Inverter
          </button>
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

            {/* Prompt */}
            <div className="flex flex-col items-center gap-3 py-8">
              {mode === 'listen' ? (
                <>
                  <button
                    onClick={() => speak(currentCard.front)}
                    aria-label="Ouvir de novo"
                    className="flex h-20 w-20 items-center justify-center rounded-full border border-ink text-ink hover:bg-soft"
                  >
                    <Volume2 className="h-8 w-8" />
                  </button>
                  <p className="text-sm text-mute">Ouça e digite o que você escutou.</p>
                </>
              ) : (
                <>
                  <div className="w-full text-center text-3xl font-semibold leading-snug tracking-tight sm:text-4xl">
                    <RichText>
                      {isCloze
                        ? renderCloze(currentCard.front, showAnswer)
                        : mode === 'speak'
                          ? currentCard.back
                          : reverse
                            ? currentCard.back
                            : currentCard.front}
                    </RichText>
                  </div>
                  {speechAvailable && !isCloze && (!frontIsAnswer || showAnswer) && mode !== 'speak' && (
                    <button
                      onClick={() => speak(currentCard.front)}
                      aria-label="Ouvir pronúncia"
                      title="Ouvir pronúncia"
                      className="rounded-full border border-line p-2.5 text-mute hover:border-ink hover:text-ink"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  )}
                </>
              )}
              {mode === 'speak' && !showAnswer && <p className="text-sm text-mute">Diga a palavra em inglês.</p>}
            </div>

            {/* Typed / dictation input */}
            {(mode === 'type' || mode === 'listen') && !showAnswer && (
              <input
                key={`${currentCard.id}-${version}`}
                ref={inputRef}
                autoFocus
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submitTyped();
                  }
                }}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder={mode === 'listen' ? 'Digite o que ouviu' : 'Digite a resposta'}
                className="field mb-2 text-center text-lg"
              />
            )}

            {/* Result of the check */}
            {checked && (
              <div role="status" className="mb-4 space-y-1 rounded-xl border border-line bg-soft px-4 py-3 text-center text-sm">
                <p className="font-medium">
                  {checked.result === 'correct' ? 'Correto' : checked.result === 'close' ? 'Quase' : 'Não foi dessa vez'}
                </p>
                {(typed || heard) && (
                  <p className="text-mute">
                    {mode === 'speak' ? 'Você disse' : 'Você digitou'}: <span className="font-mono text-ink">{heard || typed}</span>
                  </p>
                )}
                {checked.result !== 'correct' && (
                  <p className="text-mute">
                    Resposta: <span className="font-mono text-ink">{checked.expected}</span>
                  </p>
                )}
              </div>
            )}

            {speakError && <p className="mb-3 text-center text-xs text-mute">{speakError}</p>}

            {/* Answer */}
            {showAnswer ? (
              <div className="animate-slide-up space-y-3 border-t border-line pt-6 text-center">
                {isCloze ? (
                  currentCard.back && currentCard.back !== '…' && <div className="text-lg text-ink"><RichText>{currentCard.back}</RichText></div>
                ) : mode === 'listen' || mode === 'speak' ? (
                  <div className="text-xl text-ink sm:text-2xl">
                    <RichText>{mode === 'listen' ? `**${currentCard.front}**\n\n${currentCard.back}` : `**${currentCard.front}**`}</RichText>
                  </div>
                ) : (
                  <div className="text-xl text-ink sm:text-2xl">
                    <RichText>{reverse ? currentCard.front : currentCard.back}</RichText>
                  </div>
                )}
                {currentCard.extra && <div className="text-sm italic text-mute"><RichText>{currentCard.extra}</RichText></div>}
              </div>
            ) : mode === 'flip' ? (
              <p className="text-center text-xs text-mute">
                Pressione <kbd className="rounded border border-line px-1.5 py-0.5 font-mono">espaço</kbd> para ver a resposta
              </p>
            ) : null}

            {leechNotice && (
              <p role="status" className="mt-4 rounded-xl border border-line bg-soft px-3.5 py-2.5 text-center text-xs text-mute">
                O card anterior foi errado {LEECH_THRESHOLD} vezes e ganhou a tag “leech”. Vale reescrevê-lo ou criar uma dica melhor.
              </p>
            )}
          </div>
        ) : (
          <div className="card mx-auto w-full max-w-md animate-fade-in space-y-8 p-10 text-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                {session.total > 0 ? 'Tudo revisado.' : 'Nada para estudar agora.'}
              </h2>
              <p className="text-sm text-mute">
                {session.total > 0
                  ? 'Você terminou os cards de hoje deste baralho.'
                  : cards.length === 0
                    ? 'Este baralho ainda não tem cards.'
                    : 'Os cards deste baralho estão em dia ou o limite diário foi atingido.'}
              </p>
              {nextDue && (
                <p className="font-mono text-xs text-mute">
                  Próxima revisão em {formatDelay(nextDue.getTime() - Date.now())}
                </p>
              )}
            </div>

            {session.total > 0 && (
              <dl className="grid grid-cols-4 gap-px overflow-hidden rounded-xl border border-line bg-line">
                {RATINGS.map((r) => (
                  <div key={r} className="bg-paper py-3">
                    <dd className="font-mono text-xl font-semibold tabular-nums">{session[r]}</dd>
                    <dt className="text-[10px] uppercase tracking-wider text-mute">{RATING_LABEL[r].label}</dt>
                  </div>
                ))}
              </dl>
            )}

            <div className="flex flex-col justify-center gap-2 sm:flex-row">
              {moreNew > 0 && (
                <button onClick={() => setExtraNew((n) => n + 10)} className="btn-outline">
                  Estudar mais 10 novos
                </button>
              )}
              <Link href="/" className="btn-primary">
                Voltar aos baralhos
              </Link>
              <Link href="/stats" className="btn-outline">
                Estatísticas
              </Link>
            </div>
          </div>
        )}
      </main>

      {!isFinished && currentCard && (
        <footer className="sticky bottom-0 z-20 border-t border-line bg-paper/90 p-4 backdrop-blur-md">
          <div className="mx-auto max-w-3xl">
            {!showAnswer ? (
              mode === 'flip' ? (
                <button onClick={() => setShowAnswer(true)} className="btn-primary w-full py-3.5 text-base">
                  Mostrar resposta
                </button>
              ) : mode === 'speak' ? (
                <div className="flex gap-2">
                  <button onClick={giveUp} className="btn-outline py-3.5">
                    Ver resposta
                  </button>
                  <button onClick={startSpeaking} disabled={listening} className="btn-primary flex-1 py-3.5 text-base">
                    <Mic className="h-5 w-5" />
                    {listening ? 'Ouvindo…' : 'Falar'}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={giveUp} className="btn-outline py-3.5">
                    Não sei
                  </button>
                  <button onClick={submitTyped} disabled={!typed.trim()} className="btn-primary flex-1 py-3.5 text-base">
                    Verificar
                  </button>
                </div>
              )
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {RATINGS.map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRating(r)}
                    className={`flex flex-col items-center rounded-2xl border px-2 py-2.5 transition-colors ${RATING_LABEL[r].style} ${suggested === r ? 'ring-2 ring-ink' : ''}`}
                  >
                    <span className="text-sm font-medium">
                      {RATING_LABEL[r].label}{' '}
                      <kbd className="hidden font-mono text-[10px] opacity-50 sm:inline">{RATING_LABEL[r].hotkey}</kbd>
                    </span>
                    <span className="mt-0.5 font-mono text-[11px] opacity-60">{labels?.[r]}</span>
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
