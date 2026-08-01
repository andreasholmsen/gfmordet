-- ============================================================================
--  GF-mordet — migrasjon 0010: LIVE fritekst-teorier (uten tidslås)
--
--  Legger til én ny RPC, get_live_free_text(p_day), som returnerer de
--  ANONYMISERTE fritekst-svarene for en dag AKKURAT NÅ — uten å vente på
--  results_at. Brukes KUN av Excel-appen i utviklingsmodus (`npm run dev`),
--  så eieren kan følge med på dag 2-teoriene mens de kommer inn. Prod-bygget
--  kaller den aldri (import.meta.env.DEV fjernes av bundleren).
--
--  Personvern: kun selve teksten — ALDRI navn/player_id. Samme utvalg som
--  get_free_text (0001), bare uten now()-sjekken.
--
--  MERK: RPC-en er teknisk kallbar av alle INNLOGGEDE spillere (authenticated,
--  ikke anon) — klient-gatingen er ikke en hard lås. Akseptert risiko for et
--  vennespill, på linje med get_live_results (0003).
--
--  Trygt og additivt: rører ingen tabeller eller eksisterende funksjoner.
--  Kjør i Supabase SQL Editor.
-- ============================================================================

create or replace function public.get_live_free_text(p_day int)
returns table(free_text text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select v.free_text
    from public.votes v
    where v.day = p_day and v.free_text is not null and trim(v.free_text) <> ''
    order by v.created_at;
end;
$$;

revoke all on function public.get_live_free_text(int) from public;
grant execute on function public.get_live_free_text(int) to authenticated;
