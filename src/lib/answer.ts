export type AnswerResult = 'correct' | 'close' | 'wrong';

export interface AnswerMatch {
  result: AnswerResult;
  /** The accepted answer that was closest to what the user typed (shown when they miss). */
  expected: string;
}

/** Lowercase, no accents/punctuation/parentheses, single spaces. Keeps letters and digits of any script. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^\p{L}\p{N}'\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "to give up" and "give up" are the same answer; so are "o gato" and "gato". */
const LEADING_WORDS = /^(to|a|an|the|o|a|os|as|um|uma)\s+/;

function canonical(text: string): string {
  const n = normalize(text);
  const stripped = n.replace(LEADING_WORDS, '');
  return stripped || n;
}

/** Splits "ser, estar" / "dar; entregar" / "ele ou ela" into the answers that are all acceptable. */
export function alternatives(expected: string): string[] {
  const parts = expected
    .split(/[,;/\n]|\s+ou\s+|\s+or\s+/i)
    .map((p) => p.trim())
    .filter(Boolean);
  const all = parts.length > 1 ? [expected, ...parts] : [expected];
  return [...new Set(all.map((a) => a.trim()).filter(Boolean))];
}

/** Edit distance where swapping two neighbouring letters ("recieve") counts as a single typo. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

/** How many typos are forgiven for an answer of this length. */
function allowedTypos(length: number): number {
  if (length <= 3) return 0;
  if (length <= 8) return 1;
  return 2;
}

/**
 * Compares what the user typed (or said) with the card's answer. Any listed alternative counts;
 * a small typo gives "close" so the user can still be told the correct spelling.
 */
export function matchAnswer(typed: string, expected: string): AnswerMatch {
  const typedKey = canonical(typed);
  const alts = alternatives(expected);
  if (!typedKey) return { result: 'wrong', expected: alts[0] ?? expected };

  let best: { alt: string; distance: number; allowed: number } | null = null;
  for (const alt of alts) {
    const key = canonical(alt);
    if (!key) continue;
    if (key === typedKey) return { result: 'correct', expected: alt };
    const distance = levenshtein(typedKey, key);
    const allowed = allowedTypos(key.length);
    if (!best || distance - allowed < best.distance - best.allowed) best = { alt, distance, allowed };
  }
  if (best && best.distance <= best.allowed) return { result: 'close', expected: best.alt };
  return { result: 'wrong', expected: best?.alt ?? alts[0] ?? expected };
}

/** Best match among several candidates (speech recognition returns alternative transcripts). */
export function matchAnyAnswer(candidates: string[], expected: string): AnswerMatch {
  const rank: Record<AnswerResult, number> = { correct: 0, close: 1, wrong: 2 };
  return candidates
    .map((c) => matchAnswer(c, expected))
    .sort((a, b) => rank[a.result] - rank[b.result])[0] ?? { result: 'wrong', expected };
}

/** Rating suggested to the user after a typed/spoken check (they can still choose another). */
export function suggestedRating(result: AnswerResult): 'again' | 'hard' | 'good' {
  return result === 'correct' ? 'good' : result === 'close' ? 'hard' : 'again';
}
