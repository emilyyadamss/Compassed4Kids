-- Compassed for Kids — schema.
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).
--
-- One row per record, with the app's camelCase object kept as-is in `data`
-- (jsonb), so model.js stays the single source of truth for shape. `user_id`
-- is the family account; row level security is what keeps one family's kids
-- invisible to every other family. The foreign keys exist so that deleting a
-- kid takes their activities and completions with them.

create table if not exists public.kids (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kid_id uuid not null references public.kids(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.completions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kid_id uuid not null references public.kids(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb
);

create index if not exists kids_user_id_idx on public.kids(user_id);
create index if not exists activities_user_id_idx on public.activities(user_id);
create index if not exists activities_kid_id_idx on public.activities(kid_id);
create index if not exists completions_user_id_idx on public.completions(user_id);
create index if not exists completions_kid_id_idx on public.completions(kid_id);
create index if not exists completions_activity_id_idx on public.completions(activity_id);

alter table public.kids enable row level security;
alter table public.activities enable row level security;
alter table public.completions enable row level security;
alter table public.settings enable row level security;

create policy "own kids" on public.kids
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own activities" on public.activities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own completions" on public.completions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own settings" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Live notifications. With completions in the realtime publication, a parent
-- with the app open sees a check-off land the moment the kid taps it — on
-- another device, in another room. RLS still applies to realtime, so a family
-- only ever receives its own rows.
alter publication supabase_realtime add table public.completions;
