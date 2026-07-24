-- ============================================================================
--  GF-mordet — lås innloggings-RPC-er for anon
--  Kjør i Supabase SQL Editor ETTER 0004 + 0005 + 0006.
--
--  BAKGRUNN: Supabase gir som standard `execute` DIREKTE til rollen `anon` på
--  nye funksjoner (via ALTER DEFAULT PRIVILEGES). Et `revoke ... from public`
--  fjerner IKKE den direkte anon-grant-en. Dermed kunne anon-nøkkelen (som
--  ligger åpent i frontend-bundelen) kalle f.eks. get_active_stories og lese
--  poster-navn + stier UTEN innlogging. Mutasjonene var trygge (de sjekker
--  auth.uid()), men lesing lakk metadata.
--
--  Denne migrasjonen fjerner anon-tilgang eksplisitt på alt som skal kreve
--  innlogging. Trygt/idempotent — påvirker ikke innloggede brukere (de kjører
--  som `authenticated`), og de bevisst-offentlige lese-RPC-ene (get_unlocked_days
--  m.fl.) røres ikke.
-- ============================================================================

revoke execute on function public.submit_vote(int, text, text)                 from anon;
revoke execute on function public.get_my_votes()                               from anon;

revoke execute on function public.add_story(text)                              from anon;
revoke execute on function public.get_active_stories()                         from anon;
revoke execute on function public.get_all_stories()                            from anon;
revoke execute on function public.get_my_last_story_at()                       from anon;
revoke execute on function public.delete_my_story(uuid)                        from anon;

revoke execute on function public.create_romance_profile(text, text, text[], jsonb) from anon;
revoke execute on function public.get_romance_status()                         from anon;
revoke execute on function public.get_swipe_deck()                             from anon;
revoke execute on function public.record_swipe(uuid, boolean)                  from anon;
revoke execute on function public.get_my_match()                               from anon;
revoke execute on function public.cancel_match()                               from anon;
revoke execute on function public.get_romance_assigned()                       from anon;

-- Bevisst fortsatt anon-kallbare (aggregater/tidsplan, ingen navn, og
-- get_unlocked_days brukes FØR innlogging av UnlockProvider):
--   get_unlocked_days, get_results, get_free_text, get_schedule, get_live_results
