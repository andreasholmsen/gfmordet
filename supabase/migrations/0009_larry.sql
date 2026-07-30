-- ============================================================================
--  GF-mordet — Larry-flagget («hvem prøvde å jukse?»)
--  Kjør i Supabase SQL Editor ETTER 0004_auth.sql. Trygg og additiv — rører
--  ikke stemmer, stories eller noe annet.
--
--  BAKGRUNN: Larry-ikonet (easter egget) tilbyr spilleren å «fjerne halvparten
--  av vitnene». Han gjør ingenting i det hele tatt — men vi noterer hvem som
--  sa ja, slik at det kan vises som en spøk på dag 4. Spilleren får VITE at det
--  ble notert (Larry sier det rett ut), så ingen loggføres i det skjulte.
--
--  Samme sikkerhetsmodell som resten av spillet: RLS på, INGEN tabellpolicyer,
--  all skriving via SECURITY DEFINER-RPC. Identiteten leses server-side fra
--  auth.uid(), så en spiller kan ikke flagge noen andre enn seg selv.
-- ============================================================================

create table if not exists public.cheat_flags (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  player_name text not null,
  created_at  timestamptz not null default now()
);

alter table public.cheat_flags enable row level security;

-- Bevisst INGEN policyer: verken anon eller authenticated får lese tabellen
-- direkte. Kun service_role (Supabase-dashbordet) ser innholdet — se spørringen
-- nederst i fila. Det hindrer at spillere kan snoke i lista før avsløringen.

-- ---------------------------------------------------------------------------
--  RPC: noter at spilleren sa ja til Larrys «hjelp».
--  Idempotent — gjentatte klikk endrer ikke tidspunktet, så created_at er
--  ALLTID første gang vedkommende sa ja.
-- ---------------------------------------------------------------------------
create or replace function public.flag_cheater()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  uname text := coalesce(
    nullif(trim(auth.jwt() -> 'user_metadata' ->> 'display_name'), ''),
    'Ukjent etterforsker'
  );
begin
  if uid is null then
    raise exception 'Ikke innlogget';
  end if;

  insert into public.cheat_flags (user_id, player_name)
  values (uid, uname)
  on conflict (user_id) do nothing;
end;
$$;

-- Krev innlogging (Supabase gir nye funksjoner direkte anon-grant, jf. 0007).
revoke execute on function public.flag_cheater() from anon;
grant execute on function public.flag_cheater() to authenticated;

-- ---------------------------------------------------------------------------
--  Slik ser du lista (kjør i SQL Editor — dashbordet kjører som service_role
--  og omgår RLS). Det finnes med vilje ingen lese-RPC: hadde den vært kallbar
--  for `authenticated`, kunne spillerne hentet lista selv og ødelagt spøken.
--
--    select player_name, created_at
--    from public.cheat_flags
--    order by created_at;
--
--  Antall:
--    select count(*) from public.cheat_flags;
--
--  Nullstille før spillet starter:
--    delete from public.cheat_flags;
-- ---------------------------------------------------------------------------
