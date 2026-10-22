import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createUserClient } from './auth';
import { calculateNextReview } from '@/lib/srs';
import type { Flashcard, ReviewRating } from '@/types';

type ToolContext = { http?: { authInfo?: { token?: string } } };

const PAGE = 1000;
const CARD_COLUMNS = 'id, deck_id, front, back, extra, tags, state, interval, ease_factor, due_date';

const ok = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] });
const fail = (message: string) => ({ isError: true, content: [{ type: 'text' as const, text: message }] });

function clientFrom(ctx: ToolContext): SupabaseClient {
  const token = ctx.http?.authInfo?.token;
  if (!token) throw new Error('Not authenticated.');
  return createUserClient(token);
}

/** Runs a tool body, turning any thrown error into a readable tool error (no stack traces). */
async function guarded(ctx: ToolContext, run: (sb: SupabaseClient) => Promise<unknown>) {
  try {
    return ok(await run(clientFrom(ctx)));
  } catch (err) {
    console.error('[mcp]', err);
    return fail(err instanceof Error ? err.message : 'Unexpected error.');
  }
}

function newId(prefix: 'deck' | 'card') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Strips characters that would break a PostgREST `or(...)` filter. */
function safeSearch(text: string) {
  return text.replace(/[,()%*\\]/g, ' ').trim();
}

/** PostgREST caps a response at 1000 rows; page through all of them. */
async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}

const tagsSchema = z.array(z.string().trim().min(1).max(40)).max(10);

