'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Upload, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { storage } from '@/lib/storage';

export default function SettingsPage() {
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
