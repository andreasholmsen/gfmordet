# GF-mordet 🕵️

> Retro «gammel PC»-nettside med et murder mystery-case spilt live over 4 dager — nå et statisk «museum» på www.gfmordet.no.

## Om

GF-mordet er et murder mystery-case pakket inn som en retro «gammel PC»-nettside, spilt live over 4 dager (28. juli – 2. aug 2026, ~100 spillere). Spillet er over, og siden er nå et helt statisk «museum»: ingen innlogging, ingen backend — svar og fremdrift lagres kun lokalt i nettleseren, og hvem som helst kan utforske mysteriet kronologisk fra start. Forsiden er en nedtelling til GF-mordet 2027 (klokka hentes fra serverens `Date`-header, så systemklokka kan ikke jukses med), med en liten knapp nederst som slipper deg inn i 2026-utgaven. Der møter du et skrivebord med mapper for Dag 1–4, falske Instagram/LinkedIn/WeChat-poster, offerets mobil med hack-minigames, en POLITI-app med dagens spørsmål og fasit, og en Excel-app med de ekte stemmetallene fra det live spillet. Mobil-først, all tekst på norsk, hostet gratis på GitHub Pages.

Under det live spillet brukte siden Supabase (auth, server-håndhevet tidslås, stemmer, spiller-stories); alt dette ble fjernet i aug. 2026 da siden ble gjort statisk. SQL-migrasjonene ligger igjen i `supabase/migrations/` som historikk, og git-historikken har hele den gamle klienten.

## Teknologi

- **Vite + React + TypeScript** (React 18, Vite 5)
- **react-router-dom** med HashRouter (unngår 404 på GitHub Pages)
- **marked** for markdown-rendering
- Egen retro-CSS (`src/styles/retro.css`), service worker for media-caching (`public/sw.js`)
- **GitHub Pages** via `.github/workflows/deploy.yml`

## Bygg og kjør

```bash
npm install
npm run dev        # utviklingsserver
npm run build      # tsc -b && vite build → dist/
npm run preview    # forhåndsvis produksjonsbygget
npm run typecheck  # kun typesjekk
```

Ingen `.env` eller backend trengs — alt kjører i nettleseren. Innholdssjekk-skript: `npm run check:content` og `npm run check:dorlogg`.

**Publisering:** push til `main` → workflowen bygger og publiserer til GitHub Pages (https://www.gfmordet.no/). Ingen secrets trengs.

## Prosjektstruktur

- `src/case/manifest.ts` — alt innhold redigeres her: tittel, intro, dokumenter per dag, spørsmål/alternativer og fasiten (dag 4)
- `src/case/results.ts` — de ekte slutt-tallene fra det live spillet
- `src/components/` — skrivebordet, appene (POLITI, Instagram, WeChat, Excel-resultater, mobil med hack-minigames), nedtellingen (`Countdown2027.tsx`)
- `public/case/` — bilder/PDF-er per dag (se `public/case/README.md`)
- `scripts/` — innholdssjekker og spiller-hashing (kjøres med `tsx`)
- `supabase/migrations/` — historikk fra live-perioden (ikke i bruk)
- `docs/` — skriveguide og case-notater

**Kjente begrensninger:** alle dokumenter ligger statisk i deployet og kan i teorien nås via URL før de er «låst opp» lokalt (uproblematisk nå som spillet er over); fremdrift er per enhet/nettleser (localStorage); PDF på mobil (særlig iOS Safari) er ujevnt — det finnes en «Åpne i ny fane»-lenke som fallback.
