# GF-mordet — prosjektnotater & handoff

Retro "gammel PC"-nettside for et 4-dagers murder mystery-case (~100 norske spillere).
Spillerne får dokumenter dag for dag og svarer på et daglig spørsmål som leder mot
løsningen på dag 4. Mobil-først (PC som backup). All UI-tekst er på norsk.

**Stack:** Vite + React + TypeScript · HashRouter · Supabase (RPC + RLS) · `marked` ·
egen retro-CSS. Hostet på GitHub Pages fra det private repoet `andreasholmsen/gfmordet`.

---

## Status (oppdatert 2026-06-24)

- ✅ Hele appen er bygget, type-sjekker og bygger rent.
- ✅ Pushet til `main` på det private repoet; GitHub Pages er aktivert (Actions-deploy).
- ✅ **Live:** https://andreasholmsen.github.io/gfmordet/ (Pages-siden er offentlig, repoet er privat).
- ✅ Supabase-prosjektet er opprettet og `0001_init.sql` er kjørt; tilkobling + RLS verifisert.
- ✅ Lokal `.env` satt opp → `npm run dev` kjører mot ekte Supabase.
- ⏳ **GJENSTÅR:** repo-secrets på GitHub (se nedenfor) — den deployede siden er fortsatt i
  demo-modus til disse er lagt inn.
- ⏳ **GJENSTÅR:** re-kjør seed-blokken i Supabase etter siste datoendring (dag 1 alltid åpen).
- ⏳ **GJENSTÅR:** bytt ut eksempelinnholdet med ekte sak + legg inn ekte bilder/PDF-er.

## Neste steg for å gjøre live-siden ekte (viktig rekkefølge)

1. **Re-kjør seed i Supabase** (SQL Editor) — nederste `insert ... on conflict`-blokk i
   `supabase/migrations/0001_init.sql`. Trygt, rører ikke stemmer.
2. **Legg inn GitHub repo-secrets:** Settings → Secrets and variables → Actions →
   - `VITE_SUPABASE_URL` = `https://blmkltyyqqsljbfpdlqn.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_IopLphzZsKoJCpL3VFtaOA_-d0WoXVr`
3. **Re-kjør deploy:** Actions → "Deploy til GitHub Pages" → Run workflow (eller push).
   Da forsvinner demo-banneret og siden bruker ekte data.
4. **(Valgfritt, for nedtelling i oppgavelinjen)** Kjør `supabase/migrations/0002_schedule.sql`
   i SQL Editor. Den legger til RPC-en `get_schedule` som oppgavelinjen bruker til å vise
   «Dag N åpner om HH:MM:SS». Trygt/additivt. Uten den skjules bare nedtellingen (ingen feil).

## Innlogging (brukernavn + passord) — Supabase Auth

Spillere logger inn med **kun brukernavn + passord** (ingen e-post/Google). Passord hashes
av Supabase (bcrypt) — vi lagrer aldri passord selv. Full innloggingsvegg etter boot:
skrivebordet vises kun for innloggede. Fungerer statisk på GitHub Pages (JWT i localStorage,
ingen redirect/backend). Stemmer knyttes til `auth.uid()` og følger spilleren på tvers av
enheter (via `get_my_votes`).

- **Slik virker brukernavn-only:** `src/lib/supabase.ts` lager en deterministisk syntetisk
  e-post `<brukernavn>@gfmordet.local` som Auth-identifikator. Adressen er ikke hemmelig og
  mottar aldri e-post. Brukernavn er ufølsomt for store/små bokstaver + mellomrom.
- **Registrering samler «Fullt navn»** (lagres i `user_metadata.full_name`, brukes som
  `display_name` → vises i «Innlogget som» og lagres som `player_name` på stemmer). Innlogging
  krever kun brukernavn + passord.
- **MÅ GJØRES i Supabase-dashboardet:** Auth → «Confirm email» **AV** (ellers prøver Supabase
  å sende bekreftelse til `.local`-adressen og registrering feiler). «Allow new users to
  sign up» på.
