import { StudyMode, StudySettings } from '@/types';

const KEY = 'zarkdroid_study_settings';

export const DEFAULT_STUDY_SETTINGS: StudySettings = {
  newPerDay: 20,
  reviewsPerDay: 200,
  desiredRetention: 0.9,
  mode: 'flip',
  reverse: false,
  dailyGoal: 30,
};

const MODES: StudyMode[] = ['flip', 'type', 'listen', 'speak'];

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function sanitizeSettings(raw: Partial<StudySettings>): StudySettings {
  const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
  return {
    newPerDay: Math.round(clamp(num(raw.newPerDay, DEFAULT_STUDY_SETTINGS.newPerDay), 0, 999)),
    reviewsPerDay: Math.round(clamp(num(raw.reviewsPerDay, DEFAULT_STUDY_SETTINGS.reviewsPerDay), 0, 9999)),
    desiredRetention: clamp(num(raw.desiredRetention, DEFAULT_STUDY_SETTINGS.desiredRetention), 0.7, 0.97),
    mode: MODES.includes(raw.mode as StudyMode) ? (raw.mode as StudyMode) : DEFAULT_STUDY_SETTINGS.mode,
    reverse: raw.reverse === true,
    dailyGoal: Math.round(clamp(num(raw.dailyGoal, DEFAULT_STUDY_SETTINGS.dailyGoal), 1, 9999)),
  };
}

export function getStudySettings(): StudySettings {
  if (typeof window === 'undefined') return DEFAULT_STUDY_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    return sanitizeSettings(raw ? JSON.parse(raw) : {});
  } catch {
    return DEFAULT_STUDY_SETTINGS;
  }
}

export function saveStudySettings(settings: StudySettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(sanitizeSettings(settings)));
  } catch {
    /* storage blocked: settings just won't persist */
  }
}

/** The study day rolls over at 4am local time (like Anki), so late-night sessions count for the same day. */
const ROLLOVER_HOUR = 4;

export function studyDayStart(now: Date = new Date()): Date {
  const start = new Date(now);
  start.setHours(ROLLOVER_HOUR, 0, 0, 0);
  if (now.getTime() < start.getTime()) start.setDate(start.getDate() - 1);
  return start;
}

export function studyDayEnd(now: Date = new Date()): Date {
  const end = studyDayStart(now);
  end.setDate(end.getDate() + 1);
  return end;
}

/** Local calendar key (YYYY-MM-DD) of the study day a timestamp belongs to. */
export function studyDayKey(date: Date): string {
  const shifted = new Date(date.getTime() - ROLLOVER_HOUR * 3600 * 1000);
  const y = shifted.getFullYear();
  const m = String(shifted.getMonth() + 1).padStart(2, '0');
  const d = String(shifted.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
