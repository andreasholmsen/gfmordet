import { useEffect, useRef, useState } from 'react'
import { useT } from '../lib/i18n'

// ---------------------------------------------------------------------------
//  GF-mordet 2027 — teaser-forside.
//
//  Alle som åpner siden møtes av en helt sort skjerm med en hvit nedtelling
//  til torsdag 29. juli 2027 kl. 18:00 (Europe/Oslo). Nederst ligger en liten
//  knapp som slipper deg inn i 2026-utgaven (selve spillet).
//
//  JUKSESIKRING: nedtellingen bruker IKKE enhetens klokke. Ved lasting gjøres
//  en HEAD-request mot eget origin (GitHub Pages), og serverens `Date`-header
//  brukes som fasit. Deretter tikker klokka videre med performance.now(), som
//  er monoton og upåvirket av at noen stiller systemklokka. Vi resynker
//  jevnlig og når fanen våkner. Får vi aldri svar (offline/lokal fil) faller
//  vi tilbake til enhetens klokke — bedre enn en evig svart skjerm.
// ---------------------------------------------------------------------------

// 29. juli 2027 kl. 18:00 Europe/Oslo (CEST = UTC+2).
const TARGET_UTC_MS = Date.UTC(2027, 6, 29, 16, 0, 0)

const RESYNC_MS = 5 * 60 * 1000

interface Sync {
  serverMs: number // serverens klokke i det øyeblikket …
  perfMs: number // … performance.now() var dette
  trusted: boolean // false = fallback til enhetens klokke
}

async function fetchServerNow(): Promise<number | null> {
  try {
    // HEAD mot egen forside — billig (ingen kropp), alltid samme origin.
    // GitHub Pages/Fastly setter fersk Date-header per svar selv ved cache-
    // HIT (verifisert 2026-08-04). `cache: 'no-store'` hopper over nettleser-
    // cachen, og den tilfeldige query-parameteren buster evt. mellomliggende
    // proxyer som ellers kunne servert et gammelt svar.
    const buster = Math.random().toString(36).slice(2)
    const res = await fetch(`${window.location.pathname || '/'}?sync=${buster}`, {
      method: 'HEAD',
      cache: 'no-store',
    })
    const header = res.headers.get('date')
    if (!header) return null
    const t = new Date(header).getTime()
    return Number.isFinite(t) ? t : null
  } catch {
    return null
  }
}

function two(n: number): string {
  return String(n).padStart(2, '0')
}

export default function Countdown2027({ onEnter2026 }: { onEnter2026: () => void }) {
  const t = useT()
  const [sync, setSync] = useState<Sync | null>(null)
  const [, forceTick] = useState(0)
  const syncRef = useRef<Sync | null>(null)
  syncRef.current = sync

  // Første synk (med et par nye forsøk), periodisk resynk, og resynk når
  // fanen blir synlig igjen (mobil som våkner fra lomma).
  useEffect(() => {
    let alive = true

    async function doSync(attempt = 0): Promise<void> {
      const serverMs = await fetchServerNow()
      if (!alive) return
      if (serverMs !== null) {
        setSync({ serverMs, perfMs: performance.now(), trusted: true })
      } else if (attempt < 2) {
        window.setTimeout(() => void doSync(attempt + 1), 1500)
      } else if (!syncRef.current) {
        // Alle forsøk feilet og vi har ingen tidligere synk: fall tilbake til
        // enhetens klokke i stedet for å vise en evig tom skjerm.
        setSync({ serverMs: Date.now(), perfMs: performance.now(), trusted: false })
      }
    }

    void doSync()
    const interval = window.setInterval(() => void doSync(), RESYNC_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void doSync()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      alive = false
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  // Tikk 4x/sek så sekundskiftet aldri henger.
  useEffect(() => {
    const id = window.setInterval(() => forceTick((n) => n + 1), 250)
    return () => window.clearInterval(id)
  }, [])

  // Serverkorrigert «nå» — performance.now() er monoton, så systemklokka kan
  // ikke brukes til å spole fremover.
  const nowMs = sync ? sync.serverMs + (performance.now() - sync.perfMs) : null
  const leftMs = nowMs === null ? null : Math.max(0, TARGET_UTC_MS - nowMs)

  const totalSec = leftMs === null ? null : Math.floor(leftMs / 1000)
  const groups =
    totalSec === null
      ? null
      : [
          { value: String(Math.floor(totalSec / 86400)), label: t('cd27Days') },
          { value: two(Math.floor((totalSec % 86400) / 3600)), label: t('cd27Hours') },
          { value: two(Math.floor((totalSec % 3600) / 60)), label: t('cd27Min') },
          { value: two(totalSec % 60), label: t('cd27Sec') },
        ]

  return (
    <div className="cd27">
      <div className="cd27__center">
        {groups === null ? (
          <p className="cd27__syncing">{t('cd27Syncing')}</p>
        ) : (
          <div className="cd27__timer" role="timer" aria-label="Nedtelling">
            {groups.map((g, i) => (
              <span key={g.label} className="cd27__group">
                {i > 0 && (
                  <span className="cd27__colon" aria-hidden>
                    :
                  </span>
                )}
                <span className="cd27__cell">
                  <span className="cd27__digits">{g.value}</span>
                  <span className="cd27__label">{g.label}</span>
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      <button className="cd27__enter" onClick={onEnter2026}>
        {t('cd27Enter')}
      </button>
    </div>
  )
}
