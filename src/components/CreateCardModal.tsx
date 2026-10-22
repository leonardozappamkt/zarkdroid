'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Image as ImageIcon, Brackets, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Deck, Flashcard } from '@/types';
import RichText from '@/components/RichText';
import { wrapSelectionAsCloze } from '@/lib/cloze';
import { mediaMarkdown, uploadMedia } from '@/lib/media';

interface CreateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  decks: Deck[];
  currentDeckId?: string;
  onCreate: (cardData: Omit<Flashcard, 'id' | 'created_at' | 'updated_at'>) => void;
  /** When set, the modal edits this card instead of creating one. */
  card?: Flashcard | null;
  onUpdate?: (card: Flashcard) => void;
}

type Field = 'front' | 'back';

export default function CreateCardModal({
  isOpen,
  onClose,
  decks,
  currentDeckId,
  onCreate,
  card,
  onUpdate,
}: CreateCardModalProps) {
  const editing = !!card;
  const [deckId, setDeckId] = useState(currentDeckId || (decks[0]?.id || ''));
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [extra, setExtra] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const frontRef = useRef<HTMLTextAreaElement>(null);
  const backRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<Field>('front');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setPreview(false);
    if (card) {
      setDeckId(card.deck_id);
      setFront(card.front);
      setBack(card.back);
      setExtra(card.extra ?? '');
      setTagsInput((card.tags ?? []).join(', '));
    } else {
      setDeckId(currentDeckId || decks[0]?.id || '');
      setFront('');
      setBack('');
      setExtra('');
      setTagsInput('');
    }
  }, [isOpen, card, currentDeckId, decks]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim() || !deckId) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    if (card && onUpdate) {
      onUpdate({
        ...card,
        front: front.trim(),
        back: back.trim(),
        extra: extra.trim() || undefined,
        tags: tags.length ? tags : undefined,
        updated_at: new Date().toISOString(),
      });
      onClose();
      return;
    }

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

  const insertAtCursor = (field: Field, snippet: string) => {
    const ref = field === 'front' ? frontRef : backRef;
    const value = field === 'front' ? front : back;
    const set = field === 'front' ? setFront : setBack;
    const pos = ref.current?.selectionStart ?? value.length;
    set(value.slice(0, pos) + snippet + value.slice(pos));
  };

  const makeCloze = () => {
    const el = frontRef.current;
    if (!el) return;
    if (el.selectionStart === el.selectionEnd) {
      setError('Selecione no texto da frente a palavra que vira lacuna.');
      return;
    }
    setError('');
    setFront(wrapSelectionAsCloze(front, el.selectionStart, el.selectionEnd).text);
  };

  const startUpload = (field: Field) => {
    uploadTarget.current = field;
    fileRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const { url, kind } = await uploadMedia(file);
      insertAtCursor(uploadTarget.current, `\n${mediaMarkdown(url, kind)}\n`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar o arquivo.');
    } finally {
      setUploading(false);
    }
  };

  const toolButton = 'inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-mute hover:border-ink hover:text-ink disabled:opacity-40';

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
      <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight">{editing ? 'Editar card' : 'Novo card'}</h3>
          <button onClick={onClose} aria-label="Fechar" className="rounded-full p-1.5 text-mute hover:bg-soft hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {!editing && (
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
          )}

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label className="label !mb-0">Frente</label>
              <div className="flex gap-1.5">
                <button type="button" onClick={makeCloze} className={toolButton} title="Transforma o texto selecionado em lacuna">
                  <Brackets className="h-3.5 w-3.5" />
                  Lacuna
                </button>
                <button type="button" onClick={() => startUpload('front')} disabled={uploading} className={toolButton} title="Inserir imagem ou áudio">
                  {uploading && uploadTarget.current === 'front' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                  Mídia
                </button>
              </div>
            </div>
            <textarea
              ref={frontRef}
              rows={2}
              required
              autoFocus
              placeholder="Ex: to give up   ou   A capital da França é Paris"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              className="field resize-none"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label className="label !mb-0">Verso</label>
              <button type="button" onClick={() => startUpload('back')} disabled={uploading} className={toolButton} title="Inserir imagem ou áudio">
                {uploading && uploadTarget.current === 'back' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                Mídia
              </button>
            </div>
            <textarea
              ref={backRef}
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

          <p className="text-xs text-mute">
            Aceita Markdown (<span className="font-mono">**negrito**</span>, listas, <span className="font-mono">`código`</span>), fórmulas
            (<span className="font-mono">$x^2$</span>) e lacunas (<span className="font-mono">{'{{c1::resposta}}'}</span>).
          </p>

          {preview && (
            <div className="space-y-3 rounded-xl border border-line bg-soft p-4 text-sm">
              <RichText>{front || '_(frente vazia)_'}</RichText>
              <hr className="border-line" />
              <RichText>{back || '_(verso vazio)_'}</RichText>
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-xl border border-ink px-3.5 py-2.5 text-sm">
              {error}
            </p>
          )}

          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,audio/*" onChange={handleFile} className="hidden" />

          <div className="flex items-center justify-between gap-2 pt-2">
            <button type="button" onClick={() => setPreview((p) => !p)} className="btn-ghost">
              {preview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              Prévia
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="btn-ghost">
                Cancelar
              </button>
              <button type="submit" disabled={!front.trim() || !back.trim() || !deckId || uploading} className="btn-primary">
                {editing ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
