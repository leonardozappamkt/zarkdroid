export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface Flashcard {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  extra?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  // SRS (Spaced Repetition System) fields
  state: 'new' | 'learning' | 'review';
  repetitions: number;
  interval: number; // in days
  ease_factor: number; // starting around 2.5
  due_date: string; // ISO date
  last_reviewed?: string;
  // FSRS memory state. Missing on cards created before FSRS: the scheduler derives it from interval/ease_factor.
  stability?: number;
  difficulty?: number;
  lapses?: number;
  learning_steps?: number;
}

/** One answered review, kept for daily limits, undo and the stats page. */
export interface ReviewLog {
  id: string;
  card_id: string;
  deck_id: string;
  rating: ReviewRating;
  state_before: Flashcard['state'];
  reviewed_at: string; // ISO date
  scheduled_days: number;
  stability: number;
  difficulty: number;
}

/** Per-device study preferences (Settings → Estudo). */
export interface StudySettings {
  newPerDay: number;
  reviewsPerDay: number;
  /** FSRS target recall probability at review time (0.8–0.97). */
  desiredRetention: number;
  /** How cards are answered: flip (reveal), type the answer, listen and type (dictation) or say it aloud. */
  mode: StudyMode;
  /** Show the back as the prompt and ask for the front. */
  reverse: boolean;
  /** Reviews per day that fill the progress bar on the home screen. */
  dailyGoal: number;
}

export type StudyMode = 'flip' | 'type' | 'listen' | 'speak';

export interface Deck {
  id: string;
  title: string;
  description: string;
  color?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
  total_cards: number;
  new_count: number;
  learn_count: number;
  due_count: number;
}

export interface StudySessionStats {
  again: number;
  hard: number;
  good: number;
  easy: number;
  total: number;
  startTime: number;
  endTime?: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}
