// Lokalt minne om hva DENNE enheten stemte, per dag. Brukes kun til å vise
// «du stemte som X % av etterforskerne» i resultatene — den autoritative
// stemmen ligger i Supabase. Best effort: nullstilles om localStorage tømmes.

const KEY = 'gf-mordet.votes.v1'

export interface MyVote {
  choice: string | null
  freeText: string | null
}

type Store = Record<string, MyVote>

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Store
  } catch {
    return {}
  }
}

export function getMyVote(day: number): MyVote | null {
  const store = load()
  return store[String(day)] ?? null
}

export function saveMyVote(day: number, vote: MyVote): void {
  try {
    const store = load()
    store[String(day)] = vote
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    /* ignorer */
  }
}