- **Glemt passord:** nullstilles manuelt i Supabase-dashboardet (ingen e-post-infra — bevisst
  valg for et 4-dagers vennespill).
- **Kjør migrasjon `0004_auth.sql`** i SQL Editor (etter 0001). NB: den tømmer eksisterende
  test-stemmer (gammel `player_id` har ingen auth-bruker) — trygt før spillet starter.

## Instagram-stories (spiller-opplastede bilder)

Spillere kan laste opp ett bilde hver 4. time i Instagram-appen (`StoriesBar`). Bildet vises
i 24 timer i live-visningen; etter spillet (dag 4 `results_at`) samles **alle** bilder i et
felles «Minnealbum» (desktop-ikon 📸 → `/album`). Bilder **komprimeres på enheten**
(`src/lib/image.ts`, maks 1080px JPEG) før opplasting.

- **Privat lagring:** bucket `stories` (privat). Vises via korte signerte URL-er — kun
  innloggede spillere ser dem, ingen offentlig lenke. Poster-navn (fullt navn) vises på hver
  story. Kun-bilde (ingen bildetekst).
- **Kjør migrasjon `0005_stories.sql`** (etter 0001+0004): lager bucket + `storage.objects`-
  policyer, tabellen `stories`, og RPC-ene `add_story` (4t-cooldown server-side),
  `get_active_stories` (siste 24t), `get_all_stories` (kun etter spillet), `get_my_last_story_at`,
  `delete_my_story`. Cooldown/levetid er SQL-intervaller i fila (lett å justere).
- Hvis SQL-bucketoppretting feiler: lag bucketen `stories` manuelt i dashbordet (privat), kjør
  resten. Admin kan slette upassende bilder i dashbordet (service_role omgår RLS).

## Romansaiansa (Tinder-modus) + samarbeids-bevis

Sosial feature koblet til avstemningen som «gulrot» (`RomansaiansaApp`, desktop-ikon 🔥):
- **Dag 1-stemme** krever en profil: selfie (in-browser kamera, front) + kjønn/interesse + mini-quiz.
- **Dag 2-stemme** krever at deltakere har **swipet ferdig** på alle kompatible. Uten profil
  (etternølere) er man unntatt.
- **Dag 3:** admin kjører `select assign_matches();` i SQL Editor → folk pares (gjensidige «ja»
  først, så preferanse-respekterende, så vilkårlig). Dag 3-beviset **deles**: dokumenter merket
  `group: 'A' | 'B'` i manifestet vises kun til rett partner; umerkede vises til begge.
- **Full-bevis-fallback:** uparet (oddetall) eller «Avlys romanse» ⇒ ser **alt** beviset solo.
  Avlysning kan gjøres unilateralt (dekker også partner som blir borte) — ingen soft-lock.
- **Matchmaking-lås:** når dag 3 er åpen men `assign_matches()` ennå ikke er kjørt, blokkeres
  HELE appen med en fullskjerm «Romansaiansa laster»-skjerm (poller til admin kjører den).
  Uten dette ville uparede sett begge halvdeler av beviset. Deaktivert i dev (`import.meta.env.DEV`).
  Fail-open: mangler RPC-en (0006 ikke kjørt) blokkeres ingenting.

Detaljer:
- **Kjør migrasjon `0006_romance.sql`** (etter 0004): privat bucket `profiles`, tabeller
  `romance_profiles/_swipes/_matches`, RPC-er (profil/deck/swipe/match/cancel), oppdatert
  `submit_vote` med dag 1/2-gate, og admin-funksjonen `assign_matches()` (ikke grantet til
  klient — kjør i SQL Editor).
- Innhold i `src/case/manifest.ts` → `romance` (kjønn/interesse-valg + quiz-spørsmål) og
  `group`-merking på dag 3-dokumenter. Utelat `romance` for å skru av feature-en.
