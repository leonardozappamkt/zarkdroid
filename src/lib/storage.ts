import { Deck, Flashcard } from '@/types';
import { getSupabaseClient } from './supabase';

const INITIAL_DECKS: Deck[] = [
  {
    id: 'deck-1',
    title: 'Vocabulário Essencial de Inglês',
    description: 'Palavras, expressões idiomáticas e phrasal verbs mais utilizados no dia a dia.',
    color: '#3b82f6',
    icon: 'languages',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_cards: 4,
    new_count: 2,
    learn_count: 1,
    due_count: 1,
  },
  {
    id: 'deck-2',
    title: 'React & Next.js Pro',
    description: 'Conceitos fundamentais de Server Components, Hooks, SSR e Renderização.',
    color: '#10b981',
    icon: 'code',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_cards: 3,
    new_count: 1,
    learn_count: 1,
    due_count: 1,
  },
  {
    id: 'deck-3',
    title: 'Medicina: Farmacologia Básica',
    description: 'Classes de medicamentos, mecanismos de ação e principais efeitos adversos.',
    color: '#8b5cf6',
    icon: 'pill',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_cards: 3,
    new_count: 1,
    learn_count: 1,
    due_count: 1,
  },
];

const INITIAL_CARDS: Flashcard[] = [
  // Deck 1
  {
    id: 'card-1',
    deck_id: 'deck-1',
    front: 'O que significa a expressão idiomática "Bite the bullet"?',
    back: 'Enfrentar uma situação difícil ou inevitável com coragem e determinação ("engolir o choro" ou "aguentar firme").',
    extra: 'Exemplo: "I have to bite the bullet and study for the exam."',
    tags: ['idioms', 'advanced'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    state: 'new',
    repetitions: 0,
    interval: 0,
    ease_factor: 2.5,
    due_date: new Date().toISOString(),
  },
  {
    id: 'card-2',
    deck_id: 'deck-1',
    front: 'Qual o significado do phrasal verb "Call it a day"?',
    back: 'Parar de trabalhar ou encerrar as atividades do dia.',
    extra: 'Exemplo: "We have made good progress, let’s call it a day."',
    tags: ['phrasal-verbs'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    state: 'learning',
    repetitions: 1,
    interval: 1,
    ease_factor: 2.5,
    due_date: new Date().toISOString(),
  },
  {
    id: 'card-3',
    deck_id: 'deck-1',
    front: 'Traduza e dê o contexto: "Hit the nail on the head".',
    back: 'Acertar na mosca / Acertar em cheio.',
    extra: 'Dizer ou fazer exatamente a coisa certa.',
    tags: ['idioms'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    state: 'review',
    repetitions: 3,
    interval: 4,
    ease_factor: 2.6,
    due_date: new Date().toISOString(),
  },
  {
    id: 'card-4',
    deck_id: 'deck-1',
    front: 'O que significa "Burn the midnight oil"?',
    back: 'Trabalhar ou estudar até tarde da noite.',
    tags: ['idioms'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    state: 'new',
    repetitions: 0,
    interval: 0,
    ease_factor: 2.5,
    due_date: new Date().toISOString(),
  },

  // Deck 2
  {
    id: 'card-5',
    deck_id: 'deck-2',
    front: 'Qual é a principal diferença entre Server Components e Client Components no Next.js (App Router)?',
    back: 'Server Components executam exclusivamente no servidor, gerando zero JavaScript no bundle do cliente. Client Components são hidratados no browser e suportam estado (`useState`), efeitos (`useEffect`) e ouvintes de eventos.',
    extra: 'Por padrão, todos os componentes dentro de `app` são Server Components.',
    tags: ['nextjs', 'react'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    state: 'new',
    repetitions: 0,
    interval: 0,
    ease_factor: 2.5,
    due_date: new Date().toISOString(),
  },
  {
    id: 'card-6',
    deck_id: 'deck-2',
    front: 'Para que serve a regra "use client" no topo de um arquivo no Next.js?',
    back: 'Marca uma fronteira entre o código do servidor e o código do cliente, instruindo o empacotador a compilar aquele módulo e seus filhos como Client Components.',
    tags: ['nextjs'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    state: 'review',
    repetitions: 2,
    interval: 2,
    ease_factor: 2.5,
    due_date: new Date().toISOString(),
  },
  {
    id: 'card-7',
    deck_id: 'deck-2',
    front: 'O que é a convenção `generateStaticParams` no Next.js?',
    back: 'Função usada em rotas dinâmicas para gerar estaticamente rotas durante o build (SSG), substituindo o antigo `getStaticPaths`.',
    tags: ['routing'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    state: 'learning',
    repetitions: 1,
    interval: 1,
    ease_factor: 2.4,
    due_date: new Date().toISOString(),
  },

  // Deck 3
  {
    id: 'card-8',
    deck_id: 'deck-3',
    front: 'Qual é o mecanismo de ação dos Inibidores da ECA (ex: Captopril, Enalapril)?',
    back: 'Inibem a Enzima Conversora de Angiotensina, impedindo a conversão de Angiotensina I em Angiotensina II, promovendo vasodilatação e diminuição da pressão arterial.',
    extra: 'Efeito colateral clássico: tosse seca (acúmulo de bradicinina).',
    tags: ['farmacologia', 'cardiologia'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    state: 'new',
    repetitions: 0,
    interval: 0,
    ease_factor: 2.5,
    due_date: new Date().toISOString(),
  },
  {
    id: 'card-9',
    deck_id: 'deck-3',
    front: 'Qual o antídoto padrão para intoxicação por Paracetamol (Acetaminofeno)?',
    back: 'N-acetilcisteína (NAC), que restaura os estoques de glutationa no fígado.',
    tags: ['toxicologia'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    state: 'review',
    repetitions: 2,
    interval: 3,
    ease_factor: 2.5,
    due_date: new Date().toISOString(),
  },
  {
    id: 'card-10',
    deck_id: 'deck-3',
    front: 'Qual é o principal neurotransmissor inibitório do Sistema Nervoso Central?',
    back: 'GABA (Ácido gama-aminobutírico).',
    tags: ['neurologia'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    state: 'learning',
    repetitions: 1,
    interval: 1,
    ease_factor: 2.5,
    due_date: new Date().toISOString(),
  },
];

const STORAGE_KEY_DECKS = 'zarkdroid_decks';
const STORAGE_KEY_CARDS = 'zarkdroid_cards';

export const storage = {
  getDecks(): Deck[] {
    if (typeof window === 'undefined') return INITIAL_DECKS;
    const data = localStorage.getItem(STORAGE_KEY_DECKS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_DECKS, JSON.stringify(INITIAL_DECKS));
      return INITIAL_DECKS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_DECKS;
    }
  },

  saveDecks(decks: Deck[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_DECKS, JSON.stringify(decks));
    }
  },

  getCards(deckId?: string): Flashcard[] {
    if (typeof window === 'undefined') {
      return deckId ? INITIAL_CARDS.filter((c) => c.deck_id === deckId) : INITIAL_CARDS;
    }
    const data = localStorage.getItem(STORAGE_KEY_CARDS);
    let cards = INITIAL_CARDS;
    if (data) {
      try {
        cards = JSON.parse(data);
      } catch {
        cards = INITIAL_CARDS;
      }
    } else {
      localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(INITIAL_CARDS));
    }
    return deckId ? cards.filter((c) => c.deck_id === deckId) : cards;
  },

  saveCards(cards: Flashcard[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(cards));
      this.recalculateDeckCounts(cards);
    }
  },

  recalculateDeckCounts(cards?: Flashcard[]): void {
    const allCards = cards || this.getCards();
    const decks = this.getDecks();
    const now = new Date();

    const updatedDecks = decks.map((deck) => {
      const deckCards = allCards.filter((c) => c.deck_id === deck.id);
      const new_count = deckCards.filter((c) => c.state === 'new').length;
      const learn_count = deckCards.filter((c) => c.state === 'learning').length;
      const due_count = deckCards.filter((c) => {
        if (c.state === 'review') {
          return new Date(c.due_date) <= now;
        }
        return false;
      }).length;

      return {
        ...deck,
        total_cards: deckCards.length,
        new_count,
        learn_count,
        due_count,
      };
    });

    this.saveDecks(updatedDecks);
  },

  updateCard(card: Flashcard): void {
    const cards = this.getCards();
    const index = cards.findIndex((c) => c.id === card.id);
    if (index !== -1) {
      cards[index] = card;
      this.saveCards(cards);
    }
  },

  createCard(card: Omit<Flashcard, 'id' | 'created_at' | 'updated_at'>): Flashcard {
    const now = new Date().toISOString();
    const newCard: Flashcard = {
      ...card,
      id: 'card-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      created_at: now,
      updated_at: now,
    };
    const cards = this.getCards();
    cards.push(newCard);
    this.saveCards(cards);
    return newCard;
  },

  deleteCard(cardId: string): void {
    const cards = this.getCards().filter((c) => c.id !== cardId);
    this.saveCards(cards);
  },

  createDeck(title: string, description: string, color?: string): Deck {
    const now = new Date().toISOString();
    const newDeck: Deck = {
      id: 'deck-' + Date.now(),
      title,
      description,
      color: color || '#3b82f6',
      created_at: now,
      updated_at: now,
      total_cards: 0,
      new_count: 0,
      learn_count: 0,
      due_count: 0,
    };
    const decks = this.getDecks();
    decks.push(newDeck);
    this.saveDecks(decks);
    return newDeck;
  },

  deleteDeck(deckId: string): void {
    const decks = this.getDecks().filter((d) => d.id !== deckId);
    const cards = this.getCards().filter((c) => c.deck_id !== deckId);
    this.saveDecks(decks);
    this.saveCards(cards);
  },
};
