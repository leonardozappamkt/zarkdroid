'use client';

import React, { useState } from 'react';
import { X, PlusCircle, Tag } from 'lucide-react';
import { Deck, Flashcard } from '@/types';

interface CreateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  decks: Deck[];
  currentDeckId?: string;
  onCreate: (cardData: Omit<Flashcard, 'id' | 'created_at' | 'updated_at'>) => void;
}

export default function CreateCardModal({
  isOpen,
  onClose,
  decks,
  currentDeckId,
  onCreate,
}: CreateCardModalProps) {
  const [deckId, setDeckId] = useState(currentDeckId || (decks[0]?.id || ''));
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [extra, setExtra] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim() || !deckId) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    onCreate({
      deck_id: deckId,
      front: front.trim(),
      back: back.trim(),
      extra: extra.trim() || undefined,
      tags: tags.length ? tags : undefined,
      state: 'new',
      repetitions: 0,
      interval: 0,
      ease_factor: 2.5,
      due_date: new Date().toISOString(),
    });

    setFront('');
    setBack('');
    setExtra('');
    setTagsInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <PlusCircle className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-semibold text-white">Adicionar Novo Flashcard</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Baralho de Destino *
            </label>
            <select
              value={deckId}
              onChange={(e) => setDeckId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.total_cards} cards)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Frente (Pergunta ou Termo) *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Ex: O que é Virtual DOM?"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Verso (Resposta ou Explicação) *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Ex: Uma representação em memória do DOM real mantida por bibliotecas como o React..."
              value={back}
              onChange={(e) => setBack(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Dica ou Exemplo Adicional (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Nota mnemônica, dica rápida ou link de referência"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Tags (Separadas por vírgula)
              </label>
            </div>
            <input
              type="text"
              placeholder="ex: javascript, react, avançado"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!front.trim() || !back.trim() || !deckId}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-lg shadow-emerald-600/30 transition-all"
            >
              Adicionar Card
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
