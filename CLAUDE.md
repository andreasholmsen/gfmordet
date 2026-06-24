# Mordmysteriet — prosjektnotater & handoff

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
  - Trygg å eksponere i frontend — RLS er på, og kun de fire RPC-ene er tilgjengelige.
  - **Aldri** legg `service_role`/secret-nøkkelen i frontend eller repoet.
- **Sikkerhetsmodell:** RLS er på alle tabeller, og det finnes INGEN anon-policies for
  direkte tabelltilgang. Alt går via fire `SECURITY DEFINER`-RPC-er som håndhever server-tid:
  `get_unlocked_days`, `submit_vote`, `get_results`, `get_free_text`. Verifisert at direkte
  `select` på `votes`/`case_config` med anon-nøkkel returnerer tomt.
- **Tidslås:** all opplåsing/stemming/resultat-frigjøring bestemmes av `now()` server-side,
  så det kan ikke jukses ved å endre klokka på telefonen.
- Gratis-tier pauser etter 7 dager uten aktivitet — ikke et problem under spillet, men sett
  opp keep-alive hvis statistikken skal leve videre etter 2. aug.

## Innhold (det eieren redigerer)

- **`src/case/manifest.ts`** = eneste kilde for tittel, intro, dokumenter per dag,
  Instagram-poster, spørsmål/alternativer og fasiten (dag 4). Pre-fylt med eksempelsak
  "Mordet på Angela" — må byttes ut med ekte innhold.
- Filer (bilder/PDF) legges i `public/case/dagN/` og `public/case/instagram/`, pekes på med
  `src` (relativt fra /public). Tekst kan også skrives `inline` i manifestet. Se
  `public/case/README.md`.
- `option.id` i manifestet (f.eks. `kari`, `per`, `annet`) lagres som `choice` i votes og
  brukes til å vise resultatlabels. `solution.killerId` bør matche en dag 3-option.

## Kjøre lokalt / bygge

- Node ligger i `~/.local/node` (lagt til i `~/.bashrc`; ikke installert system-globalt).
  Hvis `node`/`npm` ikke finnes i en ny shell: `export PATH="$HOME/.local/node/bin:$PATH"`.
- `npm run dev` (port settes av Vite, base-path `/gfmordet/`) · `npm run build` · `npm run typecheck`.
- `.env` (gitignorert) holder Supabase-verdiene for lokal kjøring.

## Filkart (de viktigste)

- `src/case/manifest.ts` — alt innhold (rediger her).
- `src/App.tsx` — ruter (HashRouter): `/`, `/dag/:day`, `/instagram`, `/politi`.
- `src/components/Desktop.tsx` — skrivebord med ikon-grid + låsestatus.
- `src/components/AppWindow.tsx` — retro fullskjerm-vindu (tittellinje + lukk). `variant`-prop
  ('folder' | 'instagram' | 'police') styrer åpne/lukke-animasjon + tema. Lukkeknappen spiller
  exit-animasjon før navigasjon. POLITI-vinduet har eget mørkt terminal-tema (scoped `.window--police`).
- `src/components/BootScreen.tsx` — terminal boot-animasjon ved sidelasting.
- `src/components/DayFolder.tsx` + `DocView.tsx` — mappe + bilde/PDF/markdown-visere.
- `src/components/InstagramApp.tsx` — falsk IG-feed.
- `src/components/PoliceApp.tsx` + `VoteForm.tsx` + `ResultsView.tsx` + `NamePrompt.tsx` — POLITI-app.
- `src/lib/supabase.ts` — klient + RPC-wrappere (faller til demo-modus uten env).
- `src/lib/UnlockContext.tsx` — henter åpne dager fra serveren.
- `src/lib/player.ts` — localStorage-identitet (navn + uuid, én stemme per dag per enhet).
- `src/styles/retro.css` — hele retro-temaet.
- `supabase/migrations/0001_init.sql` — skjema, RLS, 4 RPC-er, seed-datoer.
- `.github/workflows/deploy.yml` — Pages-deploy (trenger de to repo-secrets).

## Mulige videre oppgaver (ikke gjort ennå)

- Vanntett gating av dag 4-fasiten via privat Supabase Storage + signert URL (i dag ligger
  alle dokumenter statisk i deployet og er teknisk nåbare via URL før opplåsing — lav risiko
  for vennespill, bruk kryptiske filnavn).
- Bump GitHub Actions-versjoner (Pages-actions targeter Node 20 som GitHub deprecaterer).
