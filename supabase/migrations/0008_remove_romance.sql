-- ============================================================================
--  0008 — FJERN ROMANSAIANSA (Tinder-modus droppet fra spillet).
--
--  Kjøres KUN hvis 0006_romance.sql noen gang ble kjørt i dette prosjektet.
--  Viktigst: 0006 la romanse-gates inn i submit_vote (dag 1 krevde profil,
--  dag 2 krevde ferdig swiping) — uten denne rollbacken ville INGEN fått
--  stemt på dag 1/2 nå som appen ikke lenger kan lage profiler.
--
--  Trygg å kjøre flere ganger, og trygg selv om 0006 aldri ble kjørt
--  (alt er `if exists` / `create or replace`). Rører ikke votes.
-- ============================================================================

-- 1) Gjenopprett submit_vote slik den var i 0004 (uten romanse-gate).
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

revoke all on function public.submit_vote(int, text, text) from public;
grant execute on function public.submit_vote(int, text, text) to authenticated;

-- 2) Dropp romanse-RPC-ene.
drop function if exists public.create_romance_profile(text, text, text[], jsonb);
drop function if exists public.get_romance_status();
drop function if exists public.get_swipe_deck();
drop function if exists public.record_swipe(uuid, boolean);
drop function if exists public.get_my_match();
drop function if exists public.cancel_match();
drop function if exists public.assign_matches();
drop function if exists public.get_romance_assigned();
drop function if exists public.romance_deck_targets(uuid);

-- 3) Dropp romanse-tabellene.
drop table if exists public.romance_matches;
drop table if exists public.romance_swipes;
drop table if exists public.romance_profiles;
drop table if exists public.romance_state;

-- 4) Storage: fjern policyer for profilbilde-bucketen. Selve bucketen
--    ('profiles') og evt. opplastede bilder slettes manuelt i dashbordet.
drop policy if exists "profiles upload own" on storage.objects;
drop policy if exists "profiles delete own" on storage.objects;
drop policy if exists "profiles read authenticated" on storage.objects;
