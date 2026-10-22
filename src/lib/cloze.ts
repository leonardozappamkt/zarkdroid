/** Anki-style cloze deletions: "The capital of France is {{c1::Paris}}" or with a hint "{{c1::Paris::city}}". */
const CLOZE = /\{\{c(\d+)::([\s\S]*?)(?:::([\s\S]*?))?\}\}/g;

export function hasCloze(text: string): boolean {
  CLOZE.lastIndex = 0;
  return CLOZE.test(text);
}

/** Markdown with every deletion hidden as "[…]" (or "[hint]"), or revealed in bold. */
export function renderCloze(text: string, reveal: boolean): string {
  return text.replace(CLOZE, (_m, _n, answer: string, hint?: string) =>
    reveal ? `**${answer}**` : `**[${hint?.trim() || '…'}]**`,
  );
}

export function clozeAnswers(text: string): string[] {
  const answers: string[] = [];
  for (const m of text.matchAll(CLOZE)) answers.push(m[2]);
  return answers;
}

/** Wraps the selected text in a new cloze number (next free one), for the "Lacuna" button. */
export function wrapSelectionAsCloze(text: string, start: number, end: number): { text: string; cursor: number } {
  const selected = text.slice(start, end);
  if (!selected) return { text, cursor: start };
  const used = [...text.matchAll(CLOZE)].map((m) => Number(m[1]));
  const next = used.length ? Math.max(...used) + 1 : 1;
  const wrapped = `{{c${next}::${selected}}}`;
  return { text: text.slice(0, start) + wrapped + text.slice(end), cursor: start + wrapped.length };
}
