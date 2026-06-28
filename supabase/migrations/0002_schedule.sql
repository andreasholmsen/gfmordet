-- ============================================================================
--  Mordmysteriet — migrasjon 0002: tidsplan for nedtelling i oppgavelinjen
--
--  Legger til én ny RPC, get_schedule(), som lar frontend vise en nedtelling
--  («Dag 2 åpner om HH:MM:SS») i oppgavelinjen. Den returnerer også server_now
--  slik at klienten kan korrigere for at telefonklokka kan gå feil.
--
--  Trygt og additivt: rører ingen tabeller eller eksisterende funksjoner.
--  Å eksponere release_at er IKKE en juksevei — selve låsen håndheves fortsatt
--  av now() i get_unlocked_days/submit_vote/get_results.
--
--  Kjør i Supabase SQL Editor. Inntil dette er kjørt skjuler oppgavelinjen bare
--  nedtellingen (ingen feil).
-- ============================================================================

create or replace function public.get_schedule()
returns table(day int, release_at timestamptz, results_at timestamptz, server_now timestamptz)
language sql
security definer
set search_path = public
as $$
  select c.day, c.release_at, c.results_at, now() as server_now
  from public.case_config c
  order by c.day;
$$;

revoke all on function public.get_schedule() from public;
grant execute on function public.get_schedule() to anon;
