import { getSupabaseClient } from './supabase';

const BUCKET = 'card-media';
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = /^(image\/(png|jpeg|webp|gif)|audio\/(mpeg|mp4|webm|ogg|wav))$/;

export type MediaKind = 'image' | 'audio';

/** Uploads an image/audio file to the user's folder in Storage and returns its public URL. */
export async function uploadMedia(file: File): Promise<{ url: string; kind: MediaKind }> {
  if (!ALLOWED.test(file.type)) throw new Error('Use uma imagem (PNG, JPG, WebP, GIF) ou áudio (MP3, M4A, WebM, OGG, WAV).');
  if (file.size > MAX_BYTES) throw new Error('O arquivo passa de 5 MB.');

  const client = getSupabaseClient();
  if (!client) throw new Error('Envio de arquivos indisponível no momento.');
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) throw new Error('Entre na sua conta para enviar arquivos.');

  const extension = file.type.split('/')[1].replace('mpeg', 'mp3').replace('mp4', 'm4a');
  const path = `${userData.user.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error('Não foi possível enviar o arquivo. Tente de novo.');

  return { url: client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl, kind: file.type.startsWith('audio/') ? 'audio' : 'image' };
}

/** Markdown snippet for an uploaded file (audio uses the app's "audio:" link syntax). */
export function mediaMarkdown(url: string, kind: MediaKind): string {
  return kind === 'audio' ? `[🔊](audio:${url})` : `![](${url})`;
}
