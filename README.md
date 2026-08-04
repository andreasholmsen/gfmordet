# GF-mordet 🕵️

En retro "gammel PC"-nettside med et murder mystery-case som ble spilt live over 4 dager
(28. juli – 2. aug 2026, ~100 spillere). **Spillet er over, og siden er nå et helt statisk
«museum»**: ingen innlogging, ingen backend — alt (svar, fremdrift) lagres lokalt i
nettleseren, og hvem som helst kan utforske mysteriet kronologisk fra start. Mobil-først,
hostet gratis på **GitHub Pages**. All tekst er på norsk.

- **Forsiden er en nedtelling til GF-mordet 2027** (torsdag 29. juli 2027 kl. 18:00):
  sort skjerm, hvit timer — klokka hentes fra serverens `Date`-header, så systemklokka
  kan ikke jukses med. Liten knapp nederst går til 2026-utgaven (spillet under).
- **Skrivebord** med app-/mappeikoner du trykker på.
- **Mapper Dag 1–4** med dokumenter (bilder, PDF, tekst). Dag 1 er åpen fra start;
  svar på dagens spørsmål i POLITI-appen for å låse opp neste dag.
- **Instagram/LinkedIn/WeChat** med falske bevisposter, **Offerets mobil** med
  hack-minigames, og en **POLITI-app** med dagens spørsmål og fasit.
- **Excel-appen** viser de ekte stemmetallene fra det live spillet (bakt inn i
  `src/case/results.ts`) — inkludert «du stemte som X %» mot ditt lokale svar.
- **Nullstill fremdrift** finnes i ⚙️ Innstillinger, så mysteriet kan spilles på nytt.

---

## Kjør lokalt

```bash
npm install
npm run dev
```

Ingen `.env` eller backend trengs — alt kjører i nettleseren.

## Innholdet

Alt redigeres i **`src/case/manifest.ts`** — tittel, intro, dokumenter per dag,
spørsmål/alternativer og fasiten (dag 4). Filer (bilder/PDF) ligger i `public/case/...`
(se `public/case/README.md`). De ekte slutt-tallene fra spillet ligger i
`src/case/results.ts`.

## Publisering

Push til `main` → workflowen `.github/workflows/deploy.yml` bygger og publiserer til
GitHub Pages (https://www.gfmordet.no/). Ingen secrets trengs.

## Historikk

Under det live spillet brukte siden Supabase (auth med brukernavn/passord, server-håndhevet
tidslås, stemmer, spiller-stories). Alt dette ble fjernet i aug. 2026 da siden ble gjort
statisk. SQL-migrasjonene ligger igjen i `supabase/migrations/` som historikk, og
git-historikken har hele den gamle klienten.

## Kjente begrensninger

- **Alle dokumenter ligger statisk i deployet** og kan i teorien nås via URL før de er
  «låst opp» lokalt. Uproblematisk nå som spillet er over.
- **Fremdrift er per enhet/nettleser** (localStorage) — bytter du enhet, starter du på nytt.
- **PDF på mobil** (særlig iOS Safari) er ujevnt; det finnes en «Åpne i ny fane»-lenke
  som fallback.

## Teknisk

Vite + React + TypeScript · HashRouter (unngår 404 på GitHub Pages) · `marked` for
markdown · egen retro-CSS (`src/styles/retro.css`).
