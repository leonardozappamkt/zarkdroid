import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AuthInfo } from '@modelcontextprotocol/server';

function supabaseEnv() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  if (!url || !key) throw new Error('Supabase is not configured on the server.');
  return { url, key };
}

const STATELESS = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } as const;

/**
 * Client that acts AS the signed-in user: the bearer token is sent to Supabase, so
 * Row Level Security applies and a user can only ever reach their own decks and cards.
 */
export function createUserClient(token: string): SupabaseClient {
  const { url, key } = supabaseEnv();
  return createClient(url, key, { auth: STATELESS, global: { headers: { Authorization: `Bearer ${token}` } } });
}

/**
 * Accepts only access tokens issued by the Supabase OAuth server to an MCP client
 * (they carry a `client_id` claim). Ordinary web-app session tokens are rejected, so the
 * endpoint can't be driven with a copied browser session.
 */
export async function verifyMcpToken(_req: Request, bearerToken?: string): Promise<AuthInfo | undefined> {
  if (!bearerToken) return undefined;
  try {
    const { url, key } = supabaseEnv();
    const verifier = createClient(url, key, { auth: STATELESS });
    const { data, error } = await verifier.auth.getClaims(bearerToken);
    const claims = data?.claims as Record<string, unknown> | undefined;
    if (error || !claims?.sub || typeof claims.client_id !== 'string') return undefined;

    return {
      token: bearerToken,
      clientId: claims.client_id,
      scopes: typeof claims.scope === 'string' ? claims.scope.split(' ') : [],
      expiresAt: typeof claims.exp === 'number' ? claims.exp : undefined,
      extra: { userId: String(claims.sub) },
    };
  } catch {
    return undefined;
  }
}