- Profilpool fryses når dag 2 åpner (profil kan kun lages mens dag 1-vinduet er åpent).
- Selfie kan ikke verifiseres teknisk (soft via UX); admin kan slette bilder i dashbordet.

## Offerets filer = låst mobil (kode + «POLITI-HACK»)

«Offerets filer» vises som en smarttelefon på skrivebordet. Innholdet (`CASE.angelaFiles`)
ligger bak en låseskjerm med 4-sifret kode (`CASE.phonePin` i manifestet — plant koden som
spor i dokumentene; eksempelsaken bruker `2503`). Alternativ vei inn: «POLITI-HACK»-knappen
åpner et fingeravtrykk-minigame i GTA Casino Heist-stil (`FingerprintHack.tsx`, «clone
target»): avtrykket er kuttet i 8 horisontale striper som er forskjøvet sidelengs (med wrap);
skyv radene på plass (trykk venstre/høyre halvdel av raden, eller piltaster på PC) så de
matcher målavtrykket. **Tre avtrykk** må klones på **60 sek totalt** (klokka løper videre
mellom avtrykkene); hvert mislykkede forsøk gir **+5 sek** på neste (gradvis lettere, nullstilles
når minigamet lukkes). Løses automatisk når alt står riktig (ingen sjekk-knapp).
Avtrykket tegnes prosedyrelt som SVG (seeded) — ingen bildefiler. Opplåsing huskes per enhet
(`localStorage: gfm:angela-unlocked`). Utelat `phonePin` for å skru av låsen helt. Alt er
klient-side (ingen Supabase).

## Datoer / tidsplan (settes i Supabase `case_config`, IKKE i koden)

Hver dag åpner kl. **09:00 Europe/Oslo**. Forrige dags resultater + avstemnings-stenging
skjer når neste dag slippes.

| Dag | Spørsmål | Åpner | Resultater vises |
| --- | --- | --- | --- |
| 1 | "Hvem lyver …" (flervalg) | **alltid åpen** (release i fortiden) | fre 31. juli 09:00 |
| 2 | "Hvordan døde …" (fritekst) | fre 31. juli 09:00 | lør 1. aug 09:00 |
| 3 | "Hvem drepte Angela" (flervalg + "Annet") | lør 1. aug 09:00 | søn 2. aug 09:00 |
| 4 | (ingen stemming) fasit + statistikk | søn 2. aug 09:00 | — |

> Beslutning: Dag 1 skal alltid være tilgjengelig (folk kan lese/voteres når som helst),
> men dag 1-resultatene holdes tilbake til dag 2 slippes. Implementert ved at dag 1 har
> `release_at` i fortiden, men `closes_at`/`results_at` = 31. juli.

## Supabase

- **Project URL:** `https://blmkltyyqqsljbfpdlqn.supabase.co`
- **Publishable (anon) key:** `sb_publishable_IopLphzZsKoJCpL3VFtaOA_-d0WoXVr`
  - Trygg å eksponere i frontend — RLS er på, og kun de definerte RPC-ene er tilgjengelige.
  - **Aldri** legg `service_role`/secret-nøkkelen i frontend eller repoet.
- **Sikkerhetsmodell:** RLS er på alle tabeller, og det finnes INGEN anon-policies for
  direkte tabelltilgang. Alt går via `SECURITY DEFINER`-RPC-er som håndhever server-tid:
  lesing `get_unlocked_days`/`get_results`/`get_free_text` (0001) + valgfrie `get_schedule`
  (0002) og `get_live_results` (0003); skriving `submit_vote` og egen-lesing `get_my_votes`
  (0004) krever innlogging (`authenticated`, identitet fra `auth.uid()` — ingen forfalskning).
  Selve tidslåsen håndheves fortsatt av `now()`. Verifisert at direkte `select` på
  `votes`/`case_config` med anon-nøkkel returnerer tomt.
- **Tidslås:** all opplåsing/stemming/resultat-frigjøring bestemmes av `now()` server-side,
  så det kan ikke jukses ved å endre klokka på telefonen.
