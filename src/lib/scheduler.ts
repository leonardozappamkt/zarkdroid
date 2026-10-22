import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card as FsrsCard, type Grade } from 'ts-fsrs';
import type { Flashcard, ReviewRating } from '@/types';

/** Cards failed this many times are flagged as "leeches" (they cost a lot of study time). */
export const LEECH_THRESHOLD = 8;

const GRADE: Record<ReviewRating, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

export const RATINGS: ReviewRating[] = ['again', 'hard', 'good', 'easy'];

function scheduler(desiredRetention: number) {
  // Fuzz spreads due dates a little so cards learned together don't always return together.
  return fsrs(generatorParameters({ request_retention: desiredRetention, enable_fuzz: true }));
}

/**
 * Rebuilds the FSRS memory state from our row. Cards created before FSRS only have SM-2 data
 * (interval, ease_factor): stability starts at the current interval, which is how FSRS defines it.
 */
export function toFsrsCard(card: Flashcard, now: Date = new Date()): FsrsCard {
  if (card.state === 'new') return createEmptyCard(now);

  const lapses = card.lapses ?? 0;
  const hasFsrsState = typeof card.stability === 'number' && card.stability > 0;
  const stability = hasFsrsState ? (card.stability as number) : Math.max(1, card.interval || 1);
  const difficulty = hasFsrsState && card.difficulty ? (card.difficulty as number) : 5;
  const state = card.state === 'review' ? State.Review : lapses > 0 ? State.Relearning : State.Learning;

  // Cards from before FSRS have no last-review date: estimate it from due date minus interval,
  // otherwise FSRS thinks the card was just seen and barely grows its interval.
  const dueDate = new Date(card.due_date);
  let lastReview: Date | undefined = card.last_reviewed ? new Date(card.last_reviewed) : undefined;
  if (!lastReview && card.state === 'review' && card.interval > 0) {
    lastReview = new Date(dueDate.getTime() - card.interval * 24 * 3600 * 1000);
  }
  return {
    due: dueDate,
    stability,
    difficulty,
    elapsed_days: 0,
    scheduled_days: card.interval || 0,
    learning_steps: card.learning_steps ?? 0,
    reps: card.repetitions ?? 0,
    lapses,
    state,
    last_review: lastReview,
  };
}

function fromFsrs(next: FsrsCard): Pick<
  Flashcard,
  'state' | 'repetitions' | 'interval' | 'ease_factor' | 'due_date' | 'last_reviewed' | 'stability' | 'difficulty' | 'lapses' | 'learning_steps'
> {
  return {
    state: next.state === State.Review ? 'review' : 'learning',
    repetitions: next.reps,
    interval: next.scheduled_days,
    // Kept so older clients and exports still show a plausible ease; FSRS itself ignores it.
    ease_factor: Number(Math.min(3.5, Math.max(1.3, 3.2 - next.difficulty * 0.2)).toFixed(2)),
    due_date: next.due.toISOString(),
    last_reviewed: next.last_review?.toISOString(),
    stability: Number(next.stability.toFixed(4)),
    difficulty: Number(next.difficulty.toFixed(4)),
    lapses: next.lapses,
    learning_steps: next.learning_steps,
  };
}

/** New scheduling fields for the card after answering `rating`. */
export function applyRating(card: Flashcard, rating: ReviewRating, desiredRetention: number, now: Date = new Date()) {
  const { card: next } = scheduler(desiredRetention).next(toFsrsCard(card, now), now, GRADE[rating]);
  return fromFsrs(next);
}

/** "10 min", "3 d", "2 mo": when the card would come back for each answer button. */
export function previewLabels(card: Flashcard, desiredRetention: number, now: Date = new Date()): Record<ReviewRating, string> {
  const preview = scheduler(desiredRetention).repeat(toFsrsCard(card, now), now);
  const labels = {} as Record<ReviewRating, string>;
  for (const r of RATINGS) labels[r] = formatDelay(preview[GRADE[r]].card.due.getTime() - now.getTime());
  return labels;
}

export function formatDelay(ms: number): string {
  const minutes = Math.max(1, Math.round(ms / 60000));
  if (minutes < 60) return minutes < 2 ? '< 1 min' : `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d`;
  const months = days / 30;
  if (months < 12) return `${months >= 10 ? Math.round(months) : months.toFixed(1).replace('.0', '')} mo`;
  return `${(days / 365).toFixed(1).replace('.0', '')} a`;
}

/** Mature cards: interval of 21+ days (Anki's convention), used in the stats. */
export const isMature = (card: Flashcard) => card.state === 'review' && card.interval >= 21;

export const isLeech = (card: Flashcard) => (card.lapses ?? 0) >= LEECH_THRESHOLD;
