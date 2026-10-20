'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Upload, CheckCircle, AlertCircle, RefreshCw, Send, ArrowDownCircle, Check } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { storage } from '@/lib/storage';
import { isSupabaseConfigured, testSupabaseConnection } from '@/lib/supabase';

export default function SettingsPage() {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [syncResult, setSyncResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setIsConfigured(isSupabaseConfigured());
    if (typeof window !== 'undefined') {
      const storedUrl = localStorage.getItem('zarkdroid_sb_url') || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const storedKey = localStorage.getItem('zarkdroid_sb_key') || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      if (!storedUrl.includes('placeholder')) {
        setSupabaseUrl(storedUrl);
      }
      if (!storedKey.includes('placeholder')) {
        setSupabaseAnonKey(storedKey);
      }
    }
  }, []);

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('zarkdroid_sb_url', supabaseUrl.trim());
      localStorage.setItem('zarkdroid_sb_key', supabaseAnonKey.trim());
      setIsConfigured(isSupabaseConfigured());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(supabaseUrl, supabaseAnonKey);
      setTestResult(res);
      if (res.success) {
        localStorage.setItem('zarkdroid_sb_url', supabaseUrl.trim());
        localStorage.setItem('zarkdroid_sb_key', supabaseAnonKey.trim());
        setIsConfigured(true);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await storage.syncToSupabase();
      setSyncResult(res);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncFromSupabase = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await storage.syncFromSupabase();
      setSyncResult(res);
    } finally {
      setIsSyncing(false);
    }
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
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.decks && parsed.cards) {
          storage.saveDecks(parsed.decks);
          storage.saveCards(parsed.cards);
          alert('Baralhos e flashcards importados com sucesso!');
          window.location.reload();
        } else {
          alert('Arquivo JSON inválido. Formato esperado não encontrado.');
        }
      } catch (err) {
        alert('Erro ao ler arquivo JSON.');
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

  const Notice = ({ result }: { result: { success?: boolean; message?: string } }) => (
    <div className="flex items-start gap-2 rounded-xl border border-line bg-soft p-3 text-sm">
      {result.success ? (
        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span>{result.message}</span>
    </div>
  );

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

        {/* Supabase */}
        <section className="card space-y-6 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Sincronização na nuvem</h2>
              <p className="mt-1 text-sm text-mute">
                Use o Supabase para levar seus baralhos entre dispositivos. Sem isso, tudo fica salvo só neste aparelho.
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-line px-2.5 py-1 text-xs text-mute">
              {isConfigured ? 'Configurado' : 'Não configurado'}
            </span>
          </div>

          <form onSubmit={handleSaveSupabase} className="space-y-4">
            <div>
              <label className="label">Project URL</label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="field font-mono"
              />
              <p className="mt-1.5 text-xs text-mute">
                Começa com <code>https://</code> e termina com <code>.supabase.co</code>.
              </p>
            </div>

            <div>
              <label className="label">Anon / publishable key</label>
              <input
                type="password"
                placeholder="sb_publishable_… ou eyJhbG…"
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                className="field font-mono"
              />
              <p className="mt-1.5 text-xs text-mute">
                Use a chave pública. Nunca cole a chave <code>service_role</code>.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={handleTestConnection} disabled={isTesting} className="btn-outline">
                <RefreshCw className={`h-4 w-4 ${isTesting ? 'animate-spin' : ''}`} />
                {isTesting ? 'Testando…' : 'Testar conexão'}
              </button>
              <button type="submit" className="btn-primary">
                <Check className="h-4 w-4" />
                Salvar
              </button>
            </div>

            {saveSuccess && <p className="text-sm text-mute">Credenciais salvas.</p>}
            {testResult && <Notice result={testResult} />}
          </form>

          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-6">
            <button onClick={handleSyncToSupabase} disabled={isSyncing} className="btn-primary">
              <Send className="h-4 w-4" />
              {isSyncing ? 'Sincronizando…' : 'Enviar para a nuvem'}
            </button>
            <button onClick={handleSyncFromSupabase} disabled={isSyncing} className="btn-outline">
              <ArrowDownCircle className="h-4 w-4" />
              Baixar da nuvem
            </button>
          </div>

          {syncResult && <Notice result={syncResult} />}

          <details className="group rounded-xl border border-line">
            <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium">
              SQL para criar as tabelas
            </summary>
            <pre className="select-all overflow-x-auto border-t border-line bg-soft p-4 font-mono text-[11px] leading-relaxed text-mute">
{`-- 1. Criação da tabela de Baralhos
create table if not exists decks (
  id text primary key,
  title text not null,
  description text,
  color text default '#0a0a0a',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Criação da tabela de Flashcards
create table if not exists flashcards (
  id text primary key,
  deck_id text references decks(id) on delete cascade,
  front text not null,
  back text not null,
  extra text,
  tags text[],
  state text default 'new',
  repetitions integer default 0,
  interval integer default 0,
  ease_factor numeric default 2.5,
  due_date timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Habilita acesso público / anon para teste direto (ou configure RLS se preferir autenticação)
alter table decks enable row level security;
alter table flashcards enable row level security;

create policy "Permitir leitura anonima" on decks for select using (true);
create policy "Permitir insercao anonima" on decks for insert with check (true);
create policy "Permitir update anonimo" on decks for update using (true);
create policy "Permitir delete anonimo" on decks for delete using (true);

create policy "Permitir leitura flashcards" on flashcards for select using (true);
create policy "Permitir insercao flashcards" on flashcards for insert with check (true);
create policy "Permitir update flashcards" on flashcards for update using (true);
create policy "Permitir delete flashcards" on flashcards for delete using (true);`}
            </pre>
          </details>
        </section>

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
      </main>
    </div>
  );
}
