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
- ✅ **Live:** https://www.gfmordet.no/ (eget domene; github.io-URL-en redirecter hit).
  Domenet ligger på roten ⇒ `base: '/'` i `vite.config.ts` (var `/gfmordet/` før domenet).
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

## Romansaiansa (Tinder-modus) — FJERNET

Feature-en ble droppet (uferdig). All klientkode er slettet (app, rute, desktop-ikon,
vote-gates dag 1/2, dag 3 A/B-bevisdeling, matchmaking-låsen, supabase-wrappere, CSS).
**VIKTIG: hvis `0006_romance.sql` noen gang ble kjørt i Supabase, MÅ
`0008_remove_romance.sql` kjøres** — 0006 la romanse-gates inn i `submit_vote`
server-side, så uten rollbacken får ingen stemt på dag 1/2. 0008 er trygg å kjøre
uansett (idempotent, rører ikke votes). Bucketen `profiles` + evt. bilder slettes
manuelt i dashbordet. `0006_romance.sql` ligger igjen kun som historikk — ikke kjør den.

## Undermapper i dag-mappene (med farge-tema)

Dag-mapper kan ha undermapper: definer `folders: [{ id, title, icon?, tint?, intro?, parent? }]`
på dagen i manifestet og sett `folder: '<id>'` på dokumentene som skal inn. `tint`
(lys pastellfarge, f.eks. `#d7e9fb`) farger mappe-flisen, dokument-flisene inni OG
«papiret» når dokumentet åpnes — brukes til å gi dokumenttyper eget utseende (eks:
lyseblå vitneutsagn i dag 1). Umerkede dokumenter ligger løst i dagen som før.
Implementert i `DayFolder.tsx`; CSS: `.doc-tile--folder` / `.doc-tinted`.

`tint` kan også settes på ET ENKELT dokument (`CaseDoc.tint`) — da farges kun den flisa
og det dokumentets «papir», og dokumentets tint vinner over mappens. Virker også på løse
dokumenter utenfor mapper. Brukt av «Runill notater» (gult notatark, `#fff3bf`).

`parent: '<mappe-id>'` gir ÉN nivå nesting (mappe → mappe → dokument): mappen vises
inne i foreldremappen i stedet for på dagens rot, «tilbake» går til forelderen, og
flis-telleren på forelderen summerer dokumentene i alle barna. Brukt av «Pias bilder»
(dag 2) → `Mobilbilder` / `Kamerabilder`.

**Pias bilder = tidssone-sporet.** Ligger på **dag 2** (Pia sier i dag 1-utsagnet sitt at hun
skal sende dem, så de dukker opp dagen etter). Dokumenttitlene ER filnavnene
(`IMG_20260731_104612.jpg`), så klokkeslettet er synlig på flisene. Mobilen stilte seg om til
norsk tid ved landing; kameraet står fortsatt på Moldova-tid (én time foran, jf. Anna sitt
utsagn). Tre motiv finnes på begge enhetene med identiske sekunder og én times forskjell.
Filene ligger i `public/case/dag2/pia/` — se `README.md` der for hvilket bilde som skal ha
hvilket navn. Endrer du et tidspunkt må BÅDE `title` og `src` endres.

## Dørlogg + romfordeling = adgangskontroll-sporet

To dokumenter som bare betyr noe SAMMEN, og som derfor ligger på hver sin side av spillet:

- **`d1-dorlogg`** (dag 1, løs flis, blekgrønn `tint`) — 59 kortåpninger natt til 2. aug (bankett lørdag 1. aug), kun
  romnummer og klokkeslett. Ingen navn.
- **`a-romfordeling`** (Angelas filer) — hvilket romnummer som hører til hvem.

Nøkkelen er **MERKNAD-en** øverst i dørloggen: systemet logger *kun godkjent kortåpning* —
ikke passering, ikke dørstatus — og *utgang fra innsiden registreres ikke*. Den ligger BEVISST
utenfor ASCII-blokken, fordi `pre` ruller sidelengs på mobil og teksten ville blitt klippet.

