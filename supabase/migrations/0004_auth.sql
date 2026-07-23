-- ============================================================================
--  GF-mordet — innlogging (Supabase Auth, brukernavn + passord)
--  Kjør dette i Supabase SQL Editor ETTER 0001_init.sql.
--
--  Bakgrunn: spilleren identifiseres nå av en ekte Auth-bruker (auth.uid())
--  i stedet for en tilfeldig localStorage-id. Passord hashes av Supabase
--  (bcrypt) — vi lagrer aldri passord selv. Brukernavn + visningsnavn ligger i
--  auth.users.user_metadata (ingen egen profiltabell nødvendig).
--
--  Sikkerhetsmodellen fra 0001 beholdes: RLS på, INGEN direkte tabellpolicyer,
--  all skriving via SECURITY DEFINER-RPC-er. Identitet leses server-side fra
--  auth.uid()/auth.jwt() slik at klienten ikke kan forfalske hvem som stemmer.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  votes: knytt stemmer til auth-brukeren i stedet for localStorage-id.
--  Pre-launch: eventuelle test-stemmer tømmes (den gamle player_id-en har
--  ingen tilsvarende auth-bruker). Trygt før spillet starter.
-- ---------------------------------------------------------------------------
delete from public.votes;

alter table public.votes
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- player_id er nå legacy (beholdes nullable for historikk, ikke lenger i bruk).
alter table public.votes alter column player_id drop not null;

alter table public.votes drop constraint if exists votes_day_player_id_key;
create unique index if not exists votes_day_user_id_key on public.votes (day, user_id);

-- ---------------------------------------------------------------------------
--  RPC: send inn / oppdater stemme — nå autentisert.
--  Identitet + navn hentes server-side, ikke fra klient-parametre.
-- ---------------------------------------------------------------------------
drop function if exists public.submit_vote(int, uuid, text, text, text);

create or replace function public.submit_vote(
  p_day int,
  p_choice text,
  p_free_text text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg public.case_config;
  uid uuid := auth.uid();
  uname text := coalesce(
    nullif(trim(auth.jwt() -> 'user_metadata' ->> 'display_name'), ''),
    'Ukjent etterforsker'
  );
begin
  if uid is null then
    raise exception 'Ikke innlogget';
  end if;

  select * into cfg from public.case_config where day = p_day;
  if cfg is null then
    raise exception 'Ukjent dag';
  end if;
  if now() < cfg.release_at then
    raise exception 'Dagen er ikke åpnet ennå';
  end if;
  if cfg.closes_at is not null and now() > cfg.closes_at then
    raise exception 'Avstemningen for denne dagen er stengt';
  end if;

  insert into public.votes (day, user_id, player_name, choice, free_text)
  values (p_day, uid, uname, nullif(p_choice, ''), nullif(p_free_text, ''))
  on conflict (day, user_id) do update
    set choice      = excluded.choice,
        free_text   = excluded.free_text,
        player_name = excluded.player_name,
        updated_at  = now();
end;
$$;

-- ---------------------------------------------------------------------------
--  RPC: hent den innloggede brukerens EGNE stemmer (alle dager på én gang).
--  Autoritativ kilde på tvers av enheter — erstatter localStorage-«min stemme».
--  Røper aldri andres stemmer; kun auth.uid() sine egne rader.
-- ---------------------------------------------------------------------------
create or replace function public.get_my_votes()
returns table(day int, choice text, free_text text)
language sql
security definer
set search_path = public
as $$
  select v.day, v.choice, v.free_text
  from public.votes v
  where v.user_id = auth.uid()
  order by v.day;
$$;

-- ---------------------------------------------------------------------------
--  Rettigheter: skriving kun for innloggede; lesing (uten tidslås-lekkasje)
--  for både anon og authenticated (UnlockProvider spør før innlogging).
-- ---------------------------------------------------------------------------
revoke all on function public.submit_vote(int, text, text) from public;
grant execute on function public.submit_vote(int, text, text) to authenticated;

revoke all on function public.get_my_votes() from public;
grant execute on function public.get_my_votes() to authenticated;

grant execute on function public.get_unlocked_days() to authenticated;
grant execute on function public.get_results(int) to authenticated;
grant execute on function public.get_free_text(int) to authenticated;

-- Valgfrie RPC-er fra 0002/0003 — grant kun hvis de er kjørt (ellers no-op).
-- Uten dette får innloggede brukere «permission denied» (authenticated arver
-- IKKE anon sine rettigheter), og nedtelling/live-resultater faller stille bort.
do $$
begin
  if to_regprocedure('public.get_schedule()') is not null then
    grant execute on function public.get_schedule() to authenticated;
  end if;
  if to_regprocedure('public.get_live_results(int)') is not null then
    grant execute on function public.get_live_results(int) to authenticated;
  end if;
end $$;
