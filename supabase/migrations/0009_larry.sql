-- ============================================================================
--  GF-mordet — Larry-flagget («hvem takket ja til Larry?»)
--  Kjør i Supabase SQL Editor ETTER 0004_auth.sql. Trygg og additiv — rører
--  ikke stemmer, stories eller noe annet.
--
--  BAKGRUNN: Larry-ikonet (easter egget) tilbyr spilleren å «fjerne halvparten
--  av vitnene». Han gjør ingenting i det hele tatt — men vi noterer hvem som
--  sa ja. Spilleren får VITE at det ble notert (Larry sier det rett ut), så
--  ingen loggføres i det skjulte. Lista vises i Excel-appens ark «Larry 👽»
--  (via get_cheat_flags under).
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

-- Bevisst INGEN policyer: ingen direkte tabelltilgang. All lesing/skriving går
-- via RPC-ene under (service_role/dashbordet omgår RLS som vanlig).

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

-- ---------------------------------------------------------------------------
--  RPC: hele lista (navn + tidspunkt), eldst først — Excel-arket «Larry 👽».
--  Synlig for alle innloggede: Larry sier selv at han noterer, og veggen er
--  en del av spøken.
-- ---------------------------------------------------------------------------
create or replace function public.get_cheat_flags()
returns table(player_name text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select c.player_name, c.created_at
  from public.cheat_flags c
  order by c.created_at;
$$;

-- Krev innlogging (Supabase gir nye funksjoner direkte anon-grant, jf. 0007).
revoke execute on function public.flag_cheater() from anon;
grant execute on function public.flag_cheater() to authenticated;
revoke execute on function public.get_cheat_flags() from anon;
grant execute on function public.get_cheat_flags() to authenticated;

-- Nullstille før spillet starter:  delete from public.cheat_flags;
