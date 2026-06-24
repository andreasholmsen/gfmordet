-- ============================================================================
--  Mordmysteriet — Supabase-skjema
--  Kjør dette i Supabase SQL Editor (eller via Supabase CLI).
--
--  Designprinsipp: ALL tidslogikk håndheves server-side. Klienten kan ikke
--  åpne dager eller se resultater for tidlig ved å endre klokka på telefonen.
--  Det er INGEN policy som lar `anon` lese/skrive tabellene direkte — alt går
--  gjennom SECURITY DEFINER-funksjonene nederst. Derfor er anon-nøkkelen trygg
--  å legge i frontend.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  Tabeller
-- ---------------------------------------------------------------------------
create table if not exists public.case_config (
  day           int primary key,            -- 1..4
  question_type text not null,              -- 'multiple_choice' | 'free_text' | 'mc_with_other' | 'none'
  release_at    timestamptz not null,        -- når dagens mappe/avstemning åpnes
  closes_at     timestamptz,                 -- når avstemningen stenger (typisk = neste dags release_at)
  results_at    timestamptz not null         -- når dagens resultater blir offentlige (typisk = neste dags release_at)
);

create table if not exists public.votes (
  id          uuid primary key default gen_random_uuid(),
  day         int  not null references public.case_config(day),
  player_id   uuid not null,                 -- fra localStorage, ikke autentisert
  player_name text not null,
  choice      text,                          -- valgt option-id (flervalg), eller f.eks. 'annet'
  free_text   text,                          -- dag 2 alltid; dag 3 kun når choice = 'annet'
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (day, player_id)                    -- én stemme per dag per enhet
);

-- ---------------------------------------------------------------------------
--  RLS: på, men INGEN anon-policies => ingen direkte tabelltilgang.
--  (SECURITY DEFINER-funksjonene under omgår RLS på en kontrollert måte.)
-- ---------------------------------------------------------------------------
alter table public.case_config enable row level security;
alter table public.votes       enable row level security;

-- ---------------------------------------------------------------------------
--  RPC: hvilke dager er åpne nå
-- ---------------------------------------------------------------------------
create or replace function public.get_unlocked_days()
returns table(day int, question_type text)
language sql
security definer
set search_path = public
as $$
  select c.day, c.question_type
  from public.case_config c
  where now() >= c.release_at
  order by c.day;
$$;

-- ---------------------------------------------------------------------------
--  RPC: send inn / oppdater stemme (server-tid håndhevet)
-- ---------------------------------------------------------------------------
create or replace function public.submit_vote(
  p_day int,
  p_player_id uuid,
  p_name text,
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
begin
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
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Navn mangler';
  end if;

  insert into public.votes (day, player_id, player_name, choice, free_text)
  values (p_day, p_player_id, p_name, nullif(p_choice, ''), nullif(p_free_text, ''))
  on conflict (day, player_id) do update
    set choice      = excluded.choice,
        free_text   = excluded.free_text,
        player_name = excluded.player_name,
        updated_at  = now();
end;
$$;

-- ---------------------------------------------------------------------------
--  RPC: aggregerte resultater (kun etter results_at, aldri navn)
-- ---------------------------------------------------------------------------
create or replace function public.get_results(p_day int)
returns table(choice text, n bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg public.case_config;
begin
  select * into cfg from public.case_config where day = p_day;
  if cfg is null or now() < cfg.results_at then
    return;  -- tomt: resultatene er ikke frigitt ennå
  end if;
  return query
    select coalesce(v.choice, '(fritekst)') as choice, count(*)::bigint
    from public.votes v
    where v.day = p_day
    group by 1
    order by 2 desc;
end;
$$;

-- ---------------------------------------------------------------------------
--  RPC: anonymiserte fritekst-svar (kun etter results_at, aldri navn)
-- ---------------------------------------------------------------------------
create or replace function public.get_free_text(p_day int)
returns table(free_text text)
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg public.case_config;
begin
  select * into cfg from public.case_config where day = p_day;
  if cfg is null or now() < cfg.results_at then
    return;
  end if;
  return query
    select v.free_text
    from public.votes v
    where v.day = p_day and v.free_text is not null and trim(v.free_text) <> ''
    order by v.created_at;
end;
$$;

-- ---------------------------------------------------------------------------
--  Kun disse fire funksjonene er tilgjengelige for anon-nøkkelen.
-- ---------------------------------------------------------------------------
revoke all on function public.get_unlocked_days() from public;
revoke all on function public.submit_vote(int, uuid, text, text, text) from public;
revoke all on function public.get_results(int) from public;
revoke all on function public.get_free_text(int) from public;

grant execute on function public.get_unlocked_days() to anon;
grant execute on function public.submit_vote(int, uuid, text, text, text) to anon;
grant execute on function public.get_results(int) to anon;
grant execute on function public.get_free_text(int) to anon;

-- ============================================================================
--  SEED — utløsningsdatoer. JUSTER DISSE før spillet starter!
--  Tidssone: bruk eksplisitt 'Europe/Oslo' så grensene treffer norsk lokaltid.
--  Mønster: hver dag åpner kl. 09:00; forrige dags resultater + avstemnings-
--  stenging skjer når neste dag åpner.
--
--  Dag 1 er ALLTID åpen (release_at i fortiden) — mappen og avstemningen er
--  tilgjengelig med en gang. Men resultatene for dag 1 vises først når dag 2
--  slippes (results_at = 31. juli), og dag 1-avstemningen stenger samtidig.
-- ============================================================================
--   Dag 1: alltid åpen · Dag 2: fredag 31. juli · Dag 3: lørdag 1. august · Dag 4: søndag 2. august
insert into public.case_config (day, question_type, release_at, closes_at, results_at) values
  (1, 'multiple_choice', timestamptz '2020-01-01 00:00 Europe/Oslo', timestamptz '2026-07-31 09:00 Europe/Oslo', timestamptz '2026-07-31 09:00 Europe/Oslo'),
  (2, 'free_text',       timestamptz '2026-07-31 09:00 Europe/Oslo', timestamptz '2026-08-01 09:00 Europe/Oslo', timestamptz '2026-08-01 09:00 Europe/Oslo'),
  (3, 'mc_with_other',   timestamptz '2026-08-01 09:00 Europe/Oslo', timestamptz '2026-08-02 09:00 Europe/Oslo', timestamptz '2026-08-02 09:00 Europe/Oslo'),
  (4, 'none',            timestamptz '2026-08-02 09:00 Europe/Oslo', null,                                       timestamptz '2026-08-02 09:00 Europe/Oslo')
on conflict (day) do update
  set question_type = excluded.question_type,
      release_at    = excluded.release_at,
      closes_at     = excluded.closes_at,
      results_at    = excluded.results_at;
