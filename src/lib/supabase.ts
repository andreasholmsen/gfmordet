import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Hvis miljøvariablene mangler kjører appen i "demo-modus" (ingen backend):
// alle dager er åpne lokalt og stemmer lagres ikke. Nyttig for utvikling av UI.
export const hasSupabase = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(url, anonKey, {
      auth: {
        // Innlogging: JWT lagres i localStorage og fornyes automatisk, så
        // spilleren forblir innlogget mellom besøk. detectSessionInUrl er av
        // fordi vi kun bruker passord-auth (ingen redirect/magic link) — trygt
        // med HashRouter på GitHub Pages.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null

// ---------------------------------------------------------------------------
//  Innlogging (brukernavn + passord).
//
//  Supabase Auth er e-post-basert, men vi vil KUN eksponere brukernavn utad.
//  Vi lager derfor en deterministisk, syntetisk e-post av brukernavnet og
//  bruker den som Auth-identifikator. Passordet håndteres/hashes av Supabase.
//  «Confirm email» må være AV i dashboardet (ingen e-post sendes til .local).
// ---------------------------------------------------------------------------

/** Domenet for de syntetiske e-postene. Adressen er ikke hemmelig og mottar
 *  aldri e-post — den er bare en unik nøkkel utledet av brukernavnet. */
const AUTH_EMAIL_DOMAIN = 'gfmordet.local'

/** Normaliser brukernavn → stabil nøkkel. Brukernavn er dermed ufølsomt for
 *  store/små bokstaver og mellomrom («Per Ove» og «per ove» = samme konto). */
export function normalizeUsername(username: string): string {
  return username
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '')
}

function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@${AUTH_EMAIL_DOMAIN}`
}

/** Oversett Supabase-auth-feil til norske, spillervennlige meldinger. */
function norskAuthFeil(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Feil brukernavn eller passord.'
  if (m.includes('already registered') || m.includes('already exists'))
    return 'Brukernavnet er opptatt. Velg et annet.'
  if (m.includes('password')) return 'Passordet må ha minst 6 tegn.'
  if (m.includes('rate limit') || m.includes('too many'))
    return 'For mange forsøk. Vent litt og prøv igjen.'
  return 'Noe gikk galt. Prøv igjen.'
}

/** Registrer ny bruker. Fullt navn lagres i user_metadata (full_name) og brukes
 *  som visningsnavn + navn på stemmer (server-side). Kaster ved feil. */
export async function signUpWithUsername(
  username: string,
  password: string,
  fullName: string,
): Promise<void> {
  if (!supabase) return // demo-modus: AuthContext later som man er innlogget
  const name = fullName.trim()
  const { error } = await supabase.auth.signUp({
    email: usernameToEmail(username),
    password,
    options: {
      data: {
        username: normalizeUsername(username),
        full_name: name,
        display_name: name,
      },
    },
  })
  if (error) throw new Error(norskAuthFeil(error.message))
}

/** Logg inn med brukernavn + passord. Kaster med norsk melding ved feil. */
export async function signInWithUsername(username: string, password: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  })
  if (error) throw new Error(norskAuthFeil(error.message))
}

export async function signOut(): Promise<void> {
  if (!supabase) return
  await supabase.auth.signOut()
}

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

/** Send inn / oppdater stemme. Identitet + navn hentes server-side fra den
 *  innloggede brukeren (auth.uid()/JWT), så klienten sender kun svaret.
 *  Kaster ved feil (f.eks. utenfor tidsvindu eller ikke innlogget). */
export async function submitVote(args: {
  day: number
  choice: string | null
  freeText: string | null
}): Promise<void> {
  if (!supabase) return // demo-modus: ingen lagring
  const { error } = await supabase.rpc('submit_vote', {
    p_day: args.day,
    p_choice: args.choice,
    p_free_text: args.freeText,
  })
  if (error) throw new Error(error.message)
}

export interface MyVoteRow {
  day: number
  choice: string | null
  freeText: string | null
}

/** Den innloggede brukerens egne stemmer (alle dager). Tomt i demo-modus. */
export async function getMyVotes(): Promise<MyVoteRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('get_my_votes')
  if (error) {
    console.error('get_my_votes', error)
    return []
  }
  return (data as { day: number; choice: string | null; free_text: string | null }[]).map((r) => ({
    day: r.day,
    choice: r.choice,
    freeText: r.free_text,
  }))
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

/** LIVE aggregerte resultater for en dag — UTEN tidslås (via get_live_results,
 *  se 0003_live_results.sql). Kun antall per valg, aldri navn. Tomt i demo-modus
 *  eller hvis RPC-en ikke er kjørt ennå (da faller RESULTATER-appen til demo-data). */
export async function getLiveResults(day: number): Promise<ResultRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('get_live_results', { p_day: day })
  if (error) {
    console.warn('get_live_results (kjør 0003_live_results.sql?)', error.message)
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
