'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthShell, { FormMessage } from '@/components/AuthShell';
import PasswordInput from '@/components/PasswordInput';
import { auth } from '@/lib/auth';
import { safeNext } from '@/lib/redirect';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await auth.signIn(email, password);
    setLoading(false);
    if (res.ok) {
      router.push(safeNext(new URLSearchParams(window.location.search).get('next')));
    } else {
      setError(res.message || 'Não foi possível entrar.');
    }
  };

  return (
    <AuthShell
      title="Entrar"
      subtitle="Entre para acessar seus baralhos."
      footer={
        <>
          Não tem conta?{' '}
          <Link href="/signup" className="font-medium text-ink underline">
            Criar conta
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">E-mail</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            autoFocus
            placeholder="voce@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-mute">
              Senha
            </label>
            <Link href="/forgot-password" className="text-xs text-mute underline hover:text-ink">
              Esqueci a senha
            </Link>
          </div>
          <PasswordInput
            id="password"
            required
            autoComplete="current-password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <FormMessage kind="error">{error}</FormMessage>}

        <button type="submit" disabled={loading || !email || !password} className="btn-primary w-full py-3">
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </AuthShell>
  );
}
