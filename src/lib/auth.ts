'use client';

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';
import { storage } from './storage';

type AuthResult = { ok: boolean; message?: string; needsConfirmation?: boolean };

const NOT_CONFIGURED: AuthResult = {
  ok: false,
  message: 'O login não está disponível no momento. Tente novamente mais tarde.',
};

function translate(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.';
  if (m.includes('already registered')) return 'Este e-mail já tem uma conta. Tente entrar.';
  if (m.includes('password should be at least')) return 'A senha deve ter pelo menos 8 caracteres.';
  if (m.includes('same password')) return 'A nova senha deve ser diferente da atual.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
  if (m.includes('failed to fetch') || m.includes('network')) return 'Sem conexão. Verifique sua internet.';
  return 'Algo deu errado. Tente novamente.';
}

export const auth = {
  isAvailable(): boolean {
    return !!getSupabaseClient();
  },

  async signIn(email: string, password: string): Promise<AuthResult> {
    const client = getSupabaseClient();
    if (!client) return NOT_CONFIGURED;
    const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
    return error ? { ok: false, message: translate(error.message) } : { ok: true };
  },

  async signUp(email: string, password: string): Promise<AuthResult> {
    const client = getSupabaseClient();
    if (!client) return NOT_CONFIGURED;
    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    if (error) return { ok: false, message: translate(error.message) };
    return { ok: true, needsConfirmation: !data.session };
  },

  async requestPasswordReset(email: string): Promise<AuthResult> {
    const client = getSupabaseClient();
    if (!client) return NOT_CONFIGURED;
    const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return error ? { ok: false, message: translate(error.message) } : { ok: true };
  },

  async updatePassword(password: string): Promise<AuthResult> {
    const client = getSupabaseClient();
    if (!client) return NOT_CONFIGURED;
    const { error } = await client.auth.updateUser({ password });
    return error ? { ok: false, message: translate(error.message) } : { ok: true };
  },

  async signOut(): Promise<void> {
    await getSupabaseClient()?.auth.signOut();
    storage.clearLocal();
  },
};

/** Current session; `loading` is true until the stored session has been read. */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setLoading(false);
      return;
    }
    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = client.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  return { session, loading };
}