**Loggen skal BARE inneholde kortåpninger.** Ingen dørstatus, ingen varsler, ingen avviste
avlesinger, ingen servicekort. Det er hele poenget: rom **327** (Sverre) har en åpning 23:32
som ser identisk ut med alle andres, og fordi utgang ikke logges sier loggen ingenting om at
han gikk ut igjen. Beviset er *fraværet*, ikke en rad — så snart én rad handler om noe annet
enn en åpning, blir den raden det spillerne ser først. Sjekkskriptet håndhever dette.

327 skiller seg heller ikke ut statistisk: to åpninger (som sju andre rom), og siste åpning
før midnatt (som 318, 206, 224 og 213). Falskt spor med vilje: 213 (Andreas) åpner 23:34 rett
etter — det er skjortebyttet. Vaktmesteren Oskar og Brage møter på vei til rommene sine (104 @
00:16, 316 @ 00:18) står bare i Oskars vitneutsagn; loggen kan ikke bekrefte den runden, og
skal ikke prøve.

Rører du én av filene, kjør **`npm run check:dorlogg`**: den sjekker at loggen bare inneholder
kortåpninger, at hver dør finnes i romfordelingen, at tidene er kronologiske over midnatt, at
fottellingen (59/22) stemmer med tabellen, og at alle mistenkte + offeret har et rom. Merk at
de sju mistenkte som ikke har etternavn i manifestet står med **fornavn** i romfordelingen —
bytt inn etternavn der du har dem, ikke dikt opp nye.

## Offerets filer = låst mobil (kode + «POLITI-HACK»)

«Offerets filer» vises som en smarttelefon på skrivebordet. Innholdet (`CASE.angelaFiles`)
ligger bak en låseskjerm med 4-sifret kode (`CASE.phonePin` i manifestet — plant koden som
spor i dokumentene; eksempelsaken bruker `2503`). Alternativ vei inn: «POLITI-HACK»-knappen
åpner et fingeravtrykk-minigame i GTA Casino Heist-stil (`FingerprintHack.tsx`, «clone
target»): avtrykket er kuttet i 8 horisontale striper som er forskjøvet sidelengs (med wrap);
skyv radene på plass (trykk venstre/høyre halvdel av raden, eller piltaster på PC) så de
matcher målavtrykket. **Tre avtrykk** må klones på **60 sek totalt** (klokka løper videre
mellom avtrykkene); hvert mislykkede forsøk gir **+5 sek** på neste (gradvis lettere, nullstilles
når minigamet lukkes). Løses automatisk når alt står riktig (ingen sjekk-knapp). Lyd (valgfrie
filer, mangler de spilles ingenting): `public/sfx/30sec.mp3` ved 30 sek igjen, og
`public/sfx/hack-theme.m4a` (evt. `.mp3`) looper som bakgrunnsmusikk mens hacket er åpent.
Avtrykket tegnes prosedyrelt som SVG (seeded) — ingen bildefiler. Opplåsing huskes per enhet
(`localStorage: gfm:angela-unlocked`). Utelat `phonePin` for å skru av låsen helt. Alt er
klient-side (ingen Supabase).

**Etter opplåsing vises en telefon-hjemskjerm** (ramme + statuslinje + app-ikoner med
badge for uleste), ikke lenger en flat filliste. Innhold i `CASE.angelaPhone` i manifestet:
- **WhatsApp** (`whatsapp: WhatsAppChat[]`) — samtaleliste + boble-tråder. Per melding:
  `deleted: true` («🚫 Denne meldingen ble slettet»), `unread` (telles i badges), `img`
  (bilde-boble), `time`. Komponent: `src/components/phone/WhatsAppApp.tsx`.
- **E-post** (`email: EmailMessage[]`) — faner Innboks/Sendt/Utkast/Søppelpost (kun de med
  innhold), ulest = fet + badge, `attachments` er vanlige `CaseDoc` (åpnes med DocView),
  utkast merkes «aldri sendt». Komponent: `phone/MailApp.tsx`.
