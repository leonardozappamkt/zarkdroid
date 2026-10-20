'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CreateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, description: string, color: string) => void;
}

// Decks are monochrome in the UI; the field is kept in the data model for sync compatibility.
const DEFAULT_COLOR = '#0a0a0a';

export default function CreateDeckModal({ isOpen, onClose, onCreate }: CreateDeckModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate(title.trim(), description.trim(), DEFAULT_COLOR);
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight">Novo baralho</h3>
          <button onClick={onClose} aria-label="Fechar" className="rounded-full p-1.5 text-mute hover:bg-soft hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">Nome</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ex: Phrasal Verbs"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="field"
            />
          </div>

          <div>
            <label className="label">Descrição (opcional)</label>
            <textarea
              rows={3}
              placeholder="Do que se trata este baralho?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="field resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancelar
            </button>
            <button type="submit" disabled={!title.trim()} className="btn-primary">
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