- Gratis-tier pauser etter 7 dager uten aktivitet — ikke et problem under spillet, men sett
  opp keep-alive hvis statistikken skal leve videre etter 2. aug.

## Innhold (det eieren redigerer)

- **`src/case/manifest.ts`** = eneste kilde for tittel, intro, dokumenter per dag,
  Instagram-poster, spørsmål/alternativer og fasiten (dag 4). Pre-fylt med eksempelsak
  "GF-mordet" — må byttes ut med ekte innhold.
- Filer (bilder/PDF) legges i `public/case/dagN/` og `public/case/instagram/`, pekes på med
  `src` (relativt fra /public). Tekst kan også skrives `inline` i manifestet. Se
  `public/case/README.md`.
- `option.id` i manifestet (f.eks. `kari`, `per`, `annet`) lagres som `choice` i votes og
  brukes til å vise resultatlabels. `solution.killerId` bør matche en dag 3-option.
- **Skriveguide:** `docs/skriveguide.md` — hvordan porsjonere dokumenter, plante falske spor
  og få saken til å føles som utforsking. Kjør `npm run check:content` for å flagge for lange
  dokumenter (legg til `-- --strict` for at advarsler også skal gi feilkode).

## Kjøre lokalt / bygge

- Node ligger i `~/.local/node` (lagt til i `~/.bashrc`; ikke installert system-globalt).
  Hvis `node`/`npm` ikke finnes i en ny shell: `export PATH="$HOME/.local/node/bin:$PATH"`.
- `npm run dev` (port settes av Vite, base-path `/gfmordet/`) · `npm run build` · `npm run typecheck`.
- `.env` (gitignorert) holder Supabase-verdiene for lokal kjøring.

## Filkart (de viktigste)

- `src/case/manifest.ts` — alt innhold (rediger her). Inkl. `suspects` (Mistenkte-tavla) og
  spørsmålstypen `image_choice` (bildevalg).
- `src/App.tsx` — ruter (HashRouter): `/`, `/dag/:day`, `/instagram`, `/politi`, `/mistenkte`,
  `/spill/minesveiper`. Pakker appen i `SettingsProvider` + `AuthProvider` + `UnlockProvider`.
  `Gate` viser innloggingsskjerm når man ikke er innlogget, ellers ruter + `Taskbar`.
- `src/components/Desktop.tsx` — skrivebord med ikon-grid + låsestatus + høyreklikk-meny
  (`ContextMenu`) og «Om denne PC-en»-dialog (`Dialog`).
- `src/components/Taskbar.tsx` — vedvarende oppgavelinje: klokke, nedtelling til neste dag
  (via `get_schedule`, skjult uten den), lyd av/på-knapp.
- `src/components/AppWindow.tsx` — retro fullskjerm-vindu (tittellinje + lukk). `variant`-prop
  ('folder' | 'instagram' | 'police') styrer åpne/lukke-animasjon + tema. Spiller lyd ved
  åpne/lukke. POLITI-vinduet har eget mørkt terminal-tema (scoped `.window--police`).
- `src/components/BootScreen.tsx` — terminal boot-animasjon ved sidelasting (med lyd-blip).
- `src/components/DayFolder.tsx` + `DocView.tsx` — mappe + bilde/PDF/markdown-visere.
  `Markdown.tsx` ruter relative bilde-stier gjennom `assetUrl` (![..](case/..) virker inline).
- `src/components/InstagramApp.tsx` — falsk IG-feed (statiske `CASE.instagram`-poster) +
  live `StoriesBar` øverst.
- `src/components/StoriesBar.tsx` + `StoryViewer.tsx` + `StoryAlbum.tsx` — spiller-stories:
  opplaster m/cooldown, fullskjerm-visning, og post-game minnealbum (`/album`).
