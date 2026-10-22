'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Upload, RefreshCw, Copy, Check } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { storage } from '@/lib/storage';
import { auth, useSession } from '@/lib/auth';
import { getSupabaseClient } from '@/lib/supabase';
import { MCP_URL } from '@/lib/mcp/config';

type Grant = { client: { id: string; name: string }; granted_at: string };

/** "Sua IA preferida": URL do servidor MCP + lista de apps conectados (com revogar). */
function ClaudeConnection() {
  const [copied, setCopied] = useState(false);
  const [grants, setGrants] = useState<Grant[] | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const loadGrants = async () => {
    const { data } = (await getSupabaseClient()?.auth.oauth.listGrants()) ?? { data: null };
    setGrants((data as Grant[] | null) ?? []);
  };

  useEffect(() => {
    loadGrants();
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(MCP_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the URL is selectable on screen */
    }
  };

  const revoke = async (clientId: string) => {
    if (!confirm('Revogar o acesso deste app à sua conta?')) return;
    setRevoking(clientId);
    await getSupabaseClient()?.auth.oauth.revokeGrant({ clientId });
    setRevoking(null);
    loadGrants();
  };

  return (
    <section className="card space-y-5 p-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Sua IA preferida</h2>
        <p className="mt-1 text-sm text-mute">
          Conecte sua IA para criar cards, listar seus baralhos ou te testar, direto na sua conta.
        </p>
      </div>

      <div>
        <label className="label">URL do servidor MCP</label>
        <div className="flex gap-2">
          <input readOnly value={MCP_URL} onFocus={(e) => e.currentTarget.select()} className="field font-mono text-xs" />
          <button onClick={copy} className="btn-outline shrink-0">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </div>

      <ol className="list-decimal space-y-1.5 pl-5 text-sm text-mute">
        <li>No app da sua IA, abra as configurações de conectores e adicione um conector personalizado.</li>
        <li>Cole a URL acima e conecte.</li>
        <li>Entre com a sua conta Zarkdroid e toque em Permitir.</li>
      </ol>

      <div className="border-t border-line pt-5">
        <p className="label">Apps conectados</p>
        {grants === null ? (
          <p className="text-sm text-mute">Carregando…</p>
        ) : grants.length === 0 ? (
          <p className="text-sm text-mute">Nenhum app conectado.</p>
        ) : (
          <ul className="divide-y divide-line">
            {grants.map((g) => (
              <li key={g.client.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{g.client.name || 'App sem nome'}</p>
                  <p className="text-xs text-mute">desde {new Date(g.granted_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <button onClick={() => revoke(g.client.id)} disabled={revoking === g.client.id} className="btn-outline shrink-0">
                  Revogar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

const DELETE_WORD = 'EXCLUIR';

export default function SettingsPage() {
  const { session } = useSession();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleting(true);
    const res = await auth.deleteAccount();
    setDeleting(false);
    if (!res.ok) setDeleteError(res.message || 'Não foi possível excluir a conta.');
    // On success the session ends and the auth gate sends the user to /login.
  };

  const handleExportJSON = () => {
    const decks = storage.getDecks();
    const cards = storage.getCards();
    const exportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      decks,
      cards,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zarkdroid-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!Array.isArray(parsed.decks) || !Array.isArray(parsed.cards)) {
          alert('Arquivo JSON inválido. Formato esperado não encontrado.');
          return;
        }

        // Merge by id so existing decks are kept; imported items replace same-id ones.
        const mergeById = <T extends { id: string }>(current: T[], incoming: T[]) => {
          const byId = new Map(current.map((item) => [item.id, item]));
          incoming.forEach((item) => byId.set(item.id, item));
          return Array.from(byId.values());
        };
        storage.saveDecks(mergeById(storage.getDecks(), parsed.decks));
        storage.saveCards(mergeById(storage.getCards(), parsed.cards));

        // Push to the account so the next login (which pulls from the cloud) doesn't drop the import.
        const sync = await storage.syncToSupabase();
        alert(
          sync.success
            ? 'Baralhos importados e salvos na sua conta.'
            : `Importado neste aparelho, mas não foi possível salvar na nuvem: ${sync.message}`
        );
        window.location.reload();
      } catch (err) {
        alert('Erro ao ler arquivo JSON.');
      } finally {
        input.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleResetSampleData = () => {
    if (confirm('Tem certeza de que deseja restaurar os baralhos de exemplo originais?')) {
      localStorage.removeItem('zarkdroid_decks');
      localStorage.removeItem('zarkdroid_cards');
      alert('Dados restaurados para o padrão de exemplo.');
      window.location.reload();
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-10 px-4 py-10 sm:px-6">
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
            Baralhos
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">Configurações</h1>
        </div>

        <ClaudeConnection />

        {/* Backup */}
        <section className="card space-y-5 p-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Backup</h2>
            <p className="mt-1 text-sm text-mute">Exporte ou importe seus baralhos em JSON.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={handleExportJSON} className="btn-outline">
              <Download className="h-4 w-4" />
              Exportar
            </button>
            <label className="btn-outline cursor-pointer">
              <Upload className="h-4 w-4" />
              Importar
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
            <button onClick={handleResetSampleData} className="btn-ghost ml-auto">
              <RefreshCw className="h-4 w-4" />
              Restaurar exemplos
            </button>
          </div>
        </section>

        {/* Account */}
        {session && (
          <section className="card space-y-5 p-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Conta</h2>
              <p className="mt-1 text-sm text-mute">{session.user.email}</p>
            </div>

            {!confirmDelete ? (
              <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-mute">
                  Exclui a sua conta e todos os seus baralhos. Não dá para desfazer.
                </p>
                <button onClick={() => setConfirmDelete(true)} className="btn-outline shrink-0">
                  Excluir conta
                </button>
              </div>
            ) : (
              <div className="space-y-3 border-t border-line pt-5">
                <p className="text-sm">
                  Para confirmar, digite <strong className="font-mono">{DELETE_WORD}</strong>. Seus baralhos e cards
                  serão apagados de forma permanente, neste aparelho e na nuvem.
                </p>
                <input
                  type="text"
                  autoFocus
                  autoComplete="off"
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                  placeholder={DELETE_WORD}
                  className="field font-mono"
                />
                {deleteError && (
                  <p role="alert" className="rounded-xl border border-ink px-3.5 py-2.5 text-sm">
                    {deleteError}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting || deleteText !== DELETE_WORD}
                    className="btn-primary"
                  >
                    {deleting ? 'Excluindo…' : 'Excluir minha conta'}
                  </button>
                  <button
                    onClick={() => {
                      setConfirmDelete(false);
                      setDeleteText('');
                      setDeleteError('');
                    }}
                    disabled={deleting}
                    className="btn-ghost"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
