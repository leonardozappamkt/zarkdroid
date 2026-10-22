'use client';

import React, { useEffect, useState } from 'react';
import AuthShell, { FormMessage } from '@/components/AuthShell';
import { getSupabaseClient } from '@/lib/supabase';
import type { OAuthAuthorizationDetails } from '@supabase/supabase-js';

const PERMISSIONS = [
  'Ver seus baralhos e cards',
  'Criar e editar baralhos e cards',
  'Registrar suas revisões de estudo',
];

function hostOf(uri: string): string {
  try {
    return new URL(uri).host;
  } catch {
    return uri;
  }
}

/** Screen Supabase redirects to (Authentication → OAuth Server → Authorization Path) so the user can allow or deny an app. */
export default function OAuthConsentPage() {
  const [details, setDetails] = useState<OAuthAuthorizationDetails | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const authorizationId =
    typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('authorization_id');

  useEffect(() => {
    async function load() {
      const client = getSupabaseClient();
      if (!client || !authorizationId) {
        setError('Pedido de autorização inválido. Volte ao Claude e tente conectar de novo.');
        return;
      }
      const { data, error: err } = await client.auth.oauth.getAuthorizationDetails(authorizationId);
      if (err || !data) {
        setError('Este pedido expirou ou já foi usado. Volte ao Claude e tente conectar de novo.');
        return;
      }
      if (!('authorization_id' in data)) {
        // Already allowed before: go straight back to the app.
        window.location.href = data.redirect_url;
        return;
      }
      setDetails(data);
    }
    load();
  }, [authorizationId]);

  async function decide(approve: boolean) {
    const client = getSupabaseClient();
    if (!client || !authorizationId) return;
    setBusy(true);
    const { data, error: err } = approve
      ? await client.auth.oauth.approveAuthorization(authorizationId)
      : await client.auth.oauth.denyAuthorization(authorizationId);
    if (err || !data) {
      setBusy(false);
      setError('Não foi possível concluir. Tente conectar de novo pelo Claude.');
      return;
    }
    window.location.href = data.redirect_url;
  }

  if (error) {
    return <AuthShell title="Não foi possível autorizar" subtitle={error} />;
  }

  if (!details) {
    return <AuthShell title="Carregando…" />;
  }

  return (
    <AuthShell
      title={`Permitir acesso para ${details.client.name || 'este app'}?`}
      subtitle={`Você está conectando a conta ${details.user.email}.`}
    >
      <div className="card divide-y divide-line">
        <div className="p-4">
          <p className="label">O app poderá</p>
          <ul className="space-y-2 text-sm">
            {PERMISSIONS.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <div className="p-4">
          <p className="label">Não poderá</p>
          <p className="text-sm text-mute">Excluir baralhos, cards ou a sua conta.</p>
        </div>
        <div className="p-4">
          <p className="label">Retorna para</p>
          <p className="break-all font-mono text-xs">{hostOf(details.redirect_uri)}</p>
        </div>
      </div>

      <FormMessage kind="info">Só permita se foi você quem iniciou essa conexão. Você pode revogar o acesso a qualquer momento em Configurações.</FormMessage>

      <div className="flex gap-2">
        <button onClick={() => decide(false)} disabled={busy} className="btn-outline flex-1 py-3">
          Negar
        </button>
        <button onClick={() => decide(true)} disabled={busy} className="btn-primary flex-1 py-3">
          {busy ? 'Aguarde…' : 'Permitir'}
        </button>
      </div>
    </AuthShell>
  );
}
