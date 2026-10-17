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

export const getSupabaseClient = (customUrl?: string, customKey?: string) => {
  const resolvedUrl = (customUrl || getSupabaseCredentials().url).trim();
  const resolvedKey = (customKey || getSupabaseCredentials().key).trim();

  if (!resolvedUrl || !resolvedKey || resolvedUrl.includes('placeholder') || !resolvedUrl.startsWith('https://')) {
    return null;
  }
  return createClient(resolvedUrl, resolvedKey);
};

export async function testSupabaseConnection(
  customUrl?: string,
  customKey?: string
): Promise<{ success: boolean; message: string }> {
  const url = (customUrl || getSupabaseCredentials().url).trim();
  const key = (customKey || getSupabaseCredentials().key).trim();

  if (!url) {
    return { success: false, message: 'O campo NEXT_PUBLIC_SUPABASE_URL está vazio.' };
  }

  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    if (url.startsWith('sb_') || url.startsWith('ey')) {
      return {
        success: false,
        message: 'Atenção: Você colou a chave API no campo da URL! A URL deve ser no formato https://seu-projeto.supabase.co.',
      };
    }
    return {
      success: false,
      message: 'A URL do Supabase deve começar com https:// e terminar com .supabase.co.',
    };
  }

  if (!key) {
    return { success: false, message: 'O campo NEXT_PUBLIC_SUPABASE_ANON_KEY está vazio.' };
  }

  const client = createClient(url, key);

  try {
    const { error } = await client.from('decks').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Conectado ao Supabase com sucesso! (Porém a tabela "decks" ainda precisa ser criada com o script SQL abaixo).',
        };
      }
      return { success: false, message: `Erro ao comunicar com o Supabase: ${error.message}` };
    }
    return { success: true, message: 'Conexão validada com sucesso! As tabelas já existem e estão prontas.' };
  } catch (err: any) {
    return { success: false, message: `Falha na requisição: ${err.message || 'Verifique sua conexão'}` };
  }
}