- `src/lib/image.ts` — komprimerer bilder på enheten før opplasting.
- `src/components/CameraCapture.tsx` — gjenbrukbart kamera-i-nettleser (getUserMedia) med
  galleri-reserve; brukes av `StoryComposer` (story) og `RomansaiansaApp` (selfie).
- `src/components/RomansaiansaApp.tsx` — Tinder-modus: profil-oppsett, swiping, match/avlys.
- `src/components/SuspectBoard.tsx` — «Mistenkte»-korktavle (vises kun når `suspects` finnes).
- `src/components/PhoneLock.tsx` + `FingerprintHack.tsx` — låseskjerm for Angelas mobil
  (kode fra `CASE.phonePin`) og politi-hack-minigamet som omgår den.
- `src/components/Minesveiper.tsx` — lite frittstående minesveiper-spill (påskeegg).
- `src/components/Dialog.tsx` + `ContextMenu.tsx` — gjenbrukbar modal + høyreklikk-meny.
- `src/components/PoliceApp.tsx` + `VoteForm.tsx` + `ResultsView.tsx` — POLITI-app. Identitet
  hentes fra `useAuth()`. `ResultsView` animerer barene og viser «du stemte som X %».
- `src/components/AuthScreen.tsx` — logg inn / registrer (brukernavn + passord), retro-stilt.
- `src/lib/AuthContext.tsx` — Supabase Auth-sesjon + `useAuth()` (`signIn/signUp/signOut`,
  `user`). Hydrerer egne stemmer ved innlogging. Demo-modus: fabrikkert bruker.
- `src/lib/supabase.ts` — klient (persistert sesjon) + auth-wrappere (`signInWithUsername`
  m.fl., brukernavn→syntetisk e-post) + RPC-wrappere (demo-modus uten env), inkl. `getMyVotes`.
- `src/lib/UnlockContext.tsx` — henter åpne dager fra serveren.
- `src/lib/SettingsContext.tsx` — lyd-demping (localStorage). `src/lib/sfx.ts` — WebAudio-lyder.
- `src/lib/votes.ts` — spillerens egne stemmer: in-memory cache hydrert fra `get_my_votes`
  (autoritativ, kryssenhet) + localStorage-speil. `getMyVote` er synkron for render.
- `src/styles/retro.css` — hele retro-temaet (inkl. oppgavelinje, innlogging, tavle, spill).
- `supabase/migrations/0001_init.sql` — skjema, RLS, RPC-er, seed-datoer.
- `supabase/migrations/0002_schedule.sql` — valgfri `get_schedule`-RPC for nedtellingen.
- `supabase/migrations/0004_auth.sql` — innlogging: `votes.user_id`, `submit_vote` skrevet om
  til autentisert (`auth.uid()`), ny `get_my_votes`, grants til `authenticated`.
- `supabase/migrations/0007_lockdown.sql` — fjerner anon-`execute` på innloggings-RPC-ene
  (Supabase gir anon direkte grant som `revoke from public` ikke fjerner). MÅ kjøres.
- **Verktøy:** `npm run preflight` (sjekker migrasjoner/bucketer/datoer/demo-modus + at anon er
  blokkert — trenger `.env`). `scripts/jump-day.sh <1-4|reset>` flytter `case_config`-datoene
  for testing (se filens topp; valgfri `SUPABASE_DB_URL` for å kjøre direkte via psql).
- `src/components/ErrorBoundary.tsx` — fullskjerm-fallback ved uventet render-krasj (i main.tsx).
- `.github/workflows/deploy.yml` — Pages-deploy (trenger de to repo-secrets).

## Mulige videre oppgaver (ikke gjort ennå)

- Vanntett gating av dag 4-fasiten via privat Supabase Storage + signert URL (i dag ligger
  alle dokumenter statisk i deployet og er teknisk nåbare via URL før opplåsing — lav risiko
  for vennespill, bruk kryptiske filnavn).
- Bump GitHub Actions-versjoner (Pages-actions targeter Node 20 som GitHub deprecaterer).
