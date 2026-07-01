-- ============================================================================
--  GF-mordet — migrasjon 0003: LIVE resultater (uten tidslås)
--
--  Legger til én ny RPC, get_live_results(p_day), som returnerer de AGGREGERTE
--  stemmetallene for en dag AKKURAT NÅ — uten å vente på results_at. Brukes av
--  RESULTATER-appen for å vise stillingen underveis (stolpediagram).
--
--  Personvern: kun antall per valg (choice, n) — ALDRI navn eller fritekst.
--  Dette er samme aggregat som get_results, bare uten now()-sjekken.
--
--  MERK: Dette omgår med vilje tidslåsen på resultatvisning. Eieren styrer selv
--  om/når RESULTATER-appen skal være synlig i frontend (skjules separat).
--
--  Trygt og additivt: rører ingen tabeller eller eksisterende funksjoner.
--  Kjør i Supabase SQL Editor.
-- ============================================================================

create or replace function public.get_live_results(p_day int)
returns table(choice text, n bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select coalesce(v.choice, '(fritekst)') as choice, count(*)::bigint
    from public.votes v
    where v.day = p_day
    group by 1
    order by 2 desc;
end;
$$;

revoke all on function public.get_live_results(int) from public;
grant execute on function public.get_live_results(int) to anon;
