'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2, Upload } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { storage } from '@/lib/storage';
import { parseApkg, type AnkiDeck } from '@/lib/anki';
import { looksLikeHeader, parseTable, rowsToCards, type ColumnMapping, type ParsedTable } from '@/lib/csv';

const MAX_CARDS = 20000;

type Source =
  | { kind: 'anki'; decks: AnkiDeck[] }
  | { kind: 'table'; table: ParsedTable; fileName: string };

export default function ImportPage() {
  const [source, setSource] = useState<Source | null>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ decks: number; cards: number; synced: boolean } | null>(null);
  const [importing, setImporting] = useState(false);

  // Anki: decks the user keeps ticked.
  const [selectedDecks, setSelectedDecks] = useState<Set<string>>(new Set());
  // Table: header row, mapping and deck name.
  const [hasHeader, setHasHeader] = useState(false);
  const [mapping, setMapping] = useState<ColumnMapping>({ front: 0, back: 1, extra: -1, tags: -1 });
  const [deckName, setDeckName] = useState('');

  const reset = () => {
    setSource(null);
    setResult(null);
    setError('');
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    reset();
    setReading(true);
    try {
      if (/\.apkg$/i.test(file.name)) {
        const decks = await parseApkg(await file.arrayBuffer(), { locateFile: () => '/sql-wasm.wasm' });
        if (decks.length === 0) throw new Error('Não encontramos cards neste arquivo.');
        setSource({ kind: 'anki', decks });
        setSelectedDecks(new Set(decks.map((d) => d.name)));
      } else {
        const table = parseTable(await file.text());
        if (table.rows.length === 0 || table.rows[0].length < 2) throw new Error('Não encontramos pelo menos duas colunas (frente e verso).');
        setSource({ kind: 'table', table, fileName: file.name });
        setHasHeader(looksLikeHeader(table.rows[0]));
        setMapping({ front: 0, back: 1, extra: table.rows[0].length > 2 && table.meta.tagsColumn !== 2 ? 2 : -1, tags: table.meta.tagsColumn ?? -1 });
        setDeckName(file.name.replace(/\.[^.]+$/, ''));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível ler este arquivo.');
    } finally {
      setReading(false);
    }
  };

  const tableCards = source?.kind === 'table'
    ? rowsToCards(hasHeader ? source.table.rows.slice(1) : source.table.rows, mapping, source.table.meta.html)
    : [];
  const ankiSelected = source?.kind === 'anki' ? source.decks.filter((d) => selectedDecks.has(d.name)) : [];
  const totalToImport = source?.kind === 'anki' ? ankiSelected.reduce((n, d) => n + d.cards.length, 0) : tableCards.length;

  const doImport = async () => {
    if (!source || totalToImport === 0) return;
    if (totalToImport > MAX_CARDS) {
      setError(`O limite é de ${MAX_CARDS.toLocaleString('pt-BR')} cards por importação. Divida o arquivo.`);
      return;
    }
    setImporting(true);
    setError('');
    try {
      const payload =
        source.kind === 'anki'
          ? ankiSelected.map((d) => ({ title: d.name, description: 'Importado do Anki', cards: d.cards }))
          : [{ title: deckName.trim() || 'Baralho importado', description: 'Importado de arquivo', cards: tableCards }];
      setResult(await storage.importDecks(payload));
      setSource(null);
    } catch {
      setError('Não foi possível importar. Confira o arquivo e tente de novo.');
    } finally {
      setImporting(false);
    }
  };

  const columns = source?.kind === 'table' ? source.table.rows[0].length : 0;
  const colLabel = (i: number) => (source?.kind === 'table' && hasHeader ? `${i + 1}: ${source.table.rows[0][i]}` : `Coluna ${i + 1}`);
  const select = (label: string, key: keyof ColumnMapping, optional = false) => (
    <div>
      <label className="label">{label}</label>
      <select value={mapping[key]} onChange={(e) => setMapping({ ...mapping, [key]: Number(e.target.value) })} className="field">
        {optional && <option value={-1}>Nenhuma</option>}
        {Array.from({ length: columns }, (_, i) => (
          <option key={i} value={i}>
            {colLabel(i)}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-10 sm:px-6">
        <div className="space-y-4">
          <Link href="/library" className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
            Biblioteca
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">Importar</h1>
          <p className="text-sm text-mute">
            Traga seus baralhos do Anki (<span className="font-mono">.apkg</span>) ou de uma planilha (<span className="font-mono">.csv</span>,{' '}
            <span className="font-mono">.tsv</span>, <span className="font-mono">.txt</span>). Os cards entram como novos.
          </p>
        </div>

        {result && (
          <div className="card space-y-4 p-6">
            <div className="flex items-center gap-2 font-medium">
              <Check className="h-5 w-5" />
              {result.cards.toLocaleString('pt-BR')} cards em {result.decks} baralho{result.decks === 1 ? '' : 's'} importados.
            </div>
            {!result.synced && <p className="text-sm text-mute">Salvo neste aparelho. A sincronização com a nuvem falhou e será tentada de novo.</p>}
            <div className="flex gap-2">
              <Link href="/" className="btn-primary">
                Ver baralhos
              </Link>
              <button onClick={reset} className="btn-outline">
                Importar outro
              </button>
            </div>
          </div>
        )}

        {!result && (
          <label className="card flex cursor-pointer flex-col items-center gap-3 border-dashed p-10 text-center hover:border-ink">
            {reading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
            <span className="font-medium">{reading ? 'Lendo o arquivo…' : 'Escolher arquivo'}</span>
            <span className="text-xs text-mute">.apkg, .csv, .tsv ou .txt</span>
            <input type="file" accept=".apkg,.csv,.tsv,.txt,text/plain,text/csv" onChange={handleFile} className="hidden" />
          </label>
        )}

        {error && (
          <p role="alert" className="rounded-xl border border-ink px-3.5 py-2.5 text-sm">
            {error}
          </p>
        )}

        {source?.kind === 'anki' && (
          <section className="card space-y-5 p-6">
            <h2 className="text-lg font-semibold tracking-tight">Baralhos encontrados</h2>
            <ul className="divide-y divide-line">
              {source.decks.map((d) => (
                <li key={d.name}>
                  <label className="flex cursor-pointer items-center gap-3 py-3 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedDecks.has(d.name)}
                      onChange={(e) => {
                        const next = new Set(selectedDecks);
                        if (e.target.checked) next.add(d.name);
                        else next.delete(d.name);
                        setSelectedDecks(next);
                      }}
                      className="h-4 w-4 accent-[rgb(var(--ink))]"
                    />
                    <span className="flex-1">{d.name}</span>
                    <span className="font-mono text-mute">{d.cards.length}</span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="text-xs text-mute">
              Entram os textos, tags e lacunas. Imagens, áudios e o histórico de estudo do Anki não são importados: os cards começam como novos.
            </p>
          </section>
        )}

        {source?.kind === 'table' && (
          <section className="card space-y-5 p-6">
            <h2 className="text-lg font-semibold tracking-tight">Colunas</h2>
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--ink))]" />
              A primeira linha é um cabeçalho
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              {select('Frente', 'front')}
              {select('Verso', 'back')}
              {select('Dica ou exemplo', 'extra', true)}
              {select('Tags', 'tags', true)}
            </div>
            <div>
              <label className="label">Nome do baralho</label>
              <input value={deckName} onChange={(e) => setDeckName(e.target.value)} className="field" />
            </div>

            <div>
              <p className="label">Prévia</p>
              <ul className="divide-y divide-line rounded-xl border border-line text-sm">
                {tableCards.slice(0, 5).map((c, i) => (
                  <li key={i} className="grid gap-1 px-4 py-2.5 sm:grid-cols-2 sm:gap-4">
                    <span className="font-medium">{c.front}</span>
                    <span className="text-mute">{c.back}</span>
                  </li>
                ))}
                {tableCards.length === 0 && <li className="px-4 py-3 text-mute">Nenhum card com frente e verso preenchidos.</li>}
              </ul>
            </div>
          </section>
        )}

        {source && (
          <div className="flex items-center justify-between gap-3">
            <button onClick={reset} className="btn-ghost">
              Cancelar
            </button>
            <button onClick={doImport} disabled={importing || totalToImport === 0} className="btn-primary">
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Importar {totalToImport.toLocaleString('pt-BR')} cards
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
