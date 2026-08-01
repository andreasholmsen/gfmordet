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

/** Larry-flagget: noterer at spilleren sa ja til «hjelp» (se 0009_larry.sql).
 *  Idempotent server-side — gjentatte kall endrer ingenting. Demo-modus og
 *  manglende migrasjon svelges bevisst: spøken skal aldri kunne krasje appen. */
export async function flagCheater(): Promise<void> {
  if (!supabase) return // demo-modus: ingen lagring
  const { error } = await supabase.rpc('flag_cheater')
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

/** LIVE anonymiserte fritekst-svar — UTEN tidslås (get_live_free_text, se
 *  0010_live_free_text.sql). Brukes KUN av Excel-appen i dev-modus, så eieren
 *  kan følge dag 2-teoriene underveis. Tomt i demo-modus eller uten migrasjonen. */
export async function getLiveFreeText(day: number): Promise<string[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('get_live_free_text', { p_day: day })
  if (error) {
    console.warn('get_live_free_text (kjør 0010_live_free_text.sql?)', error.message)
    return []
  }
  return (data as { free_text: string }[]).map((r) => r.free_text).filter(Boolean)
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

// ---------------------------------------------------------------------------
//  Instagram-stories (spiller-opplastede bilder) — se 0005_stories.sql.
//  Bildene ligger i en PRIVAT bucket; vi henter metadata via RPC og lager
//  korte signerte URL-er for visning. Bilder komprimeres på enheten før
//  opplasting (se lib/image.ts). Alt er no-op/tomt i demo-modus.
// ---------------------------------------------------------------------------
const STORY_BUCKET = 'stories'
const SIGNED_URL_TTL = 3600 // sekunder — holder en visnings-økt

export interface Story {
  id: string
  url: string
  author: string
  createdAt: number // ms siden epoch
  path: string
  mine: boolean
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'xxxxxxxxxxxx4xxxyxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

interface StoryRow {
  id: string
  image_path: string
  created_at: string
  author_name: string
  mine: boolean
}

/** Slå opp signerte URL-er for rader og bygg Story-lista (dropper de som feiler). */
async function toStories(rows: StoryRow[]): Promise<Story[]> {
  if (!supabase || rows.length === 0) return []
  const paths = rows.map((r) => r.image_path)
  const { data, error } = await supabase.storage.from(STORY_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL)
  if (error || !data) {
    console.error('createSignedUrls', error)
    return []
  }
  const urlByPath = new Map(data.map((d) => [d.path, d.signedUrl]))
  const stories: Story[] = []
  for (const r of rows) {
    const url = urlByPath.get(r.image_path)
    if (!url) continue
    stories.push({
      id: r.id,
      url,
      author: r.author_name,
      createdAt: new Date(r.created_at).getTime(),
      path: r.image_path,
      mine: r.mine,
    })
  }
  return stories
}

/** Last opp et bilde som story. Komprimeres på enheten. Kaster med norsk
 *  melding ved feil (f.eks. cooldown). Rydder opp opplastet fil hvis RPC-en
 *  avviser (så vi ikke etterlater foreldreløse objekter i bucketen). */
export async function uploadStory(file: Blob): Promise<void> {
  if (!supabase) return
  const { compressImage } = await import('./image')
  const blob = await compressImage(file)

  const { data: sess } = await supabase.auth.getSession()
  const uid = sess.session?.user.id
  if (!uid) throw new Error('Du må være innlogget for å legge ut en story.')

  const path = `${uid}/${randomId()}.jpg`
  const up = await supabase.storage.from(STORY_BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  })
  if (up.error) throw new Error('Kunne ikke laste opp bildet. Prøv igjen.')

  const { error } = await supabase.rpc('add_story', { p_image_path: path })
  if (error) {
    // Rydd opp den nettopp opplastede fila før vi rapporterer feilen.
    await supabase.storage.from(STORY_BUCKET).remove([path]).catch(() => {})
    throw new Error(error.message)
  }
}

/** Aktive stories (siste 24t) med signerte URL-er. Tomt i demo-modus. */
export async function getActiveStories(): Promise<Story[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('get_active_stories')
  if (error) {
    console.warn('get_active_stories (kjør 0005_stories.sql?)', error.message)
    return []
  }
  return toStories(data as StoryRow[])
}

/** Alle stories (minnealbum) — tomt før spillet er over (håndhevet server-side). */
export async function getAllStories(): Promise<Story[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('get_all_stories')
  if (error) {
    console.warn('get_all_stories (kjør 0005_stories.sql?)', error.message)
    return []
  }
  return toStories(data as StoryRow[])
}

/** Tidspunktet (ms) da JEG sist la ut en story — for cooldown-nedtelling. */
export async function getMyLastStoryAt(): Promise<number | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('get_my_last_story_at')
  if (error || !data) return null
  return new Date(data as string).getTime()
}

/** Slett en egen story (både metadata-raden og selve fila). */
export async function deleteMyStory(id: string, path: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.rpc('delete_my_story', { p_id: id })
  if (error) throw new Error(error.message)
  await supabase.storage.from(STORY_BUCKET).remove([path]).catch(() => {})
}

/** Cooldown mellom stories (ms) — må matche `interval '4 hours'` i 0005. */
export const STORY_COOLDOWN_MS = 4 * 60 * 60 * 1000

// ---------------------------------------------------------------------------
//  Larry-veggen (0009): hvem som takket ja til Larrys «hjelp» (flag_cheater).
//  Vises i Excel-appens ark «Larry 👽».
// ---------------------------------------------------------------------------

export interface LarryRow {
  name: string
  at: string // ISO-tidspunkt (første gang de sa ja)
}

/** Hele Larry-veggen (navn + tidspunkt), eldst først. */
export async function getCheatFlags(): Promise<LarryRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('get_cheat_flags')
  if (error || !data) {
    if (error) console.warn('get_cheat_flags (kjør 0009_larry.sql?)', error.message)
    return []
  }
  return (data as { player_name: string; created_at: string }[]).map((r) => ({
    name: r.player_name,
    at: r.created_at,
  }))
}
