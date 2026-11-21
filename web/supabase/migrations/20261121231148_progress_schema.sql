-- Chatterbox progress schema. Mirrors the contract in web/src/types/session.ts.
--
--   auth.users (parent login)
--     └── children            one row per kid
--           └── sessions      one practice session, one target sound
--                 └── attempts    one row per picture
--   words                     the picture list (word_id → sound, phonemes)
--
-- Writes go through save_session(); the dashboard reads the three views.
-- Every table has RLS: a parent only ever sees their own children's data.

-- ─────────────────────────────────────────────
-- Replace the early prototype tables (clients/sessions/attempts).
-- Refuses to run if they contain data, so nothing is silently lost.
-- ─────────────────────────────────────────────
do $$
declare
  t text;
  has_rows boolean;
begin
  foreach t in array array['attempts', 'sessions', 'clients'] loop
    if to_regclass(format('public.%I', t)) is not null then
      execute format('select exists (select 1 from public.%I)', t) into has_rows;
      if has_rows then
        raise exception 'public.% has rows; refusing to drop it. Migrate or clear it first.', t;
      end if;
    end if;
  end loop;
end
$$;

drop table if exists public.attempts, public.sessions, public.clients cascade;

-- ─────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────
create type public.sound as enum ('r', 'th');

create table public.words (
  id          text primary key,                 -- "rabbit"
  sound       public.sound not null,
  label       text not null,                    -- "Rabbit"
  phonemes    text[] not null,                  -- espeak IPA, one phoneme per element
  sort_order  smallint not null default 0
);

create table public.children (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (length(trim(name)) > 0),
  created_at  timestamptz not null default now()
);
create index children_parent_id_idx on public.children (parent_id);

create table public.sessions (
  id            uuid primary key default gen_random_uuid(),
  child_id      uuid not null references public.children (id) on delete cascade,
  sound         public.sound not null,
  started_at    timestamptz not null,
  completed_at  timestamptz not null default now(),
  check (completed_at >= started_at)
);
create index sessions_child_completed_idx on public.sessions (child_id, completed_at);

create table public.attempts (
  id                    bigint generated always as identity primary key,
  session_id            uuid not null references public.sessions (id) on delete cascade,
  word_id               text not null references public.words (id),
  item_index            smallint not null check (item_index >= 1),
  target_phonemes       text[] not null default '{}',
  heard_phonemes        text[] not null default '{}',
  target_sound_correct  boolean not null,
  score                 numeric(5, 2) not null check (score between 0 and 100),
  created_at            timestamptz not null default now(),
  unique (session_id, item_index)
);
create index attempts_word_id_idx on public.attempts (word_id);

-- ─────────────────────────────────────────────
-- Row-level security
-- ─────────────────────────────────────────────
alter table public.words    enable row level security;
alter table public.children enable row level security;
alter table public.sessions enable row level security;
alter table public.attempts enable row level security;

create policy "signed-in users read the word list"
  on public.words for select to authenticated
  using (true);

create policy "parents manage their own children"
  on public.children for all to authenticated
  using (parent_id = (select auth.uid()))
  with check (parent_id = (select auth.uid()));

create policy "parents read their children's sessions"
  on public.sessions for select to authenticated
  using (exists (
    select 1 from public.children c
    where c.id = child_id and c.parent_id = (select auth.uid())
  ));

create policy "parents add sessions for their children"
  on public.sessions for insert to authenticated
  with check (exists (
    select 1 from public.children c
    where c.id = child_id and c.parent_id = (select auth.uid())
  ));

create policy "parents delete their children's sessions"
  on public.sessions for delete to authenticated
  using (exists (
    select 1 from public.children c
    where c.id = child_id and c.parent_id = (select auth.uid())
  ));

create policy "parents read their children's attempts"
  on public.attempts for select to authenticated
  using (exists (
    select 1 from public.sessions s
    join public.children c on c.id = s.child_id
    where s.id = session_id and c.parent_id = (select auth.uid())
  ));

create policy "parents add attempts to their children's sessions"
  on public.attempts for insert to authenticated
  with check (exists (
    select 1 from public.sessions s
    join public.children c on c.id = s.child_id
    where s.id = session_id and c.parent_id = (select auth.uid())
  ));

-- Explicit grants: signed-out (anon) users get nothing.
revoke all on public.words, public.children, public.sessions, public.attempts from anon, authenticated;
grant select                         on public.words    to authenticated;
grant select, insert, update, delete on public.children to authenticated;
grant select, insert, delete         on public.sessions to authenticated;
grant select, insert                 on public.attempts to authenticated;

