/** Public origin of the app (used as the MCP resource identifier). Override for local testing. */
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://zarkdroid.zarkio.com.br').replace(/\/$/, '');

export const MCP_URL = `${APP_URL}/api/mcp`;

/** Supabase Auth acts as the OAuth authorization server for MCP clients. */
export function authServerIssuer(): string {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  return `${url}/auth/v1`;
}
