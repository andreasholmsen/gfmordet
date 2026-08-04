# GF-mordet — prosjektnotater & handoff

Retro "gammel PC"-nettside for et 4-dagers murder mystery-case som ble spilt live
28. juli – 2. aug 2026 (~100 norske spillere). **Spillet er over — siden er nå et helt
statisk «museum»** (omgjort aug. 2026): ingen innlogging, ingen backend. Hvem som helst
kan utforske mysteriet kronologisk; svar og fremdrift lagres kun i localStorage.
Mobil-først. All UI-tekst er på norsk.

**Stack:** Vite + React + TypeScript · HashRouter · `marked` · egen retro-CSS.
Hostet på GitHub Pages fra det private repoet `andreasholmsen/gfmordet`.
**Live:** https://www.gfmordet.no/ (eget domene på roten ⇒ `base: '/'` i `vite.config.ts`).
Deploy: push til `main` → `.github/workflows/deploy.yml`. Ingen repo-secrets trengs.

---

## Forsiden = nedtelling til GF-mordet 2027

Alle som åpner siden møtes av en helt sort skjerm med en hvit timer som teller ned til
**torsdag 29. juli 2027 kl. 18:00 Europe/Oslo** (`TARGET_UTC_MS` i
`src/components/Countdown2027.tsx`). Helt nederst: en liten, diskret
knapp «Gå til 2026-utgaven →» som slipper deg inn i spillet (valget huskes bevisst IKKE —
nedtellingen vises igjen ved neste sidelasting).

**Juksesikring:** timeren bruker ALDRI enhetens klokke. Ved lasting gjøres en HEAD-request
mot eget origin og serverens `Date`-header brukes som fasit (GitHub Pages/Fastly setter
fersk Date per svar selv ved cache-HIT — verifisert 2026-08-04). Deretter tikker klokka med
`performance.now()` (monoton — å stille systemklokka gjør ingenting), med resynk hvert
5. min og når fanen våkner. Får vi aldri svar (offline): fallback til enhetens klokke,
merket `trusted: false`. NB: når 2027-spillet bygges må selve INNHOLDS-låsen håndheves
server-side igjen hvis den skal være vanntett — nedtellingen er bare teater.
CSS: `.cd27`-seksjonen nederst i `retro.css`.

## Statisk modell (siden aug. 2026)

- **Ingen Supabase.** `@supabase/supabase-js` er fjernet fra package.json, og
  `src/lib/supabase.ts`, `AuthContext.tsx`, `AuthScreen.tsx` m.fl. er slettet.
  SQL-filene i `supabase/migrations/` ligger igjen KUN som historikk; Supabase-prosjektet
  kan slettes/pauses fritt uten at siden påvirkes.
- **Ingen innlogging.** Boot-animasjon → rett på skrivebordet (ingen Gate/AuthScreen).
  Brukeren er anonym — ingen navn vises noe sted.
- **Progresjonsbasert opplåsing** (`src/lib/UnlockContext.tsx`): dag 1 er alltid åpen;
  dag N+1 låses opp når man har SVART på dag N sitt spørsmål i POLITI-appen. Dager uten
  spørsmål (dag 4) sperrer ikke. Svar lagres i localStorage (`src/lib/votes.ts`,
  nøkkel `gf-mordet.votes.v1`) — spillere som var med live har svarene liggende og får
  dermed alt åpent automatisk.
- **Svar er låst når de er sendt** (det er de som driver progresjonen): VoteForm lagrer
  lokalt + kaller `refresh()` → PoliceApp viser umiddelbart dagens fasit (`DayContent.reveal`)
  + «Du har svart»-panelet med peker videre. Ingen «endre svar».
- **Ekte slutt-tall er bakt inn** i `src/case/results.ts` (eksportert fra Supabase
  4. aug 2026 via `get_results`/`get_free_text`): dag 1 = 21 stemmer (flervalg),
  dag 2 = 6 fritekst-teorier, dag 3 = 3 stemmer. Excel-appen (`ResultsApp`) leser herfra;
  en dags tall vises først når dagen er besvart (samme progresjonsregel som fasiten).
  «Du stemte som X %» finnes ikke lenger som egen visning i POLITI (resultater bor i Excel);
  dag 4-dossieret (`KillerReveal`) bruker fortsatt det lokale dag 3-svaret til personlig dom.
