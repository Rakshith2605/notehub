create table if not exists public.notehub_notes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled',
  content text not null default '',
  language text not null default 'plaintext',
  folder_id text,
  tags text[] not null default '{}',
  pinned boolean not null default false,
  created_at bigint not null,
  updated_at bigint not null,
  versions jsonb not null default '[]'::jsonb
);

create table if not exists public.notehub_folders (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order bigint not null
);

create table if not exists public.notehub_tags (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default 'blue'
);

create table if not exists public.notehub_pats (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  token_hash text not null unique,
  prefix text not null,
  created_at bigint not null,
  last_used_at bigint
);

create index if not exists notehub_notes_user_id_idx on public.notehub_notes(user_id);
create index if not exists notehub_notes_user_updated_idx on public.notehub_notes(user_id, updated_at desc);
create index if not exists notehub_folders_user_id_idx on public.notehub_folders(user_id);
create index if not exists notehub_tags_user_id_idx on public.notehub_tags(user_id);
create index if not exists notehub_pats_user_id_idx on public.notehub_pats(user_id);
create index if not exists notehub_pats_token_hash_idx on public.notehub_pats(token_hash);

create table if not exists public.notehub_clipboard (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null default '',
  created_at bigint not null
);

create index if not exists notehub_clipboard_user_id_idx on public.notehub_clipboard(user_id);
create index if not exists notehub_clipboard_user_created_idx on public.notehub_clipboard(user_id, created_at desc);

alter table public.notehub_clipboard enable row level security;

drop policy if exists "Users can read their clipboard" on public.notehub_clipboard;
drop policy if exists "Users can insert their clipboard" on public.notehub_clipboard;
drop policy if exists "Users can delete their clipboard" on public.notehub_clipboard;

create policy "Users can read their clipboard"
  on public.notehub_clipboard for select
  using (auth.uid() = user_id);

create policy "Users can insert their clipboard"
  on public.notehub_clipboard for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their clipboard"
  on public.notehub_clipboard for delete
  using (auth.uid() = user_id);

alter table public.notehub_notes enable row level security;
alter table public.notehub_folders enable row level security;
alter table public.notehub_tags enable row level security;
alter table public.notehub_pats enable row level security;

drop policy if exists "Users can read their notes" on public.notehub_notes;
drop policy if exists "Users can insert their notes" on public.notehub_notes;
drop policy if exists "Users can update their notes" on public.notehub_notes;
drop policy if exists "Users can delete their notes" on public.notehub_notes;

create policy "Users can read their notes"
  on public.notehub_notes for select
  using (auth.uid() = user_id);

create policy "Users can insert their notes"
  on public.notehub_notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their notes"
  on public.notehub_notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their notes"
  on public.notehub_notes for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read their folders" on public.notehub_folders;
drop policy if exists "Users can insert their folders" on public.notehub_folders;
drop policy if exists "Users can update their folders" on public.notehub_folders;
drop policy if exists "Users can delete their folders" on public.notehub_folders;

create policy "Users can read their folders"
  on public.notehub_folders for select
  using (auth.uid() = user_id);

create policy "Users can insert their folders"
  on public.notehub_folders for insert
  with check (auth.uid() = user_id);

create policy "Users can update their folders"
  on public.notehub_folders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their folders"
  on public.notehub_folders for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read their tags" on public.notehub_tags;
drop policy if exists "Users can insert their tags" on public.notehub_tags;
drop policy if exists "Users can update their tags" on public.notehub_tags;
drop policy if exists "Users can delete their tags" on public.notehub_tags;

create policy "Users can read their tags"
  on public.notehub_tags for select
  using (auth.uid() = user_id);

create policy "Users can insert their tags"
  on public.notehub_tags for insert
  with check (auth.uid() = user_id);

create policy "Users can update their tags"
  on public.notehub_tags for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their tags"
  on public.notehub_tags for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read their pats" on public.notehub_pats;
drop policy if exists "Users can insert their pats" on public.notehub_pats;
drop policy if exists "Users can delete their pats" on public.notehub_pats;

create policy "Users can read their pats"
  on public.notehub_pats for select
  using (auth.uid() = user_id);

create policy "Users can insert their pats"
  on public.notehub_pats for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their pats"
  on public.notehub_pats for delete
  using (auth.uid() = user_id);