-- ─────────────────────────────────────────────
-- Write path: save_session (contract: SaveSessionArgs)
-- Runs as the caller (security invoker), so RLS still applies. The whole
-- session is saved in one transaction, or nothing is.
-- ─────────────────────────────────────────────
create function public.save_session(
  p_child_id   uuid,
  p_sound      public.sound,
  p_started_at timestamptz,
  p_attempts   jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_session_id uuid;
begin
  if jsonb_typeof(p_attempts) is distinct from 'array' or jsonb_array_length(p_attempts) = 0 then
    raise exception 'p_attempts must be a non-empty array' using errcode = '22023';
  end if;

  -- RLS hides other parents' children, so this doubles as an ownership check.
  if not exists (select 1 from public.children c where c.id = p_child_id) then
    raise exception 'child % not found', p_child_id using errcode = 'P0002';
  end if;

  insert into public.sessions (child_id, sound, started_at)
  values (p_child_id, p_sound, p_started_at)
  returning id into v_session_id;

  insert into public.attempts
    (session_id, word_id, item_index, target_phonemes, heard_phonemes, target_sound_correct, score)
  select
    v_session_id, a.word_id, a.item_index,
    coalesce(a.target_phonemes, '{}'), coalesce(a.heard_phonemes, '{}'),
    a.target_sound_correct, a.score
  from jsonb_to_recordset(p_attempts) as a(
    word_id text,
    item_index smallint,
    target_phonemes text[],
    heard_phonemes text[],
    target_sound_correct boolean,
    score numeric
  );

  if exists (
    select 1 from public.attempts at
    join public.words w on w.id = at.word_id
    where at.session_id = v_session_id and w.sound <> p_sound
  ) then
    raise exception 'every word in a % session must target the % sound', p_sound, p_sound
      using errcode = '22023';
  end if;

  return v_session_id;
end;
$$;

revoke execute on function public.save_session(uuid, public.sound, timestamptz, jsonb) from public, anon;
grant  execute on function public.save_session(uuid, public.sound, timestamptz, jsonb) to authenticated;

-- ─────────────────────────────────────────────
-- Read path: analytics views (contract: *Row types)
-- security_invoker makes them respect the RLS of the tables underneath.
-- ─────────────────────────────────────────────
create view public.session_progress with (security_invoker = true) as
select
  s.child_id,
  s.id as session_id,
  s.sound,
  s.completed_at,
  count(a.id)::int                                        as total_items,
  (count(a.id) filter (where a.target_sound_correct))::int as correct_count,
  coalesce(round(
    100.0 * count(a.id) filter (where a.target_sound_correct) / nullif(count(a.id), 0), 1
  ), 0)::float8                                           as accuracy
from public.sessions s
left join public.attempts a on a.session_id = s.id
group by s.id;

-- Days are UTC dates.
create view public.overall_progress with (security_invoker = true) as
select
  s.child_id,
  (s.completed_at at time zone 'UTC')::date               as day,
  count(a.id)::int                                        as total_items,
  (count(a.id) filter (where a.target_sound_correct))::int as correct_count,
  round(
    100.0 * count(a.id) filter (where a.target_sound_correct) / count(a.id), 1
  )::float8                                               as accuracy
from public.sessions s
join public.attempts a on a.session_id = s.id
group by s.child_id, (s.completed_at at time zone 'UTC')::date;

create view public.word_difficulty with (security_invoker = true) as
select
  s.child_id,
  a.word_id,
  w.sound,
  count(*)::int                                               as attempts,
  (count(*) filter (where not a.target_sound_correct))::int   as misses,
  round(
    100.0 * count(*) filter (where not a.target_sound_correct) / count(*), 1
  )::float8                                                   as miss_rate
from public.attempts a
join public.sessions s on s.id = a.session_id
join public.words w    on w.id = a.word_id
group by s.child_id, a.word_id, w.sound;

revoke all on public.session_progress, public.overall_progress, public.word_difficulty from anon, authenticated;
grant select on public.session_progress, public.overall_progress, public.word_difficulty to authenticated;

-- ─────────────────────────────────────────────
-- Word list (reference data). Phonemes from espeak-ng en-us, matching the
-- wav2vec2 phoneme model's output alphabet.
-- ─────────────────────────────────────────────
insert into public.words (id, sound, label, phonemes, sort_order) values
  ('rabbit',   'r',  'Rabbit',   '{ɹ,æ,b,ɪ,t}',     1),
  ('raccoon',  'r',  'Raccoon',  '{ɹ,æ,k,uː,n}',    2),
  ('rooster',  'r',  'Rooster',  '{ɹ,uː,s,t,ɚ}',    3),
  ('rhino',    'r',  'Rhino',    '{ɹ,aɪ,n,oʊ}',     4),
  ('reindeer', 'r',  'Reindeer', '{ɹ,eɪ,n,d,ɪɹ}',   5),
  ('robin',    'r',  'Robin',    '{ɹ,ɑː,b,ɪ,n}',    6),
  ('rat',      'r',  'Rat',      '{ɹ,æ,t}',         7),
  ('frog',     'r',  'Frog',     '{f,ɹ,ɑː,ɡ}',      8),
  ('parrot',   'r',  'Parrot',   '{p,æ,ɹ,ə,t}',     9),
  ('crab',     'r',  'Crab',     '{k,ɹ,æ,b}',       10),
  ('moth',     'th', 'Moth',     '{m,ɑː,θ}',        1),
  ('sloth',    'th', 'Sloth',    '{s,l,ɑː,θ}',      2),
  ('panther',  'th', 'Panther',  '{p,æ,n,θ,ɚ}',     3),
  ('python',   'th', 'Python',   '{p,aɪ,θ,ə,n}',    4),
  ('mammoth',  'th', 'Mammoth',  '{m,æ,m,ə,θ}',     5),
  ('thrush',   'th', 'Thrush',   '{θ,ɹ,ʌ,ʃ}',       6),
  ('thumb',    'th', 'Thumb',    '{θ,ʌ,m}',         7),
  ('three',    'th', 'Three',    '{θ,ɹ,iː}',        8),
  ('teeth',    'th', 'Teeth',    '{t,iː,θ}',        9),
  ('bath',     'th', 'Bath',     '{b,æ,θ}',         10);
