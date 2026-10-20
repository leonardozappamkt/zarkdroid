'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthShell, { FormMessage } from '@/components/AuthShell';
import PasswordInput from '@/components/PasswordInput';
import { auth } from '@/lib/auth';

const MIN_PASSWORD = 8;

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < MIN_PASSWORD) {
      setError(`A senha deve ter pelo menos ${MIN_PASSWORD} caracteres.`);
      return;
    }
    if (password !== confirm) {
      setError('As senhas não conferem.');
      return;
    }
    setLoading(true);
    const res = await auth.signUp(email, password);
    setLoading(false);
    if (!res.ok) {
      setError(res.message || 'Não foi possível criar a conta.');
    } else if (res.needsConfirmation) {
      setConfirmationSent(true);
    } else {
      router.push('/');
    }
  };

  if (confirmationSent) {
    return (
      <AuthShell
        title="Verifique seu e-mail"
        subtitle={`Enviamos um link de confirmação para ${email}. Depois de confirmar, é só entrar.`}
      >
        <Link href="/login" className="btn-primary w-full py-3">
          Ir para o login
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Seus baralhos ficam salvos e disponíveis em qualquer dispositivo."
      footer={
        <>
          Já tem conta?{' '}
          <Link href="/login" className="font-medium text-ink underline">
            Entrar
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
          <label htmlFor="password" className="label">Senha</label>
          <PasswordInput
            id="password"
            required
            minLength={MIN_PASSWORD}
            autoComplete="new-password"
            placeholder={`Mínimo de ${MIN_PASSWORD} caracteres`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="confirm" className="label">Confirmar senha</label>
          <PasswordInput
            id="confirm"
            required
            autoComplete="new-password"
            placeholder="Repita a senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {error && <FormMessage kind="error">{error}</FormMessage>}

        <button type="submit" disabled={loading || !email || !password || !confirm} className="btn-primary w-full py-3">
          {loading ? 'Criando…' : 'Criar conta'}
        </button>

        <p className="text-center text-xs text-mute">
          Ao criar a conta você concorda com a{' '}
          <Link href="/privacy" className="underline hover:text-ink">
            Política de Privacidade
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  );
}