- **Slack** (`slack: { workspace, channels }`) — kanaler (#) og DM-er (`dm: true`), meldinger
  med forfatter/tid/`edited` («(redigert)»). Komponent: `phone/SlackApp.tsx`.
- **Filer** — de gamle `angelaFiles`-dokumentene, nå som app på hjemskjermen.
- **Dag-gating:** `day: N` på samtale/melding/e-post/kanal ⇒ vises først når dag N er åpen
  (samme `useUnlock()`-tidslås som dag-mappene) — telefonen «avslører» mer utover i spillet,
  og nye uleste dukker opp i badgene. Uten `day` vises alt straks. Apper uten innhold skjules.
- **App-nivå lås:** `angelaPhone.appDays: { slack: 1, email: 2, whatsapp: 3 }` — appen vises
  på hjemskjermen men er «kryptert» (🔒 + «dag N», placeholder-skjerm) til dagen er nådd.
  Planen: hver app får sitt eget hack-minigame for å komme inn når dagen er nådd.
- **E-post-hacket:** `SignalBoxHack.tsx` (GTA Cayo Perico «signal box»): tre tall
  kobles unikt til tre symboler med skjulte multiplikatorer (×1/×2/×3); RESULT-displayet
  viser løpende sum, låses opp når den treffer TARGET. Ingen timer; hack-musikken looper
  (0.125 volum). Løst én gang per enhet (`localStorage: gfm:hack-email`).
- **WhatsApp-hacket:** `BruteForceHack.tsx` (GTA «BRUTEFORCE.EXE»): et forhåndsvalgt ord
  (`angelaPhone.whatsappHackWord`, standard GIGACHAD) knekkes bokstav for bokstav. ALLE
  hjulene vises side om side og spinner; fokus (grønn ramme) flyttes venstre → høyre.
  Stopp når den røde bokstaven står i den blå stripen; bom ⇒ ett tegn tilbake (hjulet bak
  spinner igjen). INGEN timer. Fart/lengde: `TICK_MS`/`REEL_LEN` øverst i fila. Musikk
  looper. Løst én gang per enhet (`localStorage: gfm:hack-whatsapp`). Slack har ikke eget
  hack ennå (åpnes rett når dagen nås).
Orkestrering + hjemskjerm: `AngelaFiles.tsx`. CSS-seksjon «Offerets mobil» i `retro.css`
(`.phone`, `.ph-*`, `.wa-*`, `.pmail-*`, `.pslack-*`).

## Datoer / tidsplan (settes i Supabase `case_config`, IKKE i koden)

Hver dag åpner kl. **09:00 Europe/Oslo**. Forrige dags resultater + avstemnings-stenging
skjer når neste dag slippes.

| Dag | Spørsmål | Åpner | Resultater vises |
| --- | --- | --- | --- |
| 1 | "Hvem lyver …" (flervalg) | **alltid åpen** (release i fortiden) | fre 31. juli 18:00 |
| 2 | "Hvordan døde …" (fritekst) | fre 31. juli 18:00 | lør 1. aug 09:00 |
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
- `npm run dev` (port settes av Vite, base-path `/`) · `npm run build` · `npm run typecheck`.
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
  galleri-reserve; brukes av `StoryComposer` (story).
- `src/components/SuspectBoard.tsx` — «Mistenkte»-korktavle (vises kun når `suspects` finnes).
  Nås via knapp i POLITI-appen (ikke eget skrivebordsikon); lukking går tilbake til `/politi`.
- `src/components/PixelPortrait.tsx` — 8-bit-portrett fra piksel-grid i manifestet
  (`Suspect.pixel`: palett + tegn-rader; vinner over `img`). Eksempel: «Andreas»-kortet.
- `src/components/PhoneLock.tsx` + `FingerprintHack.tsx` — låseskjerm for Angelas mobil
  (kode fra `CASE.phonePin`) og politi-hack-minigamet som omgår den.
- `src/components/AngelaFiles.tsx` + `src/components/phone/` (`PhoneHeader`, `WhatsAppApp`,
  `MailApp`, `SlackApp`) — telefon-hjemskjerm + appene på Angelas mobil (`CASE.angelaPhone`).
- `src/components/Minesveiper.tsx` — lite frittstående minesveiper-spill (påskeegg).
- `src/components/LarryEasterEgg.tsx` + `LarryPage.tsx` — Larry: 0.1 % sjanse per klikk på
  skrivebordet for at `larry.gif` glitcher inn. Etter første gang låses et Larry-ikon opp
  (`localStorage: gf-mordet.larry-found.v1`) → ruta `/larry` (svart vindu, `variant="larry"`).
  Larry tilbyr å «fjerne halvparten av vitnene»; sier man ja kalles RPC-en `flag_cheater()`
  (se `0009_larry.sql`) og han innrømmer med en gang at han ikke kan noe og at han skrev det
  ned — ingen skjult logging, og puslespillet endres ikke. Svaret huskes per enhet
  (`gfm:larry-answer`), flagget er idempotent server-side. **Excel-appen har et eget ark
  «Larry 👽»** som viser hele lista (navn + tidspunkt, via `get_cheat_flags` — synlig for
  alle innloggede; Larry sier selv at han noterer, veggen er en del av spøken).
- `src/components/Dialog.tsx` + `ContextMenu.tsx` — gjenbrukbar modal + høyreklikk-meny.
- `src/components/PoliceApp.tsx` + `VoteForm.tsx` + `ResultsView.tsx` — POLITI-app. Identitet
  hentes fra `useAuth()`. `ResultsView` animerer barene og viser «du stemte som X %».
- `src/components/AuthScreen.tsx` — logg inn / registrer (brukernavn + passord), retro-stilt.
- `src/lib/AuthContext.tsx` — Supabase Auth-sesjon + `useAuth()` (`signIn/signUp/signOut`,
  `user`). Hydrerer egne stemmer ved innlogging. Demo-modus: fabrikkert bruker.
- `src/lib/supabase.ts` — klient (persistert sesjon) + auth-wrappere (`signInWithUsername`
  m.fl., brukernavn→syntetisk e-post) + RPC-wrappere (demo-modus uten env), inkl. `getMyVotes`.
- `src/lib/UnlockContext.tsx` — henter åpne dager fra serveren.
- `src/lib/SettingsContext.tsx` — lyd-demping + menyspråk (localStorage). `src/lib/sfx.ts` — WebAudio-lyder.
- **Nynorsk-modus (kun menyer):** `src/lib/i18n.ts` (`useT()`, nb/nn-strengtabell — sakens
  innhold berøres IKKE). Velges ved første lasting (`LanguagePrompt`, før lyd-prompten og
  boot) og kan endres i ⚙️ Innstillinger på skrivebordet (som også har lyd av/på) — et
  `Dialog` i `Desktop.tsx`, ikke et eget vindu. Ikonet er ALLTID ulåst (i motsetning til
  sakens apper), så språk/lyd kan endres før «START HER» er åpnet.
  Oversatt: oppgavelinje, skrivebordsdialoger/-etiketter, dag-mappe-chrome, promptene.
  Nye UI-strenger: legg nøkkel i BÅDE nb og nn i i18n.ts og bruk `t('nøkkel')`.
- `src/lib/votes.ts` — spillerens egne stemmer: in-memory cache hydrert fra `get_my_votes`
  (autoritativ, kryssenhet) + localStorage-speil. `getMyVote` er synkron for render.
- `src/styles/retro.css` — hele retro-temaet (inkl. oppgavelinje, innlogging, tavle, spill).
- `supabase/migrations/0001_init.sql` — skjema, RLS, RPC-er, seed-datoer.
- `supabase/migrations/0002_schedule.sql` — valgfri `get_schedule`-RPC for nedtellingen.
- `supabase/migrations/0004_auth.sql` — innlogging: `votes.user_id`, `submit_vote` skrevet om
  til autentisert (`auth.uid()`), ny `get_my_votes`, grants til `authenticated`.
- `supabase/migrations/0007_lockdown.sql` — fjerner anon-`execute` på innloggings-RPC-ene
  (Supabase gir anon direkte grant som `revoke from public` ikke fjerner). MÅ kjøres.
- `supabase/migrations/0009_larry.sql` — Larry-flagget: tabellen `cheat_flags` + RPC-en
  `flag_cheater()`. MÅ kjøres for at flagget skal lagres (uten den er Larry-siden bare en
  vits uten logging — appen krasjer ikke). Fila har ferdige dashbord-spørringer i toppen.
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
