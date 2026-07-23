-- ============================================================================
--  GF-mordet — Instagram-stories (spiller-opplastede bilder)
--  Kjør dette i Supabase SQL Editor ETTER 0001 + 0004.
--
--  Spillere kan laste opp ett bilde hver 4. time. Bildet vises i 24 timer i
--  live-visningen; ETTER spillet (dag 4 results_at) vises alle bildene i et
--  felles minnealbum. Bildene ligger i en PRIVAT bucket og vises via signerte
--  URL-er — kun innloggede spillere ser dem.
--
--  Sikkerhetsmodell som resten av appen: RLS på, ingen direkte tabellpolicyer,
--  all logikk via SECURITY DEFINER-RPC-er med auth.uid() + server-tid.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  Storage-bucket (privat) + policyer på storage.objects
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('stories', 'stories', false)
on conflict (id) do nothing;

-- Opplasting: innloggede kan legge filer KUN i sin egen mappe (<uid>/...).
drop policy if exists "stories upload own" on storage.objects;
create policy "stories upload own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'stories'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Sletting: kun egne filer.
drop policy if exists "stories delete own" on storage.objects;
create policy "stories delete own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'stories'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Lesing: alle innloggede kan lese objekter i bucketen (kreves for at
-- createSignedUrl skal virke for andres stories). Selve fila er ellers privat.
drop policy if exists "stories read authenticated" on storage.objects;
create policy "stories read authenticated"
  on storage.objects for select to authenticated
  using (bucket_id = 'stories');

-- ---------------------------------------------------------------------------
--  Tabell
-- ---------------------------------------------------------------------------
create table if not exists public.stories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  image_path text not null,
  created_at timestamptz not null default now()
);
create index if not exists stories_created_at_idx on public.stories (created_at desc);

alter table public.stories enable row level security;  -- ingen policyer: kun via RPC

-- ---------------------------------------------------------------------------
--  RPC: legg til story (4-timers cooldown, håndhevet server-side)
-- ---------------------------------------------------------------------------
create or replace function public.add_story(p_image_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  last_at timestamptz;
begin
  if uid is null then
    raise exception 'Ikke innlogget';
  end if;
  -- Stien må ligge i brukerens egen mappe (samsvarer med storage-policyen).
  if position(uid::text || '/' in p_image_path) <> 1 then
    raise exception 'Ugyldig filsti';
  end if;

  select max(created_at) into last_at from public.stories where user_id = uid;
  if last_at is not null and last_at > now() - interval '4 hours' then
    raise exception 'Du kan legge ut en ny story om litt (maks én hver 4. time).';
  end if;

  insert into public.stories (user_id, image_path) values (uid, p_image_path);
end;
$$;

-- ---------------------------------------------------------------------------
--  RPC: aktive stories (siste 24t) med posterens navn
-- ---------------------------------------------------------------------------
create or replace function public.get_active_stories()
returns table(id uuid, image_path text, created_at timestamptz, author_name text, mine boolean)
language sql
security definer
set search_path = public
as $$
  select
    s.id,
    s.image_path,
    s.created_at,
    coalesce(nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''), 'Ukjent') as author_name,
    (s.user_id = auth.uid()) as mine
  from public.stories s
  join auth.users u on u.id = s.user_id
  where s.created_at > now() - interval '24 hours'
  order by s.created_at desc;
$$;

-- ---------------------------------------------------------------------------
--  RPC: når la JEG ut sist (til cooldown-nedtelling)
-- ---------------------------------------------------------------------------
create or replace function public.get_my_last_story_at()
returns timestamptz
language sql
security definer
set search_path = public
as $$
  select max(created_at) from public.stories where user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
--  RPC: minnealbum — ALLE bilder, men kun etter at spillet er over
--  (dag 4 sin results_at). Ellers tomt.
-- ---------------------------------------------------------------------------
create or replace function public.get_all_stories()
returns table(id uuid, image_path text, created_at timestamptz, author_name text, mine boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  reveal_at timestamptz;
begin
  select results_at into reveal_at from public.case_config where day = 4;
  if reveal_at is null or now() < reveal_at then
    return;  -- album låst til spillet er over
  end if;
  return query
    select
      s.id,
      s.image_path,
      s.created_at,
      coalesce(nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''), 'Ukjent') as author_name,
      (s.user_id = auth.uid()) as mine
    from public.stories s
    join auth.users u on u.id = s.user_id
    order by s.created_at;
end;
$$;

-- ---------------------------------------------------------------------------
--  RPC: slett egen story (klienten sletter selve storage-objektet)
-- ---------------------------------------------------------------------------
create or replace function public.delete_my_story(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.stories where id = p_id and user_id = auth.uid();
end;
$$;

-- ---------------------------------------------------------------------------
--  Rettigheter: kun innloggede.
-- ---------------------------------------------------------------------------
revoke all on function public.add_story(text)        from public;
revoke all on function public.get_active_stories()   from public;
revoke all on function public.get_my_last_story_at() from public;
revoke all on function public.get_all_stories()      from public;
revoke all on function public.delete_my_story(uuid)  from public;

grant execute on function public.add_story(text)        to authenticated;
grant execute on function public.get_active_stories()   to authenticated;
grant execute on function public.get_my_last_story_at() to authenticated;
grant execute on function public.get_all_stories()      to authenticated;
grant execute on function public.delete_my_story(uuid)  to authenticated;
