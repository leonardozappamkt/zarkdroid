import { htmlToMarkdown } from './html';

export type Delimiter = ',' | ';' | '\t';

/** Anki "Notes in Plain Text" exports start with "#key:value" lines (separator, html, tags column). */
export interface CsvMeta {
  delimiter?: Delimiter;
  html: boolean;
  tagsColumn?: number; // 0-based
}

export interface ParsedTable {
  rows: string[][];
  meta: CsvMeta;
}

const SEPARATORS: Record<string, Delimiter> = { tab: '\t', comma: ',', semicolon: ';' };

function detectDelimiter(sample: string): Delimiter {
  const counts = ([',', ';', '\t'] as Delimiter[]).map((d) => ({ d, n: sample.split('\n').slice(0, 5).join('\n').split(d).length - 1 }));
  counts.sort((a, b) => b.n - a.n);
  return counts[0].n > 0 ? counts[0].d : ',';
}

/** RFC 4180 style: quoted fields may contain delimiters, quotes ("" escapes) and line breaks. */
function splitRows(text: string, delimiter: Delimiter): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"' && field === '') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

export function parseTable(raw: string): ParsedTable {
  const text = raw.replace(/^﻿/, '');
  const meta: CsvMeta = { html: false };
  const bodyLines: string[] = [];

  for (const line of text.split(/\r?\n/)) {
    const header = /^#([\w ]+):(.*)$/.exec(line);
    if (header && bodyLines.length === 0) {
      const key = header[1].trim().toLowerCase();
      const value = header[2].trim();
      if (key === 'separator') meta.delimiter = SEPARATORS[value.toLowerCase()] ?? (value.length === 1 ? (value as Delimiter) : undefined);
      else if (key === 'html') meta.html = value.toLowerCase() === 'true';
      else if (key === 'tags column') meta.tagsColumn = Number(value) - 1;
      continue;
    }
    if (line.startsWith('#') && bodyLines.length === 0) continue;
    bodyLines.push(line);
  }

  const body = bodyLines.join('\n');
  const delimiter = meta.delimiter ?? detectDelimiter(body);
  return { rows: splitRows(body, delimiter), meta: { ...meta, delimiter } };
}

export interface ColumnMapping {
  front: number;
  back: number;
  extra: number; // -1 = none
  tags: number; // -1 = none
}

export interface ImportedCard {
  front: string;
  back: string;
  extra?: string;
  tags: string[];
}

export function rowsToCards(rows: string[][], mapping: ColumnMapping, html: boolean): ImportedCard[] {
  const clean = (value: string | undefined) => {
    const v = (value ?? '').trim();
    return html ? htmlToMarkdown(v) : v;
  };
  const cards: ImportedCard[] = [];
  for (const row of rows) {
    const front = clean(row[mapping.front]);
    const back = clean(row[mapping.back]);
    if (!front || !back) continue;
    const extra = mapping.extra >= 0 ? clean(row[mapping.extra]) : '';
    const tags = mapping.tags >= 0 ? (row[mapping.tags] ?? '').split(/[\s,;]+/).map((t) => t.trim().toLowerCase()).filter(Boolean) : [];
    cards.push({ front, back, extra: extra || undefined, tags });
  }
  return cards;
}

/** Heuristic header detection: first row looks like labels (e.g. "front,back" / "frente;verso"). */
export function looksLikeHeader(row: string[]): boolean {
  const labels = /^(front|back|frente|verso|word|palavra|term|termo|translation|traducao|tradução|question|pergunta|answer|resposta|tags?|extra|nota|notes?|deck)$/i;
  return row.length > 0 && row.filter((c) => labels.test(c.trim())).length >= Math.min(2, row.length);
}
