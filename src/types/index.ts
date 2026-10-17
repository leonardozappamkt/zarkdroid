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
}

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
