import { useEffect, useMemo, useState } from 'react'
import { sfx } from '../lib/sfx'
import { assetUrl } from '../lib/assets'

// «Politi-hack» à la GTA Casino Heist («clone target»): målavtrykket vises til
// høyre, og til venstre ligger samme avtrykk kuttet i horisontale striper som
// er forskjøvet sidelengs (med wrap). Spilleren skyver stripene til alt står
// på linje. TRE avtrykk må klones på 60 sek totalt — klokka løper videre
// mellom avtrykkene. Avtrykkene tegnes prosedyrelt som SVG (seeded), så hver
// runde er unik og ingen bildefiler trengs.
//
// Styring: trykk på venstre/høyre halvdel av en stripe for å skyve den —
// eller piltaster på PC (↑/↓ velger rad, ←/→ skyver).

const ROUND_SECONDS = 60
const RETRY_BONUS = 5 // ekstra sekunder per mislykket forsøk — blir gradvis lettere
const PRINTS = 3
const STRIPS = 8
const POSITIONS = 8 // antall hakk en stripe kan stå i (0 = riktig)
const W = 200
const H = 260
const STEP = W / POSITIONS

// Liten seeded PRNG (mulberry32) så avtrykket er stabilt gjennom runden.
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Tegner et helt fingeravtrykk: konsentriske, ujevne «ringer» (noen med gap)
// rundt et senter, pluss et par arr. Returnerer SVG-path-strenger.
function printPaths(seed: number): string[] {
  const rnd = mulberry32(Math.imul(seed, 2654435761) + 1)
  const paths: string[] = []
  const cx = 100
  const cy = 130

  for (let ring = 0; ring < 13; ring++) {
    const rx = 8 + ring * 8
    const ry = 10 + ring * 10.5
    const dx = (rnd() - 0.5) * 8
    const dy = (rnd() - 0.5) * 8
    // wobble = to sinus-harmonier med tilfeldig fase → organiske ridger
    const amp1 = 1.5 + rnd() * 2
    const amp2 = 1 + rnd() * 1.5
    const ph1 = rnd() * Math.PI * 2
    const ph2 = rnd() * Math.PI * 2
    // noen ringer får et gap (åpne buer) som ekte ridge-avbrudd
    const hasGap = rnd() < 0.55
    const gapAt = rnd() * Math.PI * 2
    const gapLen = 0.3 + rnd() * 0.7

    const pts: string[] = []
    const N = 44
    for (let k = 0; k <= N; k++) {
      const ang = gapAt + gapLen + ((Math.PI * 2 - (hasGap ? gapLen : 0)) * k) / N
      const wob = amp1 * Math.sin(3 * ang + ph1) + amp2 * Math.sin(7 * ang + ph2)
      const x = cx + dx + (rx + wob) * Math.cos(ang)
      const y = cy + dy + (ry + wob) * Math.sin(ang)
      pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`)
    }
    paths.push(`M ${pts[0]} L ${pts.slice(1).join(' L ')}${hasGap ? '' : ' Z'}`)
  }

  // et par «arr» — korte streker på tvers av ridgene
  for (let i = 0; i < 3; i++) {
    const x = 40 + rnd() * 120
    const y = 40 + rnd() * 180
    const ang = rnd() * Math.PI
    const len = 10 + rnd() * 18
    const ddx = (Math.cos(ang) * len) / 2
    const ddy = (Math.sin(ang) * len) / 2
    paths.push(
      `M ${(x - ddx).toFixed(1)} ${(y - ddy).toFixed(1)} L ${(x + ddx).toFixed(1)} ${(y + ddy).toFixed(1)}`,
    )
  }
  return paths
}

function PrintSvg({ paths }: { paths: string[] }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="fphack__print" aria-hidden>
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" />
      ))}
    </svg>
  )
}

// Én stripe av avtrykket, forskjøvet dx med sirkulær wrap (tegner tre kopier).
function Strip({ paths, index, offset }: { paths: string[]; index: number; offset: number }) {
  const y = (index * H) / STRIPS
  const h = H / STRIPS
  const dx = offset * STEP
  return (
    <svg viewBox={`0 ${y} ${W} ${h}`} className="fphack__strip-svg" aria-hidden>
      {[dx - W, dx, dx + W].map((tx) => (
        <g key={tx} transform={`translate(${tx} 0)`}>
          {paths.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" />
          ))}
        </g>
      ))}
    </svg>
  )
}

interface Puzzle {
  seed: number
  offsets: number[]
}

function makePuzzle(): Puzzle {
  return {
    seed: Math.floor(Math.random() * 1e9),
    // 1..POSITIONS-1 → alle rader starter feil
    offsets: Array.from({ length: STRIPS }, () => 1 + Math.floor(Math.random() * (POSITIONS - 1))),
  }
}

type Status = 'playing' | 'success' | 'failed'

export default function FingerprintHack({
  onSuccess,
  onClose,
}: {
  onSuccess: () => void
  onClose: () => void
}) {
  const [puzzle, setPuzzle] = useState<Puzzle>(makePuzzle)
  const [printIndex, setPrintIndex] = useState(0)
  const [offsets, setOffsets] = useState<number[]>(puzzle.offsets)
  const [selected, setSelected] = useState(0)
  const [attempt, setAttempt] = useState(0) // antall mislykkede forsøk
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [status, setStatus] = useState<Status>('playing')
  const roundSeconds = ROUND_SECONDS + attempt * RETRY_BONUS
  // kort «SIGNAL DEKRYPTERT»-blink mellom avtrykkene (input er sperret imens)
  const [flash, setFlash] = useState(false)

  const paths = useMemo(() => printPaths(puzzle.seed), [puzzle.seed])
  const aligned = offsets.filter((o) => o === 0).length

  useEffect(() => {
    sfx.glitch()
    // bakgrunnsmusikk så lenge hacket er åpent (valgfri fil — se public/sfx/)
    return sfx.loopFile([assetUrl('sfx/hack-theme.m4a'), assetUrl('sfx/hack-theme.mp3')], 0.125)
  }, [])

  // Nedtelling — stopper når spillet er avgjort.
  useEffect(() => {
    if (status !== 'playing') return
    const id = window.setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000)
    return () => window.clearInterval(id)
  }, [status])

  useEffect(() => {
    if (timeLeft === 0 && status === 'playing') {
      setStatus('failed')
      sfx.error()
    }
  }, [timeLeft, status])

  // «30 sekunder igjen»-lyd — spilles idet klokka krysser 30 (også per retry).
  useEffect(() => {
    if (timeLeft === 30 && status === 'playing') {
      sfx.playFile(assetUrl('sfx/30sec.mp3'), 0.5)
    }
  }, [timeLeft, status])

  // Alle striper på plass: neste avtrykk (etter et kort blink), eller suksess
  // på det siste. Input er sperret under blinket (se shift), så deps endres
  // ikke og timeouten overlever til den fyrer.
  useEffect(() => {
    if (status !== 'playing' || !offsets.every((o) => o === 0)) return
    if (printIndex < PRINTS - 1) {
      sfx.success()
      setFlash(true)
      const id = window.setTimeout(() => {
        const p = makePuzzle()
        setPuzzle(p)
        setOffsets(p.offsets)
        setSelected(0)
        setPrintIndex((i) => i + 1)
        setFlash(false)
      }, 700)
      return () => window.clearTimeout(id)
    }
    setStatus('success')
    sfx.granted()
  }, [offsets, status, printIndex])

  // Timeouten må ligge i en egen effekt: hadde den ligget i effekten over,
  // ville re-kjøringen når status endres ha trigget cleanup og kansellert den.
  useEffect(() => {
    if (status !== 'success') return
    const id = window.setTimeout(onSuccess, 1500)
    return () => window.clearTimeout(id)
  }, [status, onSuccess])

  function shift(row: number, dir: -1 | 1) {
    if (status !== 'playing' || flash) return
    sfx.click()
    setSelected(row)
    setOffsets((o) => o.map((v, i) => (i === row ? (v + dir + POSITIONS) % POSITIONS : v)))
  }

  // Piltaster på PC: ↑/↓ velger rad, ←/→ skyver den.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (status !== 'playing') return
      if (e.key === 'ArrowUp') setSelected((s) => (s + STRIPS - 1) % STRIPS)
      else if (e.key === 'ArrowDown') setSelected((s) => (s + 1) % STRIPS)
      else if (e.key === 'ArrowLeft') shift(selected, -1)
      else if (e.key === 'ArrowRight') shift(selected, 1)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function retry() {
    const p = makePuzzle()
    setPuzzle(p)
    setOffsets(p.offsets)
    setSelected(0)
    setPrintIndex(0)
    // hvert mislykkede forsøk gir +RETRY_BONUS sek — blir gradvis lettere
    const nextAttempt = attempt + 1
    setAttempt(nextAttempt)
    setTimeLeft(ROUND_SECONDS + nextAttempt * RETRY_BONUS)
    setStatus('playing')
    setFlash(false)
    sfx.glitch()
  }

  return (
    <div className="fphack" role="dialog" aria-label="Politi-hack: fingeravtrykk">
      <div className="fphack__header">
        <span>POLITIET // FJERNDEKRYPTERING v2.1</span>
        <button className="fphack__close" onClick={onClose} aria-label="Avbryt">
          ✕
        </button>
      </div>

      <div className="fphack__timerbar" aria-hidden>
        <div
          className={`fphack__timerfill ${timeLeft <= 20 ? 'fphack__timerfill--low' : ''}`}
          style={{ width: `${(timeLeft / roundSeconds) * 100}%` }}
        />
      </div>
      <div className="fphack__timertext">
        <span>
          TILKOBLING: {String(Math.floor(timeLeft / 60))}:{String(timeLeft % 60).padStart(2, '0')}
        </span>
        <span>
          {Array.from({ length: PRINTS }, (_, i) => (i < printIndex ? '●' : '○')).join(' ')}{' '}
          AVTRYKK {printIndex + 1}/{PRINTS}
        </span>
        <span>PÅ PLASS: {aligned}/{STRIPS}</span>
      </div>

      <div className="fphack__panes">
        <div className="fphack__pane fphack__pane--components">
          <div className="fphack__label">KOMPONENTER</div>
          <div className="fphack__slides">
            {offsets.map((offset, i) => (
              <button
                key={i}
                className={`fphack__row ${selected === i ? 'fphack__row--selected' : ''}`}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  shift(i, e.clientX - rect.left < rect.width / 2 ? -1 : 1)
                }}
                aria-label={`Rad ${i + 1}: skyv (venstre halvdel = venstre, høyre = høyre)`}
              >
                <span className="fphack__arrow" aria-hidden>◀</span>
                <Strip paths={paths} index={i} offset={offset} />
                <span className="fphack__arrow" aria-hidden>▶</span>
              </button>
            ))}
          </div>
        </div>

        <div className="fphack__pane fphack__pane--target">
          <div className="fphack__label">MÅLAVTRYKK</div>
          <div className="fphack__target">
            <PrintSvg paths={paths} />
          </div>
        </div>
      </div>

      <div className="fphack__help">
        Trykk på venstre/høyre side av en rad for å skyve den. Radene wrapper rundt kanten.
      </div>

      {flash && (
        <div className="fphack__overlay fphack__overlay--ok">
          <div className="fphack__bigtext">
            ✔ SIGNAL {printIndex + 1}/{PRINTS} DEKRYPTERT
          </div>
          <div>Neste avtrykk lastes …</div>
        </div>
      )}

      {status === 'success' && (
        <div className="fphack__overlay fphack__overlay--ok">
          <div className="fphack__bigtext">✔ AVTRYKK KLONET</div>
          <div>Telefonen er dekryptert.</div>
        </div>
      )}

      {status === 'failed' && (
        <div className="fphack__overlay fphack__overlay--fail">
          <div className="fphack__bigtext">✖ TILKOBLING BRUTT</div>
          <div>
            Sikkerhetssystemet sporet deg. Neste forsøk får{' '}
            {ROUND_SECONDS + (attempt + 1) * RETRY_BONUS} sekunder.
          </div>
          <div className="fphack__overlay-btns">
            <button className="fphack__decrypt" onClick={retry}>
              ↻ PRØV IGJEN (+{RETRY_BONUS} SEK)
            </button>
            <button className="fphack__decrypt fphack__decrypt--ghost" onClick={onClose}>
              AVBRYT
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
