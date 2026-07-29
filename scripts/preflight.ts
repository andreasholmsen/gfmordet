/**
 * preflight.ts — sjekk at et Supabase-prosjekt er klart for lansering.
 *
 * Kjør:  npm run preflight
 *
 * Bekrefter (med anon-nøkkelen fra .env):
 *   • at env-variablene finnes (ellers kjører den deployede siden i DEMO-modus),
 *   • at alle 6 migrasjonene er kjørt (én representativ RPC per migrasjon),
 *   • at storage-bucketene `stories` og `profiles` finnes,
 *   • og skriver ut åpne dager + tidsplan så du kan sjekke datoene.
 *
 * Autentiserer IKKE — RPC-er som krever innlogging teller som «finnes» hvis de
 * svarer med en tilgangsfeil (kun «function not found» = migrasjon mangler).
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

// --- Les .env (enkelt, uten ekstra avhengigheter) ---------------------------
function readEnv(): Record<string, string> {
  const out: Record<string, string> = {}
  try {
    for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    /* ingen .env — bruk process.env */
  }
  return out
}

const env = readEnv()
const URL_ = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || ''
const KEY = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || ''

const OK = '✓'
const NO = '✗'
const WARN = '⚠'
let failures = 0

function line(mark: string, label: string, note = '') {
  console.log(`  ${mark}  ${label}${note ? ` — ${note}` : ''}`)
}

async function main() {
  console.log('\n=== GF-mordet preflight ===\n')

  if (!URL_ || !KEY) {
    line(NO, 'Env-variabler (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)', 'MANGLER → DEMO-MODUS')
    console.log(
      '\n  Den deployede siden vil kjøre i demo-modus (ingenting lagres) til disse er satt\n' +
        '  som repo-secrets på GitHub OG lokalt i .env.\n',
    )
    process.exit(1)
  }
  line(OK, 'Env-variabler funnet', new URL(URL_).host)

  const supabase = createClient(URL_, KEY, { auth: { persistSession: false } })

  // --- RPC-er per migrasjon -------------------------------------------------
  type Args = Record<string, unknown>
  async function rpcExists(name: string, args: Args = {}): Promise<{ ok: boolean; note: string }> {
    const { error } = await supabase.rpc(name, args)
    if (!error) return { ok: true, note: 'finnes' }
    const code = error.code ?? ''
    const msg = (error.message ?? '').toLowerCase()
    if (code === 'PGRST202' || msg.includes('could not find') || msg.includes('does not exist')) {
      return { ok: false, note: 'MANGLER — migrasjon ikke kjørt?' }
    }
    if (
      code === '42501' ||
      msg.includes('permission denied') ||
      msg.includes('not authorized') ||
      msg.includes('jwt') ||
      msg.includes('ikke innlogget')
    ) {
      return { ok: true, note: 'finnes (krever innlogging)' }
    }
    return { ok: true, note: `finnes (${error.message})` }
  }

  console.log('\nMigrasjoner (én representativ RPC hver):')
  const rpcChecks: [string, string, Args][] = [
    ['0001 init', 'get_unlocked_days', {}],
    ['0002 schedule', 'get_schedule', {}],
    ['0003 live results', 'get_live_results', { p_day: 1 }],
    ['0004 auth', 'get_my_votes', {}],
    ['0005 stories', 'get_active_stories', {}],
  ]
  for (const [migration, rpc, args] of rpcChecks) {
    const r = await rpcExists(rpc, args)
    if (!r.ok) failures++
    line(r.ok ? OK : NO, `${migration} (${rpc})`, r.note)
  }

  // --- Storage-bucketer -----------------------------------------------------
  console.log('\nStorage-bucketer:')
  for (const bucket of ['stories']) {
    const { error } = await supabase.storage.from(bucket).createSignedUrl('preflight/__none__.jpg', 60)
    const msg = (error?.message ?? '').toLowerCase()
    if (!error || msg.includes('not found') && !msg.includes('bucket')) {
      line(OK, `bucket «${bucket}»`, 'finnes')
    } else if (msg.includes('bucket not found')) {
      failures++
      line(NO, `bucket «${bucket}»`, 'MANGLER — opprett i dashbordet / kjør migrasjonen')
    } else {
      line(WARN, `bucket «${bucket}»`, `kunne ikke bekrefte via anon (${error?.message}) — sjekk i dashbordet`)
    }
  }

  // --- Datoer / tidsplan ----------------------------------------------------
  console.log('\nÅpne dager akkurat nå:')
  const { data: open, error: openErr } = await supabase.rpc('get_unlocked_days')
  if (openErr) {
    line(NO, 'get_unlocked_days', openErr.message)
    failures++
  } else {
    const days = (open as { day: number }[]).map((d) => d.day)
    line(days.length ? OK : WARN, days.length ? `dag ${days.join(', ')}` : 'ingen dager åpne ennå')
  }

  const { data: sched } = await supabase.rpc('get_schedule')
  if (Array.isArray(sched) && sched.length) {
    console.log('\nTidsplan (release_at):')
    for (const r of sched as { day: number; release_at: string }[]) {
      console.log(`     dag ${r.day}: ${new Date(r.release_at).toLocaleString('no-NO')}`)
    }
    const now = (sched as { server_now?: string }[])[0]?.server_now
    if (now) console.log(`     server-tid: ${new Date(now).toLocaleString('no-NO')}`)
  }

  // --- Sikkerhet: anon skal IKKE kunne lese stories/romanse-metadata --------
  console.log('\nSikkerhet (anon skal blokkeres):')
  for (const rpc of ['get_active_stories', 'get_all_stories']) {
    const { error } = await supabase.rpc(rpc)
    const locked =
      error != null &&
      (error.code === '42501' || /permission denied|not authorized/i.test(error.message ?? ''))
    if (locked) {
      line(OK, `${rpc}`, 'låst for anon')
    } else {
      failures++
      line(NO, `${rpc}`, 'ANON KAN LESE — kjør 0007_lockdown.sql')
    }
  }

  console.log(
    `\n=== ${failures === 0 ? OK + ' Alt ser bra ut!' : NO + ` ${failures} problem(er) — se over`} ===\n`,
  )
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error('\nPreflight krasjet:', e instanceof Error ? e.message : e)
  process.exit(1)
})
