// ---------------------------------------------------------------------------
//  Innlogging = en GARDIN, ikke en lås.
//
//  Siden ligger statisk på GitHub Pages, så alt i /case og hele manifestet i
//  JS-bundelen er hentbart direkte av den som kjenner URL-en. En klient-side
//  innlogging kan derfor aldri gjøre saken *hemmelig* — den holder tilfeldige
//  besøkende (og Google, se noindex i index.html) ute, ikke en som vil inn.
//
//  Derfor: ingen passord. Spørsmålet er bare «var du med?». Navnene ligger som
//  avkortede SHA-256-digester i src/case/players.ts, ikke i klartekst — ~100
//  virkelige navn lesbart i en offentlig bundel ville vært akkurat den
//  personvern-lekkasjen innloggingen skal hindre.
// ---------------------------------------------------------------------------
import { PLAYER_HASHES } from '../case/players'

const KEY = 'gfm:player'

/** Navnet skal være ufølsomt for store/små bokstaver, mellomrom, bindestreker
 *  og norske tegn — «Bjørn Håkon», «bjorn hakon» og «BJØRN-HÅKON» er samme
 *  person. ø/æ mangler NFD-dekomponering og må mappes eksplisitt; å/é/ü m.fl.
 *  faller ut av seg selv når kombinasjonstegnene strippes.
 *  MÅ holdes identisk med generatoren (scripts/hash-players.ts importerer
 *  denne) — endrer du den, må players.ts genereres på nytt. */
export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/ø/g, 'o')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[^a-z0-9]/g, '')
}

/** Avkortet SHA-256 av det normaliserte navnet. 12 hex-tegn (48 bit) er rikelig
 *  mot kollisjoner for ~100 navn, og holder players.ts kort. */
export async function hashName(s: string): Promise<string> {
  const bytes = new TextEncoder().encode(normalizeName(s))
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 12)
}

/** Var dette navnet med på GF-mordet 2026? */
export async function isPlayer(name: string): Promise<boolean> {
  if (!normalizeName(name)) return false
  return PLAYER_HASHES.has(await hashName(name))
}

/** Navnet spilleren logget inn med, eller null. Synkron — App leser den før
 *  første render. Vi validerer bevisst ikke på nytt: det er en gardin, og
 *  hashingen er async. */
export function getPlayer(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null // privat modus e.l.
  }
}

export function setPlayer(name: string): void {
  try {
    localStorage.setItem(KEY, name)
  } catch {
    /* privat modus: innlogging varer da bare denne økten */
  }
}

export function clearPlayer(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignorer */
  }
}
