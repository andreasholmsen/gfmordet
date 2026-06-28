import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Hvis miljøvariablene mangler kjører appen i "demo-modus" (ingen backend):
// alle dager er åpne lokalt og stemmer lagres ikke. Nyttig for utvikling av UI.
export const hasSupabase = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(url, anonKey, { auth: { persistSession: false } })
  : null

// ---------------------------------------------------------------------------
//  RPC-wrappere — all tidslogikk håndheves server-side (se 0001_init.sql).
// ---------------------------------------------------------------------------

export interface ResultRow {
  choice: string
  n: number
}

export interface Schedule {
  /** release-tidspunkt (ms siden epoch) per dag */
  releaseAt: Record<number, number>
  /** serverens nå-tid minus klientens nå-tid (ms) — korrigerer for feil telefonklokke */
  offsetMs: number
}

/** Tidsplan for nedtelling. Null i demo-modus eller hvis RPC-en ikke finnes
 *  ennå (da skjuler oppgavelinjen bare nedtellingen — ingen feil). */
export async function getSchedule(): Promise<Schedule | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('get_schedule')
  if (error || !data || (data as unknown[]).length === 0) {
    if (error) console.warn('get_schedule (kjør 0002_schedule.sql?)', error.message)
    return null
  }
  const rows = data as { day: number; release_at: string; server_now: string }[]
  const releaseAt: Record<number, number> = {}
  for (const r of rows) releaseAt[r.day] = new Date(r.release_at).getTime()
  const offsetMs = new Date(rows[0].server_now).getTime() - Date.now()
  return { releaseAt, offsetMs }
}

/** Hvilke dager er åpne akkurat nå (serveren bestemmer ut fra now()). */
export async function getUnlockedDays(): Promise<number[]> {
  if (!supabase) return [1, 2, 3, 4] // demo-modus: alt åpent
  const { data, error } = await supabase.rpc('get_unlocked_days')
  if (error) {
    console.error('get_unlocked_days', error)
    return []
  }
  return (data as { day: number }[]).map((r) => r.day)
}

/** Send inn / oppdater stemme. Kaster ved feil (f.eks. utenfor tidsvindu). */
export async function submitVote(args: {
  day: number
  playerId: string
  name: string
  choice: string | null
  freeText: string | null
}): Promise<void> {
  if (!supabase) return // demo-modus: ingen lagring
  const { error } = await supabase.rpc('submit_vote', {
    p_day: args.day,
    p_player_id: args.playerId,
    p_name: args.name,
    p_choice: args.choice,
    p_free_text: args.freeText,
  })
  if (error) throw new Error(error.message)
}

/** Aggregerte resultater for en dag — tomt før resultatene frigis (results_at). */
export async function getResults(day: number): Promise<ResultRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('get_results', { p_day: day })
  if (error) {
    console.error('get_results', error)
    return []
  }
  return (data as { choice: string; n: number }[]).map((r) => ({
    choice: r.choice,
    n: Number(r.n),
  }))
}

/** Anonymiserte fritekst-svar for en dag (uten navn) — tomt før results_at. */
export async function getFreeText(day: number): Promise<string[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('get_free_text', { p_day: day })
  if (error) {
    console.error('get_free_text', error)
    return []
  }
  return (data as { free_text: string }[]).map((r) => r.free_text).filter(Boolean)
}
