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

-- Exclusão de conta feita pelo próprio usuário (exigida pela Apple).
-- Apaga o usuário autenticado; baralhos e cards saem junto (on delete cascade).
-- Roda como dono da função, sem expor nenhuma chave secreta ao app.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  -- Apps conectados por OAuth (ex.: Claude via MCP) nunca podem excluir a conta.
  if (auth.jwt() ->> 'client_id') is not null then
    raise exception 'not allowed for connected apps';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- Apps conectados por OAuth (ex.: Claude via MCP) leem, criam e editam, mas NÃO excluem.
-- Tokens emitidos pelo servidor OAuth do Supabase trazem o claim `client_id`; o login normal não.
-- Política RESTRICTIVE: soma-se à "own ..." acima, então só passa quem é dono E não é app OAuth.
drop policy if exists "no delete via oauth" on decks;
drop policy if exists "no delete via oauth" on flashcards;

create policy "no delete via oauth" on decks
  as restrictive for delete to authenticated
  using ((auth.jwt() ->> 'client_id') is null);

create policy "no delete via oauth" on flashcards
  as restrictive for delete to authenticated
  using ((auth.jwt() ->> 'client_id') is null);

-- ============================================================================
-- FSRS (repetição espaçada moderna) + histórico de revisões
-- Rode este bloco ANTES de publicar a versão do app com FSRS. É seguro repetir.
-- ============================================================================

alter table flashcards add column if not exists stability double precision not null default 0;
alter table flashcards add column if not exists difficulty double precision not null default 0;
alter table flashcards add column if not exists lapses integer not null default 0;
alter table flashcards add column if not exists learning_steps integer not null default 0;
alter table flashcards add column if not exists last_review timestamptz;

create table if not exists review_logs (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  card_id text not null,
  deck_id text not null,
  rating smallint not null check (rating between 1 and 4), -- 1 errei, 2 difícil, 3 bom, 4 fácil
  state_before text not null,
  reviewed_at timestamptz not null default now(),
  scheduled_days double precision,
  stability double precision,
  difficulty double precision,
  primary key (user_id, id)
);

create index if not exists review_logs_user_time_idx on review_logs(user_id, reviewed_at desc);

alter table review_logs enable row level security;

drop policy if exists "own review_logs" on review_logs;
drop policy if exists "no delete via oauth" on review_logs;

create policy "own review_logs" on review_logs
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Apps conectados por OAuth (ex.: Claude via MCP) podem registrar revisões, mas não apagar o histórico.
create policy "no delete via oauth" on review_logs
  as restrictive for delete to authenticated
  using ((auth.jwt() ->> 'client_id') is null);

-- ============================================================================
-- Imagens e áudios nos cards (Storage)
-- Bucket público de leitura com caminhos imprevisíveis: cada usuário só escreve na própria pasta
-- (user_id/arquivo). Apps conectados por OAuth (ex.: Claude via MCP) não enviam nem apagam arquivos.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'card-media', 'card-media', true, 5242880,
  array['image/png','image/jpeg','image/webp','image/gif','audio/mpeg','audio/mp4','audio/webm','audio/ogg','audio/wav']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "card-media read" on storage.objects;
drop policy if exists "card-media insert own folder" on storage.objects;
drop policy if exists "card-media delete own" on storage.objects;

create policy "card-media read" on storage.objects
  for select to public
  using (bucket_id = 'card-media');

create policy "card-media insert own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'card-media'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (auth.jwt() ->> 'client_id') is null
  );

create policy "card-media delete own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'card-media'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (auth.jwt() ->> 'client_id') is null
  );
