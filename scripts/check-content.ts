/* eslint-disable no-console */
// ============================================================================
//  Innholds-QA: flagger dokumenter som er for lange / for teksttunge, så saken
//  føles som utforsking og ikke «100 sider lesing». Kjør: npm run check:content
//  (legg til -- --strict for at advarsler også skal gi feilkode).
//
//  Måler kun INLINE markdown/html (det spilleren faktisk leser). image/pdf
//  regnes som visuelt = greit. Terskler er tunbare konstantene under.
// ============================================================================

import { CASE, type CaseDoc } from '../src/case/manifest'

// --- Terskler (juster fritt) ------------------------------------------------
const DOC_WARN = 150 // ord: over dette = ⚠ (vurder å dele opp)
const DOC_FAIL = 250 // ord: over dette = ✗ (for langt)
const DAY_WARN_TOTAL = 600 // ord per dag totalt = ⚠
const DAY_MIN_DOCS = 3 // færre dokumenter enn dette per dag = ⚠ (lite å utforske)
const IG_WARN = 30 // ord i en Instagram-caption = ⚠
const LI_WARN = 60 // ord i et LinkedIn-innlegg = ⚠
const WPM = 200 // lesehastighet for estimert lesetid

const strict = process.argv.includes('--strict')

// --- Hjelpere ---------------------------------------------------------------
function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ') // kodeblokker
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // bilder
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // lenker -> tekst
    .replace(/^\s{0,3}#{1,6}\s+/gm, '') // overskrifter
    .replace(/^\s{0,3}>\s?/gm, '') // sitatblokk
    .replace(/^\s*[-*+]\s+/gm, '') // punktliste
    .replace(/^\s*\d+\.\s+/gm, '') // nummerert liste
    .replace(/[*_`~]/g, '') // emfase / kode
    .replace(/\s+/g, ' ')
    .trim()
}

function wordCount(text: string): number {
  const t = stripMarkdown(text)
  return t ? t.split(/\s+/).length : 0
}

function readTime(words: number): string {
  const sec = Math.round((words / WPM) * 60)
  return sec < 60 ? `${sec}s` : `${Math.floor(sec / 60)}m ${sec % 60}s`
}

function mark(words: number): '✓' | '⚠' | '✗' {
  if (words > DOC_FAIL) return '✗'
  if (words > DOC_WARN) return '⚠'
  return '✓'
}

// --- Tellere ----------------------------------------------------------------
let fails = 0
let warns = 0
const line = (s = '') => console.log(s)

function reportDocs(heading: string, docs: CaseDoc[]) {
  line(`\n${heading}  (${docs.length} dokument${docs.length === 1 ? '' : 'er'})`)
  if (docs.length === 0) {
    line('  (ingen dokumenter)')
    return 0
  }
  let dayWords = 0
  for (const d of docs) {
    if ((d.kind === 'image' || d.kind === 'pdf') && !d.inline) {
      line(`  ✓  ${d.title.padEnd(28)} visuelt (${d.kind}) — ok`)
      continue
    }
    const text = d.inline ?? ''
    if (!text) {
      line(`  ·  ${d.title.padEnd(28)} ${d.kind} fra fil (måles ikke)`)
      continue
    }
    const w = wordCount(text)
    dayWords += w
    const m = mark(w)
    if (m === '✗') fails++
    else if (m === '⚠') warns++
    line(`  ${m}  ${d.title.padEnd(28)} ${String(w).padStart(4)} ord  ~${readTime(w)}`)
  }
  return dayWords
}

line('══════════════════════════════════════════════════════════════')
line(' Innholds-QA — holder dokumentene korte og utforskbare')
line('══════════════════════════════════════════════════════════════')
line(` Terskler: ⚠ > ${DOC_WARN} ord · ✗ > ${DOC_FAIL} ord per dokument`)

for (const day of CASE.days) {
  const total = reportDocs(`${day.title}: ${day.docs.length ? '' : '(tom)'}`.trim(), day.docs)
  if (total > DAY_WARN_TOTAL) {
    warns++
    line(`  ⚠  Dagen har ${total} ord totalt (> ${DAY_WARN_TOTAL}). Vurder å kutte/flytte.`)
  }
  // Dag 4 har med vilje ingen dokumenter (kun fasit) — ikke klag på antall der.
  if (day.day !== 4 && day.docs.length < DAY_MIN_DOCS) {
    warns++
    line(`  ⚠  Bare ${day.docs.length} dokument(er) — mål ≥ ${DAY_MIN_DOCS} små flis å utforske.`)
  }
}

if (CASE.angelaFiles && CASE.angelaFiles.length) {
  reportDocs('Offerets filer:', CASE.angelaFiles)
}

// Sosiale innlegg — bør være korte.
line('\nSosiale innlegg (bør være korte):')
for (const p of CASE.instagram) {
  const w = wordCount(p.caption)
  if (w > IG_WARN) {
    warns++
    line(`  ⚠  Instagram @${p.author}: ${w} ord (> ${IG_WARN})`)
  } else {
    line(`  ✓  Instagram @${p.author}: ${w} ord`)
  }
}
for (const p of CASE.linkedin) {
  const w = wordCount(p.text)
  if (w > LI_WARN) {
    warns++
    line(`  ⚠  LinkedIn ${p.author}: ${w} ord (> ${LI_WARN})`)
  } else {
    line(`  ✓  LinkedIn ${p.author}: ${w} ord`)
  }
}

// --- Oppsummering -----------------------------------------------------------
line('\n──────────────────────────────────────────────────────────────')
line(` Resultat:  ${fails} for lange (✗)   ${warns} advarsler (⚠)`)
line('──────────────────────────────────────────────────────────────')

if (fails > 0) {
  line('✗ Noen dokumenter er for lange. Del dem opp i flere små flis.')
  process.exit(1)
}
if (strict && warns > 0) {
  line('⚠ --strict: advarsler regnes som feil.')
  process.exit(1)
}
line('✓ Alt innenfor budsjettet. Godt utforsket!')
