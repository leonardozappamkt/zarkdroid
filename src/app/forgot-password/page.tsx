'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AuthShell, { FormMessage } from '@/components/AuthShell';
import { auth } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await auth.requestPasswordReset(email);
    setLoading(false);
    if (res.ok) {
      setSent(true);
    } else {
      setError(res.message || 'Não foi possível enviar o e-mail.');
    }
  };

  if (sent) {
    return (
      <AuthShell
        title="Verifique seu e-mail"
        subtitle={`Se existir uma conta para ${email}, enviamos um link para redefinir a senha.`}
        footer={
          <button onClick={() => setSent(false)} className="underline hover:text-ink">
            Usar outro e-mail
          </button>
        }
      >
        <Link href="/login" className="btn-primary w-full py-3">
          Voltar ao login
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Esqueci a senha"
      subtitle="Informe seu e-mail e enviaremos um link para criar uma nova senha."
      footer={
        <Link href="/login" className="underline hover:text-ink">
          Voltar ao login
        </Link>
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

        {error && <FormMessage kind="error">{error}</FormMessage>}

        <button type="submit" disabled={loading || !email} className="btn-primary w-full py-3">
          {loading ? 'Enviando…' : 'Enviar link'}
        </button>
      </form>
    </AuthShell>
  );
}
