-- ============================================================================
--  GF-mordet — «Romansaiansa» (Tinder-modus) + samarbeids-bevis
--  Kjør i Supabase SQL Editor ETTER 0001 + 0004 (+ 0005).
--
--  Flyt:
--   • Dag 1-stemme krever en Romansaiansa-profil (selfie + kjønn/interesse + quiz).
--   • Dag 2-stemme krever at deltakere har swipet på ALLE kompatible (unntatt de
--     uten profil — etternølere).
--   • Dag 3: `assign_matches()` (kjøres av admin i SQL Editor) parer folk —
--     gjensidige «ja» først, så preferanse-respekterende, så vilkårlig. Uparede
--     og avlyste par får ALT beviset (full-bevis-fallback).
--
--  Sikkerhet: RLS på, ingen tabellpolicyer, alt via SECURITY DEFINER-RPC med
--  auth.uid() + server-tid. Profilbilder i PRIVAT bucket (signerte URL-er).
-- ============================================================================

-- ---------------------------------------------------------------------------
--  Storage-bucket for profilbilder (privat) + policyer
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('profiles', 'profiles', false)
on conflict (id) do nothing;

drop policy if exists "profiles upload own" on storage.objects;
create policy "profiles upload own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'profiles' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "profiles delete own" on storage.objects;
create policy "profiles delete own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'profiles' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "profiles read authenticated" on storage.objects;
create policy "profiles read authenticated"
  on storage.objects for select to authenticated
  using (bucket_id = 'profiles');

