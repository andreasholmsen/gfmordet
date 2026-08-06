// Genererer src/case/players.ts fra en navneliste, slik at gjestelisten ligger
// som hasher og ikke i klartekst i den offentlige bundelen.
//
//   1) Kjør i Supabase SQL-editoren:
//        select raw_user_meta_data->>'username', raw_user_meta_data->>'full_name'
//        from auth.users order by created_at;
//   2) Lagre resultatet som players.txt (ett navn per linje, eller
//      «brukernavn,fullt navn» — alle feltene på en linje blir egne oppføringer).
//   3) npm run hash:players            (eller: npm run hash:players -- min-fil.txt)
//
// players.txt er git-ignorert — den inneholder ekte navn og skal aldri commites.
import { readFileSync, writeFileSync } from 'node:fs'
import { normalizeName, hashName } from '../src/lib/player'

// ponytail: normaliseringen er det eneste her som kan brekke innloggingen for
// alle samtidig (generator og runtime må være enige). Derfor denne selvtesten
// før vi skriver noe som helst.
const CASES: [string, string][] = [
  ['Andreas Holmsen', 'andreasholmsen'],
  ['  ANDREAS  ', 'andreas'],
  ['Bjørn-Håkon', 'bjornhakon'],
  ['Ræv Æsope', 'raevaesope'],
  ['per.ove_2', 'perove2'],
]
for (const [input, want] of CASES) {
  const got = normalizeName(input)
  if (got !== want) throw new Error(`normalizeName(${JSON.stringify(input)}) = ${got}, forventet ${want}`)
}

// Kolonnenavnene fra en CSV-eksport ville ellers blitt gyldige innlogginger —
// «username» hadde sluppet deg rett inn. Droppes eksplisitt.
const HEADERS = new Set(['username', 'fullname', 'name', 'displayname', 'email', 'id'])

const file = process.argv[2] ?? 'players.txt'
const names = readFileSync(file, 'utf8')
  .split('\n')
  .flatMap((line) => line.split(/[\t,;|]/))
  .map((s) => s.trim().replace(/^["']|["']$/g, ''))
  .filter((s) => normalizeName(s).length > 0 && !HEADERS.has(normalizeName(s)))

// Både brukernavn og fullt navn havner i lista, så folk kommer inn med det de
// husker. Duplikater faller bort av seg selv i Set-et.
const hashes = [...new Set(await Promise.all(names.map(hashName)))].sort()

writeFileSync(
  'src/case/players.ts',
  `// GENERERT AV scripts/hash-players.ts — IKKE REDIGER FOR HÅND.
// Avkortede SHA-256-digester av navnene til dem som spilte GF-mordet 2026.
// Se src/lib/player.ts for hvorfor de er hashet og hva innloggingen faktisk er.
export const PLAYER_HASHES = new Set([
${hashes.map((h) => `  '${h}',`).join('\n')}
])
`,
)

// Skriv ut hva som faktisk ble godtatt: eneste måten å oppdage at en rar linje
// (kolonnenavn, en overskrift, «null») har blitt en gyldig innlogging.
console.log(names.map((n) => `  ${n}  →  ${normalizeName(n)}`).join('\n'))
console.log(`\n${names.length} navn fra ${file} → ${hashes.length} unike hasher i src/case/players.ts`)
console.log('Se over lista over: alt som står der kan logge inn.')
