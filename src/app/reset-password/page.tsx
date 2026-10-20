'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthShell, { FormMessage } from '@/components/AuthShell';
import PasswordInput from '@/components/PasswordInput';
import { auth, useSession } from '@/lib/auth';

const MIN_PASSWORD = 8;

export default function ResetPasswordPage() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [waited, setWaited] = useState(false);

  // The recovery link signs the user in from the URL hash; give it a moment before declaring it invalid.
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 1500);
    return () => clearTimeout(t);
  }, []);

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
    const res = await auth.updatePassword(password);
    setLoading(false);
    if (res.ok) {
      setDone(true);
      setTimeout(() => router.push('/'), 1500);
    } else {
      setError(res.message || 'Não foi possível redefinir a senha.');
    }
  };

  if (done) {
    return <AuthShell title="Senha atualizada" subtitle="Tudo certo. Redirecionando…" />;
  }

  if (!session) {
    if (sessionLoading || !waited) {
      return <AuthShell title="Validando link…" />;
    }
    return (
      <AuthShell
        title="Link inválido"
        subtitle="Este link expirou ou já foi usado. Peça um novo para redefinir sua senha."
      >
        <Link href="/forgot-password" className="btn-primary w-full py-3">
          Pedir novo link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Nova senha" subtitle="Escolha uma nova senha para sua conta.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="label">Nova senha</label>
          <PasswordInput
            id="password"
            required
            minLength={MIN_PASSWORD}
            autoComplete="new-password"
            autoFocus
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

        <button type="submit" disabled={loading || !password || !confirm} className="btn-primary w-full py-3">
          {loading ? 'Salvando…' : 'Salvar nova senha'}
        </button>
      </form>
    </AuthShell>
  );
}