-- ---------------------------------------------------------------------------
--  Tabeller (RLS på, ingen policyer — kun via RPC)
-- ---------------------------------------------------------------------------
create table if not exists public.romance_profiles (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  photo_path    text not null,
  gender        text not null,
  interested_in text[] not null default '{}',
  quiz          jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create table if not exists public.romance_swipes (
  id         uuid primary key default gen_random_uuid(),
  swiper     uuid not null references auth.users(id) on delete cascade,
  target     uuid not null references auth.users(id) on delete cascade,
  liked      boolean not null,
  created_at timestamptz not null default now(),
  unique (swiper, target)
);

create table if not exists public.romance_matches (
  id           uuid primary key default gen_random_uuid(),
  user_a       uuid not null references auth.users(id) on delete cascade,
  user_b       uuid not null references auth.users(id) on delete cascade,
  cancelled    boolean not null default false,
  cancelled_by uuid,
  created_at   timestamptz not null default now()
);

-- Singleton-tilstand: når ble matchingen kjørt? (null = ikke kjørt ennå).
-- Brukes til å blokkere hele appen med en «laster»-skjerm på dag 3 helt til
-- admin har kjørt assign_matches() — ellers ville uparede sett ALT beviset.
create table if not exists public.romance_state (
  id          smallint primary key default 1,
  assigned_at timestamptz,
  constraint romance_state_singleton check (id = 1)
);
insert into public.romance_state (id) values (1) on conflict (id) do nothing;

alter table public.romance_profiles enable row level security;
alter table public.romance_swipes   enable row level security;
alter table public.romance_matches  enable row level security;
alter table public.romance_state    enable row level security;

-- ---------------------------------------------------------------------------
--  Hjelpefunksjon: hvem er i MITT deck (to-veis kompatible profiler, minus meg)
-- ---------------------------------------------------------------------------
create or replace function public.romance_deck_targets(p_uid uuid)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select t.user_id
  from public.romance_profiles t, public.romance_profiles me
  where me.user_id = p_uid
    and t.user_id <> p_uid
    and t.gender = any(me.interested_in)
    and me.gender = any(t.interested_in)
$$;

-- ---------------------------------------------------------------------------
--  RPC: opprett/oppdater profil (kun mens dag 1-vinduet er åpent)
-- ---------------------------------------------------------------------------
create or replace function public.create_romance_profile(
  p_photo_path text,
  p_gender text,
  p_interested_in text[],
  p_quiz jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  day2_release timestamptz;
begin
  if uid is null then
    raise exception 'Ikke innlogget';
  end if;
  if position(uid::text || '/' in p_photo_path) <> 1 then
    raise exception 'Ugyldig filsti';
  end if;

  select release_at into day2_release from public.case_config where day = 2;
  if day2_release is not null and now() >= day2_release then
    raise exception 'Romansaiansa er stengt for nye profiler.';
  end if;

  insert into public.romance_profiles (user_id, photo_path, gender, interested_in, quiz)
  values (uid, p_photo_path, p_gender, coalesce(p_interested_in, '{}'), coalesce(p_quiz, '{}'::jsonb))
  on conflict (user_id) do update
    set photo_path    = excluded.photo_path,
        gender        = excluded.gender,
        interested_in = excluded.interested_in,
        quiz          = excluded.quiz;
end;
$$;

-- ---------------------------------------------------------------------------
--  RPC: min romanse-status (profil? deck-størrelse? ferdig swipet?)
-- ---------------------------------------------------------------------------
create or replace function public.get_romance_status()
returns table(has_profile boolean, deck_total bigint, swiped_count bigint, swipe_complete boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  has_p boolean;
  total bigint;
  swiped bigint;
begin
  has_p := exists (select 1 from public.romance_profiles where user_id = uid);
  if not has_p then
    return query select false, 0::bigint, 0::bigint, false;
    return;
  end if;
  select count(*) into total from public.romance_deck_targets(uid);
  select count(*) into swiped
    from public.romance_swipes s
    where s.swiper = uid and s.target in (select public.romance_deck_targets(uid));
  return query select true, total, swiped, (swiped >= total);
end;
$$;

-- ---------------------------------------------------------------------------
--  RPC: swipe-deck (kompatible profiler jeg ikke har swipet ennå)
-- ---------------------------------------------------------------------------
create or replace function public.get_swipe_deck()
returns table(id uuid, name text, photo_path text, quiz jsonb)
language sql
security definer
set search_path = public
as $$
  select
    t.user_id,
    coalesce(nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''), 'Ukjent') as name,
    t.photo_path,
    t.quiz
  from public.romance_profiles t
  join auth.users u on u.id = t.user_id
  where t.user_id in (select public.romance_deck_targets(auth.uid()))
    and not exists (
      select 1 from public.romance_swipes s
      where s.swiper = auth.uid() and s.target = t.user_id
    )
  order by t.created_at;
$$;

-- ---------------------------------------------------------------------------
--  RPC: registrer en swipe (kun på kompatible profiler)
-- ---------------------------------------------------------------------------
create or replace function public.record_swipe(p_target uuid, p_liked boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Ikke innlogget';
  end if;
  if p_target not in (select public.romance_deck_targets(uid)) then
    raise exception 'Kan ikke swipe på denne profilen';
  end if;
  insert into public.romance_swipes (swiper, target, liked)
  values (uid, p_target, p_liked)
  on conflict (swiper, target) do update set liked = excluded.liked, created_at = now();
end;
$$;

-- ---------------------------------------------------------------------------
--  RPC: min match (også avlyste, så klienten kan skille solo/avlyst)
-- ---------------------------------------------------------------------------
create or replace function public.get_my_match()
returns table(cancelled boolean, side text, partner_name text, partner_photo_path text)
language sql
security definer
set search_path = public
as $$
  select
    m.cancelled,
    case when m.user_a = auth.uid() then 'A' else 'B' end as side,
    coalesce(nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''), 'Ukjent') as partner_name,
    p.photo_path as partner_photo_path
  from public.romance_matches m
  join public.romance_profiles p
    on p.user_id = case when m.user_a = auth.uid() then m.user_b else m.user_a end
  join auth.users u on u.id = p.user_id
  where m.user_a = auth.uid() or m.user_b = auth.uid()
  order by m.created_at desc
  limit 1;
$$;

-- ---------------------------------------------------------------------------
--  RPC: avlys romansen (unilateralt) → begge faller til full-bevis-modus
-- ---------------------------------------------------------------------------
create or replace function public.cancel_match()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  update public.romance_matches
    set cancelled = true, cancelled_by = uid
    where cancelled = false and (user_a = uid or user_b = uid);
end;
$$;

-- ---------------------------------------------------------------------------
--  ADMIN: tildel matcher. Kjør i SQL Editor når dag 3 åpner: select assign_matches();
--  Gjensidige «ja» først, så preferanse-respekterende, så vilkårlig. Re-kjørbar:
--  parer kun folk som ikke allerede er i et aktivt (ikke-avlyst) par.
-- ---------------------------------------------------------------------------
create or replace function public.assign_matches()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  a_id uuid;
  b_id uuid;
  made integer := 0;
begin
  drop table if exists _free;
  -- «Frie» = har profil og har ALDRI vært i et par (verken aktivt eller avlyst).
  -- Dermed: den som avlyser forblir solo, og re-kjøring parer kun etternølere.
  create temp table _free on commit drop as
    select p.user_id
    from public.romance_profiles p
    where not exists (
      select 1 from public.romance_matches m
      where m.user_a = p.user_id or m.user_b = p.user_id
    );

  -- 1) Gjensidige «ja»-par (hver par én gang: swiper < target)
  for rec in
    select s1.swiper as a, s1.target as b
    from public.romance_swipes s1
    join public.romance_swipes s2 on s2.swiper = s1.target and s2.target = s1.swiper
    where s1.liked and s2.liked and s1.swiper < s1.target
    order by s1.created_at
  loop
    if exists (select 1 from _free where user_id = rec.a)
       and exists (select 1 from _free where user_id = rec.b) then
      insert into public.romance_matches (user_a, user_b) values (rec.a, rec.b);
      delete from _free where user_id in (rec.a, rec.b);
      made := made + 1;
    end if;
  end loop;

  -- 2) Fyll resten: kompatibel partner først, ellers vilkårlig. Odde rest står igjen.
  loop
    select user_id into a_id from _free order by user_id limit 1;
    exit when a_id is null;
    delete from _free where user_id = a_id;

    select f.user_id into b_id
    from _free f
    join public.romance_profiles pb on pb.user_id = f.user_id
    join public.romance_profiles pa on pa.user_id = a_id
    where pb.gender = any(pa.interested_in) and pa.gender = any(pb.interested_in)
    order by f.user_id
    limit 1;

    if b_id is null then
      select user_id into b_id from _free order by user_id limit 1; -- vilkårlig
    end if;

    if b_id is not null then
      delete from _free where user_id = b_id;
      insert into public.romance_matches (user_a, user_b) values (a_id, b_id);
      made := made + 1;
    end if;
    a_id := null; b_id := null;
  end loop;

  -- Marker at matchingen er kjørt → låser opp appen for alle.
  update public.romance_state set assigned_at = now() where id = 1;

  return made;
