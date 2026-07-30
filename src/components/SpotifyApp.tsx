import { useEffect, useRef, useState } from 'react'
import { CASE, type SpotifyTrack } from '../case/manifest'
import { assetUrl } from '../lib/assets'
import AppWindow from './AppWindow'

// «Radio France»: radiokanal, ikke musikkspiller. Hver åpning slår på radioen
// midt i sendeplanen (tilfeldig sang), deretter spilles lista videre i loop.
// Radio kan ikke hoppes i — eneste knapp er pause/på.

// Geometriske tegn (U+25B6/U+25AE) — ikke «⏸» (U+23F8), som Windows/iOS tegner
// som farge-emoji og dermed ikke matcher play-trekanten.
const PLAY = '▶'
const PAUSE = '▮▮'

function prettyTitle(t: SpotifyTrack): string {
  if (t.title) return t.title
  const base = t.src.split('/').pop() ?? t.src
  return base.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
}

export default function SpotifyApp() {
  const tracks = CASE.spotify ?? []
  const audioRef = useRef<HTMLAudioElement>(null)

  // Tilfeldig startsang per åpning; deretter sekvensielt med wrap (loop).
  const [idx, setIdx] = useState(() =>
    tracks.length ? Math.floor(Math.random() * tracks.length) : 0,
  )
  const [playing, setPlaying] = useState(true) // forsøk autoplay ved åpning
  const [error, setError] = useState(false)

  // Hemmelig overstyring: hold pause-knappen i 5 sek → sendestyring-meny
  // der man kan velge sang fritt. Ingen visuell hint — den skal være hemmelig.
  const [override, setOverride] = useState(false)
  const holdTimer = useRef<number | null>(null)
  const holdFired = useRef(false) // svelg klikket som følger etter et langt trykk

  function stopHold() {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
  }
  function startHold() {
    stopHold()
    holdFired.current = false
    holdTimer.current = window.setTimeout(() => {
      holdFired.current = true
      setOverride(true)
    }, 5000)
  }
  useEffect(() => stopHold, [])

  const track = tracks[idx]
  const live = playing && !error

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    if (playing) a.play().catch(() => setPlaying(false))
    else a.pause()
  }, [playing, idx])

  if (tracks.length === 0 || !track) {
    return (
      <AppWindow title="Radio France" icon="📻" variant="spotify">
        <div className="sp">
          <p className="notice">Ingen sanger ennå. Legg .mp3-filer i public/case/spotify/.</p>
        </div>
      </AppWindow>
    )
  }

  return (
    <AppWindow title="Radio France" icon="📻" variant="spotify">
      <div className="sp">
        <div className="sp__station">
          <span className={`sp__live ${live ? 'sp__live--on' : ''}`} aria-hidden>
            ●
          </span>
          {live ? 'DIREKTE' : 'PAUSE'} · RADIO FRANCE · 98,8 MHz
        </div>

        <div className="sp__art" aria-hidden>
          📻
        </div>

        <div className="sp__meta">
          <div className="sp__title">{error ? 'Sendingen falt ut' : prettyTitle(track)}</div>
          <div className="sp__artist">{error ? track.src : (track.artist ?? 'Ukjent artist')}</div>
        </div>

        <div className={`sp__eq ${live ? 'sp__eq--on' : ''}`} aria-hidden>
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="sp__controls">
          <button
            className="sp__btn sp__btn--play"
            onPointerDown={startHold}
            onPointerUp={stopHold}
            onPointerLeave={stopHold}
            onPointerCancel={stopHold}
            onContextMenu={(e) => e.preventDefault()} // mobil: langtrykk skal ikke åpne meny
            onClick={() => {
              if (holdFired.current) {
                holdFired.current = false // langtrykket åpnet menyen — ikke pause i tillegg
                return
              }
              setPlaying((p) => !p)
            }}
            aria-label={playing ? 'Pause' : 'Spill'}
          >
            {playing ? PAUSE : PLAY}
          </button>
        </div>

        {override && (
          <div className="sp-override" role="dialog" aria-label="Sendestyring">
            <div className="sp-override__head">⚙ SENDESTYRING · RF INTERN</div>
            <p className="sp-override__note">
              Overstyring aktiv. Uautorisert bruk logges (ikke egentlig).
            </p>
            <div className="sp-override__list">
              {tracks.map((t, i) => (
                <button
                  key={t.src}
                  className={`sp-override__row ${i === idx ? 'sp-override__row--cur' : ''}`}
                  onClick={() => {
                    setError(false)
                    setIdx(i)
                    setPlaying(true)
                  }}
                >
                  <span className="sp-override__cue" aria-hidden>
                    {i === idx ? (live ? PLAY : PAUSE) : String(i + 1).padStart(2, '0')}
                  </span>
                  {prettyTitle(t)}
                  {t.artist && <span className="sp-override__artist"> — {t.artist}</span>}
                </button>
              ))}
            </div>
            <button className="sp-override__close" onClick={() => setOverride(false)}>
              Lukk overstyring
            </button>
          </div>
        )}

        <audio
          ref={audioRef}
          src={assetUrl(track.src)}
          onEnded={() => {
            setError(false)
            setIdx((i) => (i + 1) % tracks.length) // lista looper — radioen slutter aldri
            setPlaying(true)
          }}
          onError={() => {
            setError(true)
            setPlaying(false)
          }}
        />
      </div>
    </AppWindow>
  )
}
