import type { ImportedCard } from './csv';

export interface LibraryDeck {
  id: string;
  title: string;
  description: string;
  level: string;
  count: number;
  load: () => Promise<ImportedCard[]>;
}

/** "front|back|extra" per line → cards. Only the first two "|" split, so the extra may contain more. */
export function parseLibraryRaw(raw: string): ImportedCard[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [front, back, ...rest] = line.split('|');
      const extra = rest.join('|').trim();
      return { front: front.trim(), back: (back ?? '').trim(), extra: extra || undefined, tags: [] };
    })
    .filter((c) => c.front && c.back);
}

const loader = (importer: () => Promise<{ default: string }>, tag: string) => async () =>
  parseLibraryRaw((await importer()).default).map((c) => ({ ...c, tags: [tag] }));

// `count` is verified against the data by the library test; keep it in sync when editing a deck.
export const LIBRARY: LibraryDeck[] = [
  {
    id: 'essential',
    title: 'Vocabulário essencial',
    description: 'As 590 palavras mais usadas do inglês, com tradução. Comece por aqui.',
    level: 'Iniciante',
    count: 590,
    load: loader(() => import('@/data/library/essential'), 'essencial'),
  },
  {
    id: 'irregular-verbs',
    title: 'Verbos irregulares',
    description: 'Passado e particípio dos verbos irregulares mais importantes, com o significado em português.',
    level: 'Iniciante',
    count: 88,
    load: loader(() => import('@/data/library/irregular-verbs'), 'verbos-irregulares'),
  },
  {
    id: 'phrasal-verbs',
    title: 'Phrasal verbs',
    description: 'Os phrasal verbs que mais aparecem no dia a dia, com um exemplo curto de cada um.',
    level: 'Intermediário',
    count: 98,
    load: loader(() => import('@/data/library/phrasal-verbs'), 'phrasal-verbs'),
  },
  {
    id: 'false-friends',
    title: 'Falsos cognatos',
    description: 'Palavras parecidas com o português, mas com outro sentido. As armadilhas clássicas de quem fala português.',
    level: 'Todos os níveis',
    count: 42,
    load: loader(() => import('@/data/library/false-friends'), 'falsos-cognatos'),
  },
  {
    id: 'intermediate-vocabulary',
    title: 'Vocabulário intermediário',
    description: 'Palavras para sair do básico, sem repetir as do vocabulário essencial.',
    level: 'Intermediário',
    count: 327,
    load: loader(() => import('@/data/library/intermediate-vocabulary'), 'intermediario'),
  },
  {
    id: 'business-english',
    title: 'Inglês para negócios',
    description: 'Termos de reunião, e-mail, finanças, vendas e carreira.',
    level: 'Intermediário',
    count: 112,
    load: loader(() => import('@/data/library/business-english'), 'negocios'),
  },
  {
    id: 'travel-survival',
    title: 'Viagem: frases de sobrevivência',
    description: 'Frases prontas para aeroporto, hotel, restaurante, compras e emergências. Este baralho usa frases, não só palavras.',
    level: 'Iniciante',
    count: 73,
    load: loader(() => import('@/data/library/travel-survival'), 'viagem'),
  },
];
