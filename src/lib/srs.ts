import { Flashcard, ReviewRating } from '@/types';

/**
 * Anki / SM-2 spaced repetition algorithm implementation
 */
export function calculateNextReview(card: Flashcard, rating: ReviewRating): Partial<Flashcard> {
  let { repetitions, interval, ease_factor, state } = card;
  const now = new Date();

  // Ensure baseline ease factor
  if (!ease_factor || ease_factor < 1.3) {
    ease_factor = 2.5;
  }

  let nextInterval = 1;
  let nextState: 'new' | 'learning' | 'review' = state;

  switch (rating) {
    case 'again':
      // Reset repetitions on failure
      repetitions = 0;
      nextInterval = 0; // due immediately/today (e.g. 10 minutes or same day)
      nextState = 'learning';
      ease_factor = Math.max(1.3, ease_factor - 0.2);
      break;

    case 'hard':
      repetitions += 1;
      nextInterval = Math.max(1, Math.round(interval * 1.2));
      ease_factor = Math.max(1.3, ease_factor - 0.15);
      nextState = 'review';
      break;

    case 'good':
      repetitions += 1;
      if (repetitions === 1) {
        nextInterval = 1;
      } else if (repetitions === 2) {
        nextInterval = 3;
      } else {
        nextInterval = Math.round(interval * ease_factor);
      }
      nextState = 'review';
      break;

    case 'easy':
      repetitions += 1;
      if (repetitions === 1) {
        nextInterval = 4;
      } else if (repetitions === 2) {
        nextInterval = 7;
      } else {
        nextInterval = Math.round(interval * ease_factor * 1.3);
      }
      ease_factor += 0.15;
      nextState = 'review';
      break;
  }

  // Calculate new due date
  const nextDueDate = new Date(now.getTime() + nextInterval * 24 * 60 * 60 * 1000);

  return {
    repetitions,
    interval: nextInterval,
    ease_factor: Number(ease_factor.toFixed(2)),
    state: nextState,
    due_date: nextDueDate.toISOString(),
    last_reviewed: now.toISOString(),
    updated_at: now.toISOString(),
  };
}

export function formatIntervalEstimate(card: Flashcard, rating: ReviewRating): string {
  const currentInterval = card.interval || 0;
  const ease = card.ease_factor || 2.5;

  switch (rating) {
    case 'again':
      return '< 1 min';
    case 'hard':
      return currentInterval <= 1 ? '12 h' : `${Math.max(1, Math.round(currentInterval * 1.2))} d`;
    case 'good':
      if (card.repetitions === 0) return '1 d';
      if (card.repetitions === 1) return '3 d';
      return `${Math.round(currentInterval * ease)} d`;
    case 'easy':
      if (card.repetitions === 0) return '4 d';
      if (card.repetitions === 1) return '7 d';
      return `${Math.round(currentInterval * ease * 1.3)} d`;
  }
}
