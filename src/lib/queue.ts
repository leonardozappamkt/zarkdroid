import type { Flashcard, ReviewLog, StudySettings } from '@/types';
import { studyDayEnd, studyDayStart } from './settings';

/** Learning cards due within this window are shown early when nothing else is left (Anki's "learn ahead"). */
export const LEARN_AHEAD_MS = 20 * 60 * 1000;

export interface QueueOptions {
  /** Extra new cards allowed beyond today's limit ("Estudar mais"). */
  extraNew?: number;
}

export interface QueueCounts {
  new: number;
  learning: number;
  review: number;
}

/** What was already studied today (new cards introduced and review-state answers), from the review log. */
export function doneToday(logs: ReviewLog[], deckId?: string, now: Date = new Date()) {
  const start = studyDayStart(now).getTime();
  let newDone = 0;
  let reviewsDone = 0;
  for (const log of logs) {
    if (deckId && log.deck_id !== deckId) continue;
    if (new Date(log.reviewed_at).getTime() < start) continue;
    if (log.state_before === 'new') newDone++;
    else if (log.state_before === 'review') reviewsDone++;
  }
  return { newDone, reviewsDone };
}

/**
 * Cards to study now, in order: learning cards that are due, reviews due today (oldest first, capped by the
 * daily review limit), new cards (capped by the daily new limit), then learning cards due within the next
 * 20 minutes so a session never stalls just because a card is "almost" due.
 */
export function buildQueue(
  cards: Flashcard[],
  settings: StudySettings,
  logs: ReviewLog[],
  now: Date = new Date(),
  options: QueueOptions = {},
  deckId?: string,
): Flashcard[] {
  const pool = deckId ? cards.filter((c) => c.deck_id === deckId) : cards;
  const nowMs = now.getTime();
  const dayEndMs = studyDayEnd(now).getTime();
  const { newDone, reviewsDone } = doneToday(logs, deckId, now);

  const byDue = (a: Flashcard, b: Flashcard) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime();

  const learning = pool.filter((c) => c.state === 'learning');
  const learningDue = learning.filter((c) => new Date(c.due_date).getTime() <= nowMs).sort(byDue);
  const learningSoon = learning
    .filter((c) => {
      const due = new Date(c.due_date).getTime();
      return due > nowMs && due <= nowMs + LEARN_AHEAD_MS;
    })
    .sort(byDue);

  const reviewLimit = Math.max(0, settings.reviewsPerDay - reviewsDone);
  const reviews = pool
    .filter((c) => c.state === 'review' && new Date(c.due_date).getTime() < dayEndMs)
    .sort(byDue)
    .slice(0, reviewLimit);

  const newLimit = Math.max(0, settings.newPerDay - newDone) + (options.extraNew ?? 0);
  const fresh = pool
    .filter((c) => c.state === 'new')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(0, newLimit);

  return [...learningDue, ...reviews, ...fresh, ...learningSoon];
}

export function queueCounts(queue: Flashcard[]): QueueCounts {
  return {
    new: queue.filter((c) => c.state === 'new').length,
    learning: queue.filter((c) => c.state === 'learning').length,
    review: queue.filter((c) => c.state === 'review').length,
  };
}

/** New cards still unseen in the pool (to offer "Estudar mais" when the daily limit is reached). */
export function remainingNew(cards: Flashcard[], deckId?: string): number {
  return cards.filter((c) => c.state === 'new' && (!deckId || c.deck_id === deckId)).length;
}

/** Earliest future due date among cards already started, for the "Próxima revisão" message. */
export function nextDueAt(cards: Flashcard[], now: Date = new Date()): Date | null {
  let best: number | null = null;
  for (const c of cards) {
    if (c.state === 'new') continue;
    const due = new Date(c.due_date).getTime();
    if (due > now.getTime() && (best === null || due < best)) best = due;
  }
  return best === null ? null : new Date(best);
}
