# GF-mordet 🕵️

En retro "gammel PC"-nettside for å distribuere et murder mystery-case til ~100 spillere
over 4 dager. Mobil-først, hostet gratis på **GitHub Pages**, med stemming/gjetning lagret i
**Supabase**. All tekst er på norsk.

- **Skrivebord** med app-/mappeikoner du trykker på.
- **Mapper Dag 1–4** med dokumenter (bilder, PDF, tekst) som låses opp etter dato.
- **Instagram-app** med falske bevisbilder.
- **POLITI-app** med dagens spørsmål, stemming og resultater (forrige dags resultater vises i dag).
- **Tidslås håndhevet server-side** — kan ikke jukses ved å endre klokka på telefonen.

---

## 1. Kjør lokalt

```bash
npm install
npm run dev
```

Åpne adressen Vite skriver ut. Uten Supabase-oppsett kjører appen i **demo-modus**:
alle dager er åpne og stemmer lagres ikke — fint for å teste utseende og innhold.

## 2. Fyll inn innholdet (saken din)

Alt redigeres i **`src/case/manifest.ts`** — tittel, intro, dokumenter per dag,
Instagram-poster, spørsmål/alternativer og fasiten (dag 4).

Filer (bilder/PDF) legges i `public/case/...` og pekes på med `src` (se `public/case/README.md`).

> Datoer settes **ikke** her — de bor i Supabase (`case_config`), se neste steg.

## 3. Sett opp Supabase

1. Lag et gratis prosjekt på [supabase.com](https://supabase.com).
2. Åpne **SQL Editor**, lim inn `supabase/migrations/0001_init.sql` og kjør.
3. **Juster datoene** nederst i SQL-en (`case_config`) til dine fire dager. Bruk
   `Europe/Oslo` så de treffer norsk lokaltid.
4. Hent **Project URL** og **anon/publishable key** under _Settings → API_.
5. Lokalt: kopier `.env.example` til `.env` og fyll inn `VITE_SUPABASE_URL` og
   `VITE_SUPABASE_ANON_KEY`.

Slik fungerer tidslåsen:

- `release_at` — når dagens mappe/avstemning åpnes.
- `closes_at` — når avstemningen stenger (typisk = neste dags `release_at`).
- `results_at` — når dagens resultater blir synlige (typisk = neste dags `release_at`),
  slik at dag 1-resultater dukker opp på dag 2 osv.

Anon-nøkkelen er trygg i frontend fordi RLS er på og spillere **kun** kan kalle de fire
funksjonene `get_unlocked_days`, `submit_vote`, `get_results`, `get_free_text` — de kan
ikke lese rådata/navn. Kjør gjerne Supabase **Security Advisor** for å bekrefte.

## 4. Publiser på GitHub Pages

1. Repoet må hete `gfmordet` (ellers: endre `base` i `vite.config.ts`).
2. _Settings → Pages → Source:_ **GitHub Actions**.
3. _Settings → Secrets and variables → Actions →_ legg til repository secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Push til `main`. Workflowen `.github/workflows/deploy.yml` bygger og publiserer.
5. Siden blir tilgjengelig på `https://<brukernavn>.github.io/gfmordet/`.

## Verifisering før lansering

- Sett en testdato (f.eks. dag 2 om 2 minutter) og bekreft at mappen/POLITI låses opp.
- Prøv å stemme før `release_at` / etter `closes_at` → serveren skal avvise (test gjerne
  ved å stille telefonklokka frem; det skal **ikke** låse opp noe, fordi serveren bestemmer).
- Bekreft at resultater er tomme før `results_at` og vises etterpå.

## Kjente begrensninger

- **Statiske dokumenter** ligger i deployet og kan i teorien nås via URL før de er
  «åpnet». For et vennespill er dette lav risiko — bruk kryptiske filnavn. Vil du ha det
  vanntett (særlig dag 4-fasiten): legg de filene i en privat Supabase Storage-bucket og
  server signerte URL-er via en RPC som sjekker `release_at`.
- **Identitet** er per enhet (localStorage). To enheter = to stemmer. Greit for vennespill.
- **Supabase gratis-tier** pauser etter 7 dagers inaktivitet — sett opp prosjektet nær
  lansering, eller legg en liten keep-alive hvis statistikken skal leve videre.
- **PDF på mobil** (særlig iOS Safari) er ujevnt; foretrekk bilder/tekst der du kan. Det
  finnes en «Åpne i ny fane»-lenke som fallback.

## Teknisk

Vite + React + TypeScript · HashRouter (unngår 404 på GitHub Pages) · `@supabase/supabase-js`
· `marked` for markdown · egen retro-CSS (`src/styles/retro.css`).
