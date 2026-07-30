// Sanity-sjekk for adgangskontroll-sporet: dørloggen (dag 1) og romfordelingen
// (Angelas filer) er 72 håndskrevne rader som bare betyr noe sammen. Denne
// fanger opp at de har glidd fra hverandre. Kjør: npm run check:dorlogg
import { CASE } from '../src/case/manifest'

const log = CASE.days[0].docs.find((d) => d.id === 'd1-dorlogg')!.inline!
const rooms = CASE.angelaFiles!.find((d) => d.id === 'a-romfordeling')!.inline!

let failed = false
function check(ok: boolean, msg: string): void {
  if (!ok) failed = true
  console.log(`  ${ok ? 'ok  ' : 'FEIL'} ${msg}`)
}

const rows = [...log.matchAll(/^\| (\d{3}) \| (\d\d:\d\d) \|$/gm)].map((m) => ({
  dor: m[1],
  tid: m[2],
}))
console.log(`Dørlogg: ${rows.length} kortåpninger`)

// Loggen skal BARE inneholde kortåpninger. Dørstatus/varsler/avviste avlesinger
// ville gjort rom 327 (Sverre) til den eneste raden som skiller seg ut.
const ekstra = [...log.matchAll(/^\| \d{3} \| \d\d:\d\d \| (.+?) \|$/gm)].map((m) => m[1])
check(ekstra.length === 0, `bare kortåpninger${ekstra.length ? `: fant «${ekstra.join('», «')}»` : ''}`)

// Fottellingen i utskriften må stemme med tabellen over den.
const dorer = new Set(rows.map((r) => r.dor))
for (const [label, want] of [
  ['Antall kortåpninger', rows.length],
  ['Antall dører med aktivitet', dorer.size],
] as const) {
  const got = Number(new RegExp(`${label}: (\\d+)`).exec(log)![1])
  check(got === want, `${label}: fot=${got} tabell=${want}`)
}

// Loggen går 18:00 -> 04:00, så timer < 12 tilhører dagen etter.
const mins = rows.map((r) => {
  const [h, m] = r.tid.split(':').map(Number)
  return (h < 12 ? h + 24 : h) * 60 + m
})
const usortert = mins
  .map((v, i) => (i && v < mins[i - 1] ? `${rows[i - 1].tid} -> ${rows[i].tid}` : null))
  .filter(Boolean)
check(usortert.length === 0, `kronologisk${usortert.length ? `: ${usortert.join(', ')}` : ''}`)

// Et romnummer i loggen som ikke finnes i romfordelingen er et blindspor.
const listet = new Set([...rooms.matchAll(/^\| (\d{3}) \|/gm)].map((m) => m[1]))
const uten = [...dorer].filter((d) => !listet.has(d))
const stille = [...listet].filter((d) => !dorer.has(d))
check(uten.length === 0, `alle dører har rom${uten.length ? `: mangler ${uten}` : ''}`)
check(stille.length === 0, `alle rom har aktivitet${stille.length ? `: stille ${stille}` : ''}`)

// Alle mistenkte + offeret må ha et rom, ellers kan de ikke plasseres i loggen.
const navn = rooms.toLowerCase()
const glemt = [...CASE.suspects!.map((s) => s.name), 'Angela'].filter(
  (n) => !navn.includes(n.toLowerCase()),
)
check(glemt.length === 0, `alle mistenkte + offeret har rom${glemt.length ? `: ${glemt}` : ''}`)

if (failed) process.exit(1)