- **Stories/minnealbum er FJERNET** (spiller-opplastede bilder lå i privat Supabase-bucket
  og kunne ikke gjøres offentlige uten innlogging): `StoriesBar`, `StoryViewer`,
  `StoryComposer`, `StoryAlbum`, `CameraCapture`, `lib/image.ts`, ruten `/album` og
  📸-ikonet er slettet. Bildene ligger fortsatt i Supabase-bucketen `stories` til
  prosjektet slettes.
- **Larry** kaller ikke lenger `flag_cheater()` — svaret huskes bare lokalt
  (`gfm:larry-answer`). Selve spøken er uendret.
- **Nullstill fremdrift**: knapp i ⚙️ Innstillinger (`Desktop.tsx` → `resetProgress()`).
  Sletter svar, briefing-/fasit-låser, START HER-blink, telefonopplåsing + hacks, Larry og
  Bragevalgomaten — beholder språk/lyd — og laster siden på nytt. Legger du til en ny
  localStorage-nøkkel for fremdrift: husk å legge den inn i `resetProgress()`.
- **Taskbar** viser nå bare «Dag N av 4 åpen» + klokke (nedtelling og logg ut fjernet).
- **Dev = prod:** `npm run dev` har samme progresjonslås som prod (den gamle
  «alle dager åpne i dev»-snarveien er borte). For å se alt: svar deg gjennom dagene.

## localStorage-nøkler (fremdrift)

`gf-mordet.votes.v1` (svar/progresjon) · `gfm:politi-briefing:<dag>` (avhør lest) ·
`gfm:fasit-sett` (KillerReveal sett → dag 4-`afterReveal`-dokumenter) ·
`gf-mordet.start.seen.v1` (START HER-blink) · `gfm:angela-unlocked` + `gfm:hack-email` +
`gfm:hack-whatsapp` (Angelas mobil) · `gf-mordet.larry-found.v1` + `gfm:larry-answer` ·
`gfm:bragevalgomat`. Innstillinger (beholdes ved nullstilling): `gf-mordet.settings.v1`,
`gfm:lang-prompted`, `gfm:sound-prompted`.

## Undermapper i dag-mappene (med farge-tema)

Dag-mapper kan ha undermapper: definer `folders: [{ id, title, icon?, tint?, intro?, parent? }]`
på dagen i manifestet og sett `folder: '<id>'` på dokumentene som skal inn. `tint`
(lys pastellfarge, f.eks. `#d7e9fb`) farger mappe-flisen, dokument-flisene inni OG
«papiret» når dokumentet åpnes. `tint` kan også settes på ETT dokument (`CaseDoc.tint`) —
dokumentets tint vinner over mappens (brukt av «Runill notater», gult `#fff3bf`).
`parent: '<mappe-id>'` gir ÉN nivå nesting (brukt av «Pias bilder» dag 2 → `Mobilbilder`).
Implementert i `DayFolder.tsx`; CSS: `.doc-tile--folder` / `.doc-tinted`.

**Pias bilder — tidssone-sporet ble KUTTET (2026-08-01).** Kun mobilbildene på dag 2 er
igjen; dokumenttitlene ER filnavnene (`IMG_20260731_104612.jpg`). Filene ligger i
`public/case/dag2/pia/` — se `README.md` der. Endrer du et tidspunkt må BÅDE `title` og
`src` endres.

## Dørlogg + romfordeling = adgangskontroll-sporet

To dokumenter som bare betyr noe SAMMEN: **`d1-dorlogg`** (dag 1, blekgrønn tint; 59
kortåpninger natt til 2. aug, kun romnummer/klokkeslett) og **`a-romfordeling`**
(Angelas filer; rom → navn). Nøkkelen er MERKNAD-en øverst i dørloggen (bevisst utenfor
ASCII-blokken, som ruller sidelengs på mobil): kun godkjent kortåpning logges, utgang
registreres ikke — beviset er *fraværet* (rom 327/Sverre, åpning 23:32 som ser normal ut).
Loggen skal BARE inneholde kortåpninger — ingen dørstatus/varsler/servicekort. Falskt spor
med vilje: 213 (Andreas) åpner 23:34 rett etter (skjortebyttet). Rører du én av filene,
kjør **`npm run check:dorlogg`** (sjekker format, kronologi over midnatt, fottelling 59/22,
at alle mistenkte + offeret har rom).

## Offerets filer = låst mobil (kode + «POLITI-HACK»)

