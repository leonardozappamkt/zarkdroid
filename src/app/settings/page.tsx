'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Database,
  Server,
  Cloud,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Flame,
  Globe,
  Send,
  ArrowDownCircle,
  Check
} from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Back Link */}
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Painel</span>
          </Link>
          <span>/</span>
          <span className="text-slate-200 font-medium">Configurações & Integrações</span>
        </div>

        {/* Port 3004 Info Card */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Porta Fixa: localhost:3004</span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Ativa
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                O script <code>npm run dev</code> está permanentemente configurado com <code>next dev -p 3004</code>.
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sempre que você inicializar este projeto, ele abrirá obrigatoriamente na porta <strong>3004</strong>{' '}
            (<code>http://localhost:3004</code>), sem riscos de alternar acidentalmente para outra porta.
          </p>
        </div>

        {/* Supabase Connection */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Conexão Supabase</span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                      isConfigured
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {isConfigured ? 'Credenciais Prontas' : 'Aguardando Credenciais'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Sincronização em nuvem para seus baralhos e revisões em múltiplos dispositivos.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveSupabase} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                NEXT_PUBLIC_SUPABASE_URL
              </label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                📌 A URL do projeto deve começar com <code className="text-emerald-400">https://</code> e terminar com <code className="text-emerald-400">.supabase.co</code> (ex: <em>https://seu-id.supabase.co</em>).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </label>
              <input
                type="password"
                placeholder="sb_publishable_... ou eyJhbGciOiJIUzI1NiIsIn..."
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                🔑 Cole aqui a sua chave pública (começa com <code className="text-blue-400">sb_publishable_...</code> ou <code className="text-blue-400">eyJhbG...</code>).
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Testando...' : 'Testar Conexão'}</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Salvar Credenciais</span>
              </button>
            </div>

            {saveSuccess && (
              <p className="text-xs text-emerald-400 font-medium animate-fade-in">
                ✓ Credenciais salvas com sucesso!
              </p>
            )}

            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </form>

          {/* Cloud Sync Actions */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3">
            <button
              onClick={handleSyncToSupabase}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSyncing ? 'Enviando...' : 'Enviar Baralhos para Nuvem'}</span>
            </button>

            <button
              onClick={handleSyncFromSupabase}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <ArrowDownCircle className="w-3.5 h-3.5" />
              <span>Baixar Dados da Nuvem</span>
            </button>
          </div>

          {syncResult && (
            <div
              className={`p-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                syncResult.success
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-300 border-red-500/20'
              }`}
            >
              {syncResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{syncResult.message}</span>
            </div>
          )}

          {/* SQL Schema helper */}
          <div className="mt-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Script SQL para Criar as Tabelas no Supabase (SQL Editor)
            </h4>
            <pre className="text-[11px] font-mono text-slate-400 overflow-x-auto p-3 bg-slate-900 rounded-xl border border-slate-800 select-all">
{`-- 1. Criação da tabela de Baralhos
create table if not exists decks (
  id text primary key,
  title text not null,
  description text,
  color text default '#3b82f6',
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
          </div>
        </div>

        {/* Vercel Deploy Guide */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Deploy na Vercel</h2>
              <p className="text-xs text-slate-400">
                Como publicar o Zarkdroid na Vercel com um clique.
              </p>
            </div>
          </div>
          <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
            <li>Suba este repositório para o seu GitHub (ou use a CLI <code>vercel</code>).</li>
            <li>No painel da Vercel, clique em <strong>Add New Project</strong> e importe o repositório.</li>
            <li>Em <strong>Environment Variables</strong>, adicione as chaves <code>NEXT_PUBLIC_SUPABASE_URL</code> e <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.</li>
            <li>Clique em <strong>Deploy</strong> e seu SaaS estará no ar com HTTPS e CDN global!</li>
          </ol>
        </div>

        {/* Backup & Data Management */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Gerenciamento de Dados & Backup Local</h2>
              <p className="text-xs text-slate-400">
                Exporte ou importe seus baralhos em formato JSON.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Backup (JSON)</span>
            </button>

            <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Importar Backup (JSON)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>

            <button
              onClick={handleResetSampleData}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-colors ml-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restaurar Amostras</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
