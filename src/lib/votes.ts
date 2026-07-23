// «Min stemme» per dag for den innloggede spilleren.
//
// Autoritativ kilde er Supabase (knyttet til auth.uid()), men komponentene
// (ResultsView/KillerReveal/VoteForm) leser den SYNKRONT ved render. Vi holder
// derfor en in-memory cache som hydreres én gang ved innlogging via
// `hydrateMyVotes()` (kalt fra AuthContext), med et localStorage-speil som
// rask fallback ved refresh før hydreringen er ferdig.

import { getMyVotes } from './supabase'

const KEY = 'gf-mordet.votes.v1'

export interface MyVote {
  choice: string | null
  freeText: string | null
}

type Store = Record<string, MyVote>

// In-memory sannhet for gjeldende økt. Speiles til localStorage.
let memory: Store = loadFromStorage()

function loadFromStorage(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Store
  } catch {
    return {}
  }
}

function persist(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(memory))
  } catch {
    /* ignorer */
  }
}

/** Hent brukerens egne stemmer fra serveren og fyll cachen. Kalles ved
 *  innlogging. Overskriver localStorage-speilet med serverens fasit. */
export async function hydrateMyVotes(): Promise<void> {
  const rows = await getMyVotes()
  const next: Store = {}
  for (const r of rows) next[String(r.day)] = { choice: r.choice, freeText: r.freeText }
  memory = next
  persist()
}

/** Tøm cachen (ved utlogging) så neste bruker ikke arver forrige stemmer. */
export function clearMyVotes(): void {
  memory = {}
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignorer */
  }
}

export function getMyVote(day: number): MyVote | null {
  return memory[String(day)] ?? null
}

export function saveMyVote(day: number, vote: MyVote): void {
  memory[String(day)] = vote
  persist()
}