Vises som smarttelefon på skrivebordet; innholdet bak låseskjerm med 4-sifret kode
(`CASE.phonePin`) eller fingeravtrykk-minigamet (`FingerprintHack.tsx`, GTA-stil:
3 avtrykk på 60 sek totalt, +5 sek per mislykket forsøk). Lyd (valgfrie filer):
`public/sfx/30sec.mp3`, `public/sfx/hack-theme.m4a`. Avtrykk tegnes prosedyrelt som SVG.
Opplåsing huskes per enhet (`gfm:angela-unlocked`). Alt er klient-side.

**Etter opplåsing: telefon-hjemskjerm** (`AngelaFiles.tsx` + `src/components/phone/`:
`PhoneHeader`, `WhatsAppApp`, `MailApp`, `SlackApp`). Innhold i `CASE.angelaPhone`:
- **WhatsApp** (`whatsapp: WhatsAppChat[]`) — per melding: `deleted`, `unread` (badges),
  `img`, `time`.
- **E-post** (`email: EmailMessage[]`) — faner Innboks/Sendt/Utkast/Søppelpost,
  `attachments` er vanlige `CaseDoc`, utkast merkes «aldri sendt».
- **Slack** (`slack: { workspace, channels }`) — kanaler (#) og DM-er (`dm: true`),
  `edited` («(redigert)»).
- **Filer** — de gamle `angelaFiles`-dokumentene som app.
- **Dag-gating:** `day: N` på samtale/melding/e-post/kanal ⇒ vises først når dag N er
  åpen (samme `useUnlock()`-lås — nå progresjonsbasert). Uten `day` vises alt straks.
- **App-nivå lås:** `angelaPhone.appDays: { slack: 1, email: 2, whatsapp: 3 }` — appen
  vises men er «kryptert» til dagen er nådd. E-post-hacket: `SignalBoxHack.tsx`
  (`gfm:hack-email`). WhatsApp-hacket: `BruteForceHack.tsx` (ord fra
  `angelaPhone.whatsappHackWord`, standard GIGACHAD; `gfm:hack-whatsapp`;
  fart/lengde: `TICK_MS`/`REEL_LEN` øverst i fila). Slack har ikke eget hack.
CSS-seksjon «Offerets mobil» i `retro.css` (`.phone`, `.ph-*`, `.wa-*`, `.pmail-*`, `.pslack-*`).

## Innhold (det eieren redigerer)

- **`src/case/manifest.ts`** = eneste kilde for tittel, intro, dokumenter per dag,
  Instagram-poster, spørsmål/alternativer og fasiten (dag 4). Inneholder den ekte saken.
- **`src/case/results.ts`** = de ekte stemmetallene/teoriene fra det live spillet.
  `option.id` i manifestet må matche `choice`-verdiene her. `solution.killerId` bør
  matche en dag 3-option.
- Filer (bilder/PDF) ligger i `public/case/dagN/` og `public/case/instagram/`, pekes på
  med `src` (relativt fra /public). Tekst kan også skrives `inline`. Se `public/case/README.md`.
- **Skriveguide:** `docs/skriveguide.md`. `npm run check:content` flagger for lange
  dokumenter (`-- --strict` gir feilkode på advarsler).

## Kjøre lokalt / bygge

- Node ligger i `~/.local/node` (lagt til i `~/.bashrc`; ikke system-globalt). I ny shell
  evt.: `export PATH="$HOME/.local/node/bin:$PATH"`.
- `npm run dev` · `npm run build` · `npm run typecheck`. **Ingen `.env` trengs lenger**
  (en gammel `.env` med Supabase-verdier kan ligge igjen lokalt — den brukes ikke).

## Filkart (de viktigste)

- `src/case/manifest.ts` — alt innhold. Inkl. `suspects` (Mistenkte-tavla) og
  spørsmålstypen `image_choice` (bildevalg).
- `src/case/results.ts` — bakte slutt-tall fra spillet (brukes av Excel-appen).
- `src/components/Countdown2027.tsx` — nedtellingsforsiden (se egen seksjon over).
- `src/App.tsx` — ruter (HashRouter): `/`, `/start`, `/dag/:day`, `/instagram`,
  `/linkedin`, `/wechat`, `/spotify`, `/politi`, `/mistenkte`, `/angela`, `/resultater`,
  `/spill/minesveiper`, `/bragevalgomat`, `/larry`. `SettingsProvider` + `UnlockProvider`;
  ingen auth/Gate.
- `src/lib/UnlockContext.tsx` — lokal progresjon (svar på dag N → dag N+1 åpen; `refresh()`).
- `src/lib/votes.ts` — lokale svar (localStorage + in-memory; `getMyVote` er synkron).
- `src/components/Desktop.tsx` — skrivebord med ikon-grid, høyreklikk-meny og dialoger,
  inkl. ⚙️ Innstillinger (språk/lyd/«Nullstill fremdrift» → `resetProgress()`).
- `src/components/Taskbar.tsx` — dagstatus («Dag N av 4 åpen») + klokke.
- `src/components/BootScreen.tsx` — terminal boot-animasjon ved sidelasting.
- `src/components/PoliceApp.tsx` + `VoteForm.tsx` + `KillerReveal.tsx` — POLITI-appen:
  dagens avhør (`DayContent.briefing` MÅ åpnes før spørsmålet vises;
  `gfm:politi-briefing:<dag>`), spørsmålet (`VoteForm` lagrer lokalt og låser opp neste
  dag), deretter fasit (`DayContent.reveal`) + «Du har svart»-panel. Dag 4 =
  `KillerReveal` (animert avsløring, personlig dom fra lokalt dag 3-svar,
  `markFasitSeen()` låser opp `afterReveal`-dokumenter i dag 4-mappen).
- `src/components/ResultsApp.tsx` — Excel-appen: bakte tall fra `results.ts`; dag 2
  viser fritekst-teoriene som regneark. Kun ark for dager MED avstemning (dag 1–3).
- `src/components/DayFolder.tsx` + `DocView.tsx` — mappe + bilde/PDF/markdown-visere.
  `Markdown.tsx` ruter relative bilde-stier gjennom `assetUrl`.
- `src/components/AngelaFiles.tsx` + `src/components/phone/` + `PhoneLock.tsx` +
  `FingerprintHack.tsx` / `SignalBoxHack.tsx` / `BruteForceHack.tsx` — Angelas mobil.
- `src/components/InstagramApp.tsx` / `LinkedinApp.tsx` / `WeChatApp.tsx` /
  `SpotifyApp.tsx` — statiske feeds fra manifestet (stories-raden er fjernet fra IG).
- `src/components/SuspectBoard.tsx` + `PixelPortrait.tsx` — «Mistenkte»-korktavla
  (nås via knapp i POLITI-appen; lukking går tilbake til `/politi`).
- `src/components/LarryEasterEgg.tsx` + `LarryPage.tsx` — Larry: 1 % sjanse per klikk på
  skrivebordet; etter første gang låses 👽-ikonet opp (`gf-mordet.larry-found.v1`) →
  ruta `/larry`. Helt lokal nå (ingen server-flagg).
- `src/components/Minesveiper.tsx` + `Bragevalgomat.tsx` — påskeegg/moro.
- `src/components/Dialog.tsx` + `ContextMenu.tsx` — gjenbrukbar modal + høyreklikk-meny.
- `src/components/AppWindow.tsx` — retro fullskjerm-vindu (`variant`-prop styrer tema).
- `src/lib/SettingsContext.tsx` — lyd-demping + menyspråk. `src/lib/sfx.ts` — WebAudio.
- **Nynorsk-modus (kun menyer):** `src/lib/i18n.ts` (`useT()`, nb/nn-strengtabell —
  sakens innhold berøres IKKE). Velges ved første lasting (`LanguagePrompt`) og i
  ⚙️ Innstillinger. Nye UI-strenger: legg nøkkel i BÅDE nb og nn.
- `src/lib/fasit.ts` / `src/lib/intro.ts` — småflagg (fasit sett / START HER åpnet).
- `src/components/ErrorBoundary.tsx` — fullskjerm-fallback ved render-krasj (i main.tsx).
- `src/styles/retro.css` — hele retro-temaet.
- `supabase/migrations/` — KUN historikk fra det live spillet (brukes ikke lenger).
- `.github/workflows/deploy.yml` — Pages-deploy (ingen secrets).
- **Verktøy:** `npm run check:content`, `npm run check:dorlogg`. (`preflight` og
  `jump-day.sh` er slettet — de var Supabase-verktøy.)

## Mulige videre oppgaver (ikke gjort ennå)

- Bump GitHub Actions-versjoner (Pages-actions targeter Node 20 som GitHub deprecaterer).
- Slette/pause Supabase-prosjektet — ingenting i siden bruker det lenger. NB: bucketen
  `stories` med spillernes opplastede bilder forsvinner da; last dem ned først hvis de
  skal tas vare på (krever service_role eller innlogget bruker, se 0005_stories.sql).
