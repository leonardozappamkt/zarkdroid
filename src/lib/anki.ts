import JSZip from 'jszip';
import { decompress } from 'fzstd';
import type { Database, SqlJsStatic } from 'sql.js';
import { htmlToMarkdown } from './html';
import type { ImportedCard } from './csv';

export interface AnkiDeck {
  name: string;
  cards: ImportedCard[];
}

export interface ParseOptions {
  /** Where sql.js finds its WebAssembly file. In the browser: () => '/sql-wasm.wasm'. */
  locateFile: (file: string) => string;
}

const FIELD_SEPARATOR = '\x1f';
const MAX_DB_BYTES = 200 * 1024 * 1024;

async function openDatabase(zip: JSZip, options: ParseOptions): Promise<Database> {
  // Newest format first: Anki 2.1.50+ writes collection.anki21b (zstd-compressed SQLite).
  const entry = zip.file('collection.anki21b') ?? zip.file('collection.anki21') ?? zip.file('collection.anki2');
  if (!entry) throw new Error('Este arquivo não parece ser um baralho do Anki (.apkg).');

  let bytes = await entry.async('uint8array');
  if (bytes.length > MAX_DB_BYTES) throw new Error('Arquivo grande demais para importar.');
  if (entry.name.endsWith('.anki21b')) bytes = decompress(bytes);

  const initSqlJs = (await import('sql.js')).default as (config: { locateFile: (f: string) => string }) => Promise<SqlJsStatic>;
  const SQL = await initSqlJs({ locateFile: options.locateFile });
  return new SQL.Database(bytes);
}

function rows(db: Database, sql: string): Record<string, unknown>[] {
  const result = db.exec(sql)[0];
  if (!result) return [];
  return result.values.map((values) => Object.fromEntries(result.columns.map((c, i) => [c, values[i]])));
}

function hasTable(db: Database, name: string): boolean {
  return rows(db, `select name from sqlite_master where type='table' and name='${name}'`).length > 0;
}

/** Deck id → name, for both the old schema (JSON in col.decks) and the new one (decks table). */
function deckNames(db: Database): Map<string, string> {
  const names = new Map<string, string>();
  if (hasTable(db, 'decks')) {
    for (const r of rows(db, 'select id, name from decks')) names.set(String(r.id), String(r.name).replaceAll(FIELD_SEPARATOR, '::'));
  } else {
    const json = rows(db, 'select decks from col')[0]?.decks;
    if (typeof json === 'string' && json) {
      for (const [id, deck] of Object.entries(JSON.parse(json) as Record<string, { name?: string }>)) names.set(id, deck.name ?? `Baralho ${id}`);
    }
  }
  return names;
}

/** Reads an .apkg: one card per note (reversed/extra card types are not duplicated), grouped by deck. */
export async function parseApkg(data: ArrayBuffer | Uint8Array, options: ParseOptions): Promise<AnkiDeck[]> {
  const zip = await JSZip.loadAsync(data);
  const db = await openDatabase(zip, options);
  try {
    const names = deckNames(db);

    // The deck of a note = the deck of its first card.
    const noteDeck = new Map<string, string>();
    for (const r of rows(db, 'select nid, did from cards order by id')) {
      if (!noteDeck.has(String(r.nid))) noteDeck.set(String(r.nid), String(r.did));
    }

    const decks = new Map<string, AnkiDeck>();
    for (const note of rows(db, 'select id, flds, tags from notes order by id')) {
      const fields = String(note.flds).split(FIELD_SEPARATOR).map((f) => htmlToMarkdown(f));
      const front = fields[0]?.trim();
      const isCloze = /\{\{c\d+::/.test(front ?? '');
      // Cloze notes keep everything in the first field; the second is only "extra" text.
      const back = isCloze ? (fields[1]?.trim() || '…') : fields[1]?.trim();
      if (!front || !back) continue;

      const extra = fields.slice(2).filter(Boolean).join('\n').trim() || (isCloze && fields[1]?.trim() ? fields[1].trim() : '');
      const tags = String(note.tags ?? '').split(/\s+/).map((t) => t.trim().toLowerCase()).filter(Boolean);

      const did = noteDeck.get(String(note.id)) ?? 'default';
      const name = names.get(did) ?? 'Baralho importado';
      const deck = decks.get(name) ?? { name, cards: [] };
      deck.cards.push({ front, back, extra: extra && !isCloze ? extra : undefined, tags });
      decks.set(name, deck);
    }

    // Anki always has an empty "Default" deck; hide it when it has nothing.
    return [...decks.values()].filter((d) => d.cards.length > 0);
  } finally {
    db.close();
  }
}
