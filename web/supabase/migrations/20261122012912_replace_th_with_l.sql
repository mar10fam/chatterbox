-- Replace the /th/ practice sound with /l/.
--
-- The phoneme model couldn't reliably tell /θ/ from /f/ on real voices, while
-- /l/ vs the typical childhood error [w] ("wion") is detected reliably. See
-- speech/ for the evaluation.
--
-- The enum value is renamed in place ('th' → 'l'), so the column types, views
-- and save_session() keep working unchanged. Existing /th/ sessions can't be
-- converted (their words no longer exist), so they're deleted. At the time of
-- writing only seeded test data had any; the guard below refuses to run if a
-- real account does.

do $$
begin
  if exists (
    select 1
    from public.sessions s
    join public.children c on c.id = s.child_id
    join auth.users u on u.id = c.parent_id
    where s.sound = 'th' and u.email <> 'parent@chatterbox.test'
  ) then
    raise exception 'Real /th/ sessions exist; refusing to delete them. Export or migrate them first.';
  end if;
end
$$;

-- Attempts cascade from sessions.
delete from public.sessions where sound = 'th';
delete from public.words where sound = 'th';

alter type public.sound rename value 'th' to 'l';

-- /l/ word list. Each word has an /l/ right before a vowel, which is where
-- the scorer judges it. Phonemes from espeak-ng en-us.
insert into public.words (id, sound, label, phonemes, sort_order) values
  ('lion',     'l', 'Lion',     '{l,aɪə,n}',          1),
  ('lamb',     'l', 'Lamb',     '{l,æ,m}',            2),
  ('leopard',  'l', 'Leopard',  '{l,ɛ,p,ɚ,d}',        3),
  ('llama',    'l', 'Llama',    '{l,ɑː,m,ə}',         4),
  ('lizard',   'l', 'Lizard',   '{l,ɪ,z,ɚ,d}',        5),
  ('lobster',  'l', 'Lobster',  '{l,ɑː,b,s,t,ɚ}',     6),
  ('ladybug',  'l', 'Ladybug',  '{l,eɪ,d,ɪ,b,ʌ,ɡ}',   7),
  ('lemur',    'l', 'Lemur',    '{l,iː,m,ɚ}',         8),
  ('koala',    'l', 'Koala',    '{k,oʊ,ɑː,l,ə}',      9),
  ('flamingo', 'l', 'Flamingo', '{f,l,ɐ,m,ɪ,ŋ,ɡ,oʊ}', 10);
