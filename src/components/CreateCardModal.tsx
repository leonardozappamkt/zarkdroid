'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
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

  useEffect(() => {
    if (isOpen) setDeckId(currentDeckId || decks[0]?.id || '');
  }, [isOpen, currentDeckId, decks]);

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
    <div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
      <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight">Novo card</h3>
          <button onClick={onClose} aria-label="Fechar" className="rounded-full p-1.5 text-mute hover:bg-soft hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">Baralho</label>
            <select value={deckId} onChange={(e) => setDeckId(e.target.value)} className="field">
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.total_cards})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Frente</label>
            <textarea
              rows={2}
              required
              autoFocus
              placeholder="Ex: to give up"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              className="field resize-none"
            />
          </div>

          <div>
            <label className="label">Verso</label>
            <textarea
              rows={3}
              required
              placeholder="Ex: desistir"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              className="field resize-none"
            />
          </div>

          <div>
            <label className="label">Exemplo ou dica (opcional)</label>
            <input
              type="text"
              placeholder="Ex: Never give up on your dreams."
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              className="field"
            />
          </div>

          <div>
            <label className="label">Tags (separadas por vírgula)</label>
            <input
              type="text"
              placeholder="ex: phrasal-verbs, b2"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="field"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancelar
            </button>
            <button type="submit" disabled={!front.trim() || !back.trim() || !deckId} className="btn-primary">
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
