-- Zarkdroid: tabelas com isolamento por usuário (RLS). Rodar no SQL Editor do Supabase.
-- Seguro para rodar mais de uma vez (não apaga dados).
--
-- Se você já criou as tabelas da versão antiga, rode ANTES, uma única vez:
--   drop table if exists flashcards;
--   drop table if exists decks;
--
-- A chave primária é (user_id, id): cada usuário tem seu próprio espaço de ids,
-- então os baralhos de exemplo (deck-1, deck-2...) não colidem entre contas.

create table if not exists decks (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  title text not null,
  description text,
  color text default '#0a0a0a',
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, id)
);

create table if not exists flashcards (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  deck_id text not null,
  front text not null,
  back text not null,
  extra text,
  tags text[],
  state text default 'new',
  repetitions integer default 0,
  interval integer default 0,
  ease_factor numeric default 2.5,
  due_date timestamptz default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, id),
  foreign key (user_id, deck_id) references decks(user_id, id) on delete cascade
);

create index if not exists flashcards_deck_idx on flashcards(user_id, deck_id);

alter table decks enable row level security;
alter table flashcards enable row level security;

drop policy if exists "own decks" on decks;
drop policy if exists "own flashcards" on flashcards;

create policy "own decks" on decks
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own flashcards" on flashcards
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