end;
$$;

-- ---------------------------------------------------------------------------
--  RPC: er matchingen kjørt? (klienten blokkerer dag 3 til den er true)
-- ---------------------------------------------------------------------------
create or replace function public.get_romance_assigned()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select assigned_at is not null from public.romance_state where id = 1), false);
$$;

-- ---------------------------------------------------------------------------
--  Oppdater submit_vote (fra 0004): legg til romanse-gate for dag 1 og 2.
--  Behold all tidsvindu-logikk + identitet fra auth.uid()/JWT.
-- ---------------------------------------------------------------------------
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
  has_profile boolean;
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

  -- Romanse-gate
  has_profile := exists (select 1 from public.romance_profiles where user_id = uid);
  if p_day = 1 then
    if not has_profile then
      raise exception 'Åpne Romansaiansa og lag en profil (selfie + quiz) for å stemme på dag 1.';
    end if;
  elsif p_day = 2 then
    -- Kun deltakere (med profil) må ha swipet ferdig; etternølere er unntatt.
    if has_profile and exists (
      select 1 from public.romance_deck_targets(uid) d(t)
      where not exists (
        select 1 from public.romance_swipes s where s.swiper = uid and s.target = d.t
      )
    ) then
      raise exception 'Du må swipe ferdig i Romansaiansa for å stemme på dag 2.';
    end if;
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
--  Rettigheter
-- ---------------------------------------------------------------------------
revoke all on function public.romance_deck_targets(uuid)                 from public;
revoke all on function public.create_romance_profile(text, text, text[], jsonb) from public;
revoke all on function public.get_romance_status()                       from public;
revoke all on function public.get_swipe_deck()                           from public;
revoke all on function public.record_swipe(uuid, boolean)                from public;
revoke all on function public.get_my_match()                             from public;
revoke all on function public.cancel_match()                             from public;
revoke all on function public.get_romance_assigned()                     from public;
revoke all on function public.assign_matches()                           from public;  -- kun service_role/SQL Editor

grant execute on function public.create_romance_profile(text, text, text[], jsonb) to authenticated;
grant execute on function public.get_romance_status()        to authenticated;
grant execute on function public.get_swipe_deck()            to authenticated;
grant execute on function public.record_swipe(uuid, boolean) to authenticated;
grant execute on function public.get_my_match()              to authenticated;
grant execute on function public.cancel_match()              to authenticated;
grant execute on function public.get_romance_assigned()      to authenticated;
-- romance_deck_targets brukes internt av SECURITY DEFINER-funksjoner; ikke grantet.
