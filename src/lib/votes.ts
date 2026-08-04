// «Min stemme» per dag — nå helt lokal (localStorage). Spillet er over og
// backenden pensjonert; svarene brukes kun til progresjonen (svar på dag N
// låser opp dag N+1, se UnlockContext) og til «du stemte som X %»-visningen
// mot de bakte slutt-tallene i src/case/results.ts.
//
// Komponentene (KillerReveal/VoteForm/PoliceApp) leser synkront ved render,
// så vi holder en in-memory kopi som speiles til localStorage.

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

export function getMyVote(day: number): MyVote | null {
  return memory[String(day)] ?? null
}

export function saveMyVote(day: number, vote: MyVote): void {
  memory[String(day)] = vote
  persist()
}

/** Tøm alle lokale svar (brukes av «Nullstill fremdrift» i Innstillinger). */
export function clearMyVotes(): void {
  memory = {}
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignorer */
  }
}
