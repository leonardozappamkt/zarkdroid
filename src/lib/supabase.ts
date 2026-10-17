import { createClient } from '@supabase/supabase-js';

export function getSupabaseCredentials() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (typeof window !== 'undefined') {
    const localUrl = localStorage.getItem('zarkdroid_sb_url');
    const localKey = localStorage.getItem('zarkdroid_sb_key');
    if (localUrl && localKey) {
      url = localUrl;
      key = localKey;
    }
  }

  return { url: url.trim(), key: key.trim() };
}

export const isSupabaseConfigured = () => {
  const { url, key } = getSupabaseCredentials();
  return (
    !!url &&
    !!key &&
    !url.includes('placeholder') &&
    url.startsWith('https://')
  );
};

export const getSupabaseClient = () => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const { url, key } = getSupabaseCredentials();
  return createClient(url, key);
};

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Credenciais do Supabase não configuradas.' };
  }

  try {
    const { error } = await client.from('decks').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          message: 'Conectado ao Supabase, mas a tabela "decks" ainda não foi criada. Execute o SQL de criação!',
        };
      }
      return { success: false, message: `Erro do Supabase: ${error.message}` };
    }
    return { success: true, message: 'Conexão estabelecida com sucesso no Supabase!' };
  } catch (err: any) {
    return { success: false, message: `Falha na requisição: ${err.message || 'Erro desconhecido'}` };
  }
}