export function registerZarkdroidTools(server: McpServer) {
  server.registerTool(
    'list_decks',
    {
      description:
        'Lists the user\'s flashcard decks with how many cards are new, in learning, or due for review today. Start here to find a deck id.',
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async (_args: unknown, ctx: ToolContext) =>
      guarded(ctx, async (sb) => {
        const { data: decks, error } = await sb.from('decks').select('id, title, description, created_at').order('created_at');
        if (error) throw new Error(error.message);

        const cards = await fetchAll<{ deck_id: string; state: string; due_date: string }>((from, to) =>
          sb.from('flashcards').select('deck_id, state, due_date').range(from, to),
        );
        const now = Date.now();
        return (decks ?? []).map((d) => {
          const own = cards.filter((c) => c.deck_id === d.id);
          return {
            ...d,
            total_cards: own.length,
            new: own.filter((c) => c.state === 'new').length,
            learning: own.filter((c) => c.state === 'learning').length,
            due_for_review: own.filter((c) => c.state === 'review' && new Date(c.due_date).getTime() <= now).length,
          };
        });
      }),
  );

  server.registerTool(
    'list_cards',
    {
      description: 'Lists cards of a deck (front, back, extra, tags and study state). Supports a text search and pagination.',
      inputSchema: z.object({
        deck_id: z.string().describe('Deck id from list_decks.'),
        query: z.string().max(100).optional().describe('Only cards whose front or back contains this text.'),
        state: z.enum(['new', 'learning', 'review']).optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ deck_id, query, state, limit, offset }: { deck_id: string; query?: string; state?: 'new' | 'learning' | 'review'; limit: number; offset: number }, ctx: ToolContext) =>
      guarded(ctx, async (sb) => {
        let q = sb.from('flashcards').select(CARD_COLUMNS).eq('deck_id', deck_id).order('created_at').range(offset, offset + limit - 1);
        if (state) q = q.eq('state', state);
        const search = query ? safeSearch(query) : '';
        if (search) q = q.or(`front.ilike.%${search}%,back.ilike.%${search}%`);
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        return { count: data?.length ?? 0, offset, cards: data ?? [] };
      }),
  );

  server.registerTool(
    'get_due_cards',
    {
      description:
        'Cards to study now, in the app\'s order: learning first, then reviews that are due, then new cards. Use this to quiz the user.',
      inputSchema: z.object({
        deck_id: z.string().optional().describe('Limit to one deck.'),
        limit: z.number().int().min(1).max(50).default(10),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ deck_id, limit }: { deck_id?: string; limit: number }, ctx: ToolContext) =>
      guarded(ctx, async (sb) => {
        const base = () => {
          const q = sb.from('flashcards').select(CARD_COLUMNS);
          return deck_id ? q.eq('deck_id', deck_id) : q;
        };
        const out: unknown[] = [];
        const take = async (build: () => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>) => {
          if (out.length >= limit) return;
          const { data, error } = await build();
          if (error) throw new Error(error.message);
          out.push(...(data ?? []).slice(0, limit - out.length));
        };
        await take(() => base().eq('state', 'learning').order('due_date').limit(limit));
        await take(() => base().eq('state', 'review').lte('due_date', new Date().toISOString()).order('due_date').limit(limit));
        await take(() => base().eq('state', 'new').order('created_at').limit(limit));
        return { count: out.length, cards: out };
      }),
  );

  server.registerTool(
    'create_deck',
    {
      description: 'Creates a new empty deck.',
      inputSchema: z.object({
        title: z.string().trim().min(1).max(100),
        description: z.string().max(500).optional(),
      }),
    },
    async ({ title, description }: { title: string; description?: string }, ctx: ToolContext) =>
      guarded(ctx, async (sb) => {
        const row = { id: newId('deck'), title, description: description ?? '', color: '#0a0a0a' };
        const { error } = await sb.from('decks').insert(row);
        if (error) throw new Error(error.message);
        return { created: row };
      }),
  );

  server.registerTool(
    'create_cards',
    {
      description:
        'Adds cards to a deck (up to 100 per call). "front" is the prompt (e.g. the English word) and "back" the answer (e.g. the translation). Confirm with the user before adding many cards.',
      inputSchema: z.object({
        deck_id: z.string().describe('Deck id from list_decks.'),
        cards: z
          .array(
            z.object({
              front: z.string().trim().min(1).max(2000),
              back: z.string().trim().min(1).max(2000),
              extra: z.string().max(1000).optional().describe('Optional hint or example.'),
              tags: tagsSchema.optional(),
            }),
          )
          .min(1)
          .max(100),
      }),
    },
    async ({ deck_id, cards }: { deck_id: string; cards: { front: string; back: string; extra?: string; tags?: string[] }[] }, ctx: ToolContext) =>
      guarded(ctx, async (sb) => {
        const { data: deck, error: deckError } = await sb.from('decks').select('id').eq('id', deck_id).maybeSingle();
        if (deckError) throw new Error(deckError.message);
        if (!deck) throw new Error('Deck not found. Use list_decks to get a valid deck id.');

        const now = new Date().toISOString();
        const rows = cards.map((c) => ({
          id: newId('card'),
          deck_id,
          front: c.front,
          back: c.back,
          extra: c.extra || null,
          tags: c.tags ?? [],
          state: 'new',
          repetitions: 0,
          interval: 0,
          ease_factor: 2.5,
          due_date: now,
        }));
        const { error } = await sb.from('flashcards').insert(rows);
        if (error) throw new Error(error.message);
        return { created: rows.length, card_ids: rows.map((r) => r.id) };
      }),
  );

  server.registerTool(
    'update_deck',
    {
      description: 'Renames a deck or changes its description.',
      inputSchema: z.object({
        deck_id: z.string(),
        title: z.string().trim().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
      }),
    },
    async ({ deck_id, title, description }: { deck_id: string; title?: string; description?: string }, ctx: ToolContext) =>
      guarded(ctx, async (sb) => {
        const changes = { ...(title !== undefined && { title }), ...(description !== undefined && { description }) };
        if (Object.keys(changes).length === 0) throw new Error('Provide a title or a description to change.');
        const { data, error } = await sb.from('decks').update(changes).eq('id', deck_id).select('id, title, description');
        if (error) throw new Error(error.message);
        if (!data?.length) throw new Error('Deck not found.');
        return { updated: data[0] };
      }),
  );

  server.registerTool(
    'update_card',
    {
      description: 'Edits the front, back, extra note or tags of a card. Only the fields you pass are changed.',
      inputSchema: z.object({
        card_id: z.string(),
        front: z.string().trim().min(1).max(2000).optional(),
        back: z.string().trim().min(1).max(2000).optional(),
        extra: z.string().max(1000).optional().describe('Pass an empty string to clear it.'),
        tags: tagsSchema.optional(),
      }),
    },
    async ({ card_id, front, back, extra, tags }: { card_id: string; front?: string; back?: string; extra?: string; tags?: string[] }, ctx: ToolContext) =>
      guarded(ctx, async (sb) => {
        const changes = {
          ...(front !== undefined && { front }),
          ...(back !== undefined && { back }),
          ...(extra !== undefined && { extra: extra || null }),
          ...(tags !== undefined && { tags }),
        };
        if (Object.keys(changes).length === 0) throw new Error('Provide at least one field to change.');
        const { data, error } = await sb.from('flashcards').update(changes).eq('id', card_id).select(CARD_COLUMNS);
        if (error) throw new Error(error.message);
        if (!data?.length) throw new Error('Card not found.');
        return { updated: data[0] };
      }),
  );

  server.registerTool(
    'review_card',
    {
      description:
        'Records how well the user recalled a card (again, hard, good or easy) and schedules the next review with the same spaced-repetition rules as the app.',
      inputSchema: z.object({
        card_id: z.string(),
        rating: z.enum(['again', 'hard', 'good', 'easy']),
      }),
    },
    async ({ card_id, rating }: { card_id: string; rating: ReviewRating }, ctx: ToolContext) =>
      guarded(ctx, async (sb) => {
        const { data: card, error } = await sb.from('flashcards').select('*').eq('id', card_id).maybeSingle();
        if (error) throw new Error(error.message);
        if (!card) throw new Error('Card not found.');

        const next = calculateNextReview(card as Flashcard, rating);
        const changes = {
          repetitions: next.repetitions,
          interval: next.interval,
          ease_factor: next.ease_factor,
          state: next.state,
          due_date: next.due_date,
        };
        const { error: updateError } = await sb.from('flashcards').update(changes).eq('id', card_id);
        if (updateError) throw new Error(updateError.message);
        return { card_id, rating, ...changes };
      }),
  );
}
