import type { Flashcard, ReviewLog } from '@/types';
import { studyDayEnd, studyDayKey, studyDayStart } from './settings';
import { isLeech, isMature } from './scheduler';

const DAY_MS = 24 * 3600 * 1000;

export interface Stats {
  todayTotal: number;
  todayNew: number;
  todayCorrectPct: number | null;
  streak: number;
  bestStreak: number;
  retention30: number | null;
  reviewed30: number;
  totalReviews: number;
  /** Study days of the last `weeks` weeks, oldest first; `count` is reviews on that day. */
  heatmap: { key: string; count: number; future: boolean }[];
  /** Cards due on each of the next 14 study days (overdue ones count on day 0). */
  forecast: number[];
  cards: { total: number; new: number; learning: number; young: number; mature: number; leeches: number };
}

export const HEATMAP_WEEKS = 16;

export function computeStats(cards: Flashcard[], logs: ReviewLog[], now: Date = new Date()): Stats {
  const dayStart = studyDayStart(now);
  const perDay = new Map<string, number>();
  for (const log of logs) {
    const key = studyDayKey(new Date(log.reviewed_at));
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }

  // Streak: consecutive study days with at least one review, counting back from today (or yesterday if not studied yet).
  const hasDay = (offset: number) => perDay.has(studyDayKey(new Date(dayStart.getTime() - offset * DAY_MS + 12 * 3600 * 1000)));
  let streak = 0;
  for (let i = hasDay(0) ? 0 : 1; hasDay(i); i++) streak++;

  let bestStreak = 0;
  const keys = [...perDay.keys()].sort();
  let run = 0;
  let prev: number | null = null;
  for (const key of keys) {
    const t = new Date(`${key}T12:00:00`).getTime();
    run = prev !== null && Math.round((t - prev) / DAY_MS) === 1 ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    prev = t;
  }

  const todayLogs = logs.filter((l) => new Date(l.reviewed_at).getTime() >= dayStart.getTime());
  const todayCorrect = todayLogs.filter((l) => l.rating !== 'again').length;

  const since30 = now.getTime() - 30 * DAY_MS;
  const recentReviews = logs.filter((l) => l.state_before === 'review' && new Date(l.reviewed_at).getTime() >= since30);
  const retention30 = recentReviews.length
    ? Math.round((recentReviews.filter((l) => l.rating !== 'again').length / recentReviews.length) * 100)
    : null;

  // Heatmap: the grid ends on the Saturday of the current week, so columns are whole weeks.
  const heatmap: Stats['heatmap'] = [];
  const todayWeekday = dayStart.getDay();
  const gridEnd = new Date(dayStart.getTime() + (6 - todayWeekday) * DAY_MS);
  const totalDays = HEATMAP_WEEKS * 7;
  for (let i = totalDays - 1; i >= 0; i--) {
    const day = new Date(gridEnd.getTime() - i * DAY_MS + 12 * 3600 * 1000);
    heatmap.push({ key: studyDayKey(day), count: perDay.get(studyDayKey(day)) ?? 0, future: day.getTime() > now.getTime() + 12 * 3600 * 1000 });
  }

  const forecast = Array.from({ length: 14 }, () => 0);
  const endToday = studyDayEnd(now).getTime();
  for (const c of cards) {
    if (c.state === 'new') continue;
    const due = new Date(c.due_date).getTime();
    const index = due < endToday ? 0 : Math.floor((due - endToday) / DAY_MS) + 1;
    if (index < forecast.length) forecast[index]++;
  }

  return {
    todayTotal: todayLogs.length,
    todayNew: todayLogs.filter((l) => l.state_before === 'new').length,
    todayCorrectPct: todayLogs.length ? Math.round((todayCorrect / todayLogs.length) * 100) : null,
    streak,
    bestStreak,
    retention30,
    reviewed30: recentReviews.length,
    totalReviews: logs.length,
    heatmap,
    forecast,
    cards: {
      total: cards.length,
      new: cards.filter((c) => c.state === 'new').length,
      learning: cards.filter((c) => c.state === 'learning').length,
      young: cards.filter((c) => c.state === 'review' && !isMature(c)).length,
      mature: cards.filter(isMature).length,
      leeches: cards.filter(isLeech).length,
    },
  };
}
