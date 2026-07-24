import { useEffect, useRef, useState } from 'react'
import { CASE, type SpotifyTrack } from '../case/manifest'
import { assetUrl } from '../lib/assets'
import AppWindow from './AppWindow'

// Enkel musikkspiller: velger tilfeldig sang, og lar deg pause, hoppe fram
// (ny tilfeldig) og tilbake (forrige spilte). Ikke noe fancy.

function prettyTitle(t: SpotifyTrack): string {
  if (t.title) return t.title
  const base = t.src.split('/').pop() ?? t.src
  return base.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
}

function randomOther(exclude: number, count: number): number {
  if (count <= 1) return 0
  let n = exclude
  while (n === exclude) n = Math.floor(Math.random() * count)
  return n
}

export default function SpotifyApp() {
  const tracks = CASE.spotify ?? []
  const audioRef = useRef<HTMLAudioElement>(null)

  // Spillehistorikk: hist[pos] = indeks til sangen som spilles nå.
  const [hist, setHist] = useState<number[]>(() =>
    tracks.length ? [Math.floor(Math.random() * tracks.length)] : [],
  )
  const [pos, setPos] = useState(0)
  const [playing, setPlaying] = useState(true) // forsøk autoplay ved åpning
  const [error, setError] = useState(false)
  const [progress, setProgress] = useState({ cur: 0, dur: 0 })

  const currentIdx = hist[pos] ?? 0
  const track = tracks[currentIdx]

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    if (playing) a.play().catch(() => setPlaying(false))
    else a.pause()
  }, [playing, currentIdx])

  function next() {
    if (tracks.length === 0) return
    setError(false)
    if (pos < hist.length - 1) {
      setPos(pos + 1) // vi hadde gått tilbake — gå framover i historikken
    } else {
      setHist([...hist, randomOther(currentIdx, tracks.length)])
      setPos(pos + 1)
    }
    setPlaying(true)
  }

  function prev() {
    setError(false)
    if (pos > 0) setPos(pos - 1)
    else if (audioRef.current) audioRef.current.currentTime = 0
    setPlaying(true)
  }

  if (tracks.length === 0 || !track) {
    return (
      <AppWindow title="Spotify" icon="🎵" variant="spotify">
        <div className="sp">
          <p className="notice">Ingen sanger ennå. Legg .mp3-filer i public/case/spotify/.</p>
        </div>
      </AppWindow>
    )
  }

  const pct = progress.dur > 0 ? (progress.cur / progress.dur) * 100 : 0

  return (
    <AppWindow title="Spotify" icon="🎵" variant="spotify">
      <div className="sp">
        <div className="sp__art" aria-hidden>
          🎵
        </div>

        <div className="sp__meta">
          <div className="sp__title">{error ? 'Kunne ikke spille sporet' : prettyTitle(track)}</div>
          <div className="sp__artist">{error ? track.src : (track.artist ?? 'Ukjent artist')}</div>
        </div>

        <div className="sp__bar">
          <div className="sp__bar-fill" style={{ width: `${pct}%` }} />
        </div>

        <div className="sp__controls">
          <button className="sp__btn" onClick={prev} aria-label="Forrige">
            ⏮
          </button>
          <button
            className="sp__btn sp__btn--play"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Pause' : 'Spill'}
          >
            {playing ? '⏸' : '▶'}
          </button>
          <button className="sp__btn" onClick={next} aria-label="Neste">
            ⏭
          </button>
        </div>

        <audio
          ref={audioRef}
          src={assetUrl(track.src)}
          onEnded={next}
          onError={() => {
            setError(true)
            setPlaying(false)
          }}
          onTimeUpdate={(e) =>
            setProgress({ cur: e.currentTarget.currentTime, dur: e.currentTarget.duration || 0 })
          }
          onLoadedMetadata={(e) =>
            setProgress({ cur: 0, dur: e.currentTarget.duration || 0 })
          }
        />
      </div>
    </AppWindow>
  )
}
