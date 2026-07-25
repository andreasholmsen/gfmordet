import { useEffect, useMemo, useRef, useState } from 'react'
import { assetUrl } from '../lib/assets'
import { sfx } from '../lib/sfx'

// «Signal box»-hack (GTA Cayo Perico-stil): tre tall til venstre, tre kryptiske
// symboler til høyre. Hvert symbol har en SKJULT multiplikator (×1/×2/×3).
// Koble hvert tall til ett symbol (unik kobling) — RESULT viser løpende sum av
// tall × symbolverdi, og boksen låses opp når summen treffer TARGET. Ingen
// timer: musikken looper og man fikler til det stemmer. Auto-løses ved treff.

const GLYPHS = ['⌁', 'Φ', '⊗']
const WIRES = ['#e3c14b', '#e34b4b', '#4b7be3'] // gul/rød/blå — én farge per tall

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface Puzzle {
  nums: number[] // tallene til venstre
  mults: number[] // skjult multiplikator per symbol (indeks = symbol)
  target: number
}

function makePuzzle(): Puzzle {
  const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3)
  const mults = shuffle([1, 2, 3])
  const secret = shuffle([0, 1, 2]) // fasit-kobling tall→symbol
  const target = nums.reduce((s, n, i) => s + n * mults[secret[i]], 0)
  return { nums, mults, target }
}

const pad3 = (n: number) => String(n).padStart(3, '0')

export default function SignalBoxHack({ onSolved }: { onSolved: () => void }) {
  const puzzle = useMemo(makePuzzle, [])
  // links[tallindeks] = symbolindeks (eller null). Kobling er alltid unik:
  // kobles et tall til et opptatt symbol, mister det andre tallet ledningen sin.
  const [links, setLinks] = useState<(number | null)[]>([null, null, null])
  const [sel, setSel] = useState<number | null>(null)
  const [granted, setGranted] = useState(false)
  const doneRef = useRef(false)

  // Hacker-musikk i bakgrunnen (samme spor og volum som POLITI-hacket).
  useEffect(
    () => sfx.loopFile([assetUrl('sfx/hack-theme.m4a'), assetUrl('sfx/hack-theme.mp3')], 0.125),
    [],
  )

  const sum = links.reduce<number>(
    (s, l, i) => (l === null ? s : s + puzzle.nums[i] * puzzle.mults[l]),
    0,
  )
  const complete = links.every((l) => l !== null)
  const wrong = complete && sum !== puzzle.target

  useEffect(() => {
    if (!complete || sum !== puzzle.target || doneRef.current) return
    doneRef.current = true
    setGranted(true)
    sfx.sting()
    const t = window.setTimeout(onSolved, 1200)
    return () => window.clearTimeout(t)
  }, [complete, sum, puzzle.target, onSolved])

  function tapNum(i: number) {
    if (granted) return
    sfx.click()
    setSel((s) => (s === i ? null : i))
  }

  // CHEAT (for spillederen): hold det ØVERSTE tallet inne i 10 sek → koblingene
  // settes til fasit, og den vanlige løsnings-effekten over tar det derfra.
  const cheatTimer = useRef<number | null>(null)
  function cheatStop() {
    if (cheatTimer.current !== null) {
      window.clearTimeout(cheatTimer.current)
      cheatTimer.current = null
    }
  }
  function cheatStart() {
    cheatStop()
    cheatTimer.current = window.setTimeout(() => {
      if (doneRef.current) return
      const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]
      const sol = perms.find(
        (p) => puzzle.nums.reduce((s, n, i) => s + n * puzzle.mults[p[i]], 0) === puzzle.target,
      )
      if (sol) setLinks(sol)
    }, 10_000)
  }
  useEffect(() => cheatStop, [])
  function tapSym(s: number) {
    if (granted || sel === null) return
    sfx.click()
    setLinks((prev) => prev.map((l, i) => (i === sel ? s : l === s ? null : l)))
    setSel(null)
  }

  // y-posisjon (i viewBox-prosent) for midten av rad i.
  const rowY = (i: number) => 17 + 33 * i

  return (
    <div className="sbx">
      <div className="sbx__display sbx__display--target">
        <span className="sbx__display-label">TARGET</span>
        <span className="sbx__digits">{pad3(puzzle.target)}</span>
      </div>

      <div className="sbx__board">
        <div className="sbx__col">
          {puzzle.nums.map((n, i) => (
            <button
              key={i}
              className={`sbx__num ${sel === i ? 'sbx__num--sel' : ''}`}
              style={{ borderColor: WIRES[i], color: WIRES[i] }}
              onClick={() => tapNum(i)}
              onPointerDown={i === 0 ? cheatStart : undefined}
              onPointerUp={i === 0 ? cheatStop : undefined}
              onPointerLeave={i === 0 ? cheatStop : undefined}
              onPointerCancel={i === 0 ? cheatStop : undefined}
              onContextMenu={i === 0 ? (e) => e.preventDefault() : undefined}
              aria-label={`Tall ${n}`}
            >
              {n}
            </button>
          ))}
        </div>

        <svg className="sbx__wires" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {links.map((l, i) =>
            l === null ? null : (
              <polyline
                key={i}
                points={`0,${rowY(i)} 46,${rowY(i)} 54,${rowY(l)} 100,${rowY(l)}`}
                stroke={WIRES[i]}
                strokeWidth={2}
                fill="none"
                vectorEffect="non-scaling-stroke"
              />
            ),
          )}
        </svg>

        <div className="sbx__col">
          {GLYPHS.map((gl, s) => (
            <button
              key={s}
              className={`sbx__sym ${links.includes(s) ? 'sbx__sym--linked' : ''} ${
                sel !== null ? 'sbx__sym--ready' : ''
              }`}
              onClick={() => tapSym(s)}
              aria-label={`Symbol ${s + 1}`}
            >
              {gl}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`sbx__display sbx__display--result ${wrong ? 'sbx__display--wrong' : ''} ${
          granted ? 'sbx__display--ok' : ''
        }`}
      >
        <span className="sbx__display-label">RESULT</span>
        <span className="sbx__digits">{pad3(sum)}</span>
      </div>

      {granted ? (
        <div className="sbx__granted">TILGANG GITT ✓</div>
      ) : (
        <p className="sbx__hint">
          Koble hvert tall til ett symbol (trykk tall, så symbol). Summen må treffe TARGET.
        </p>
      )}
    </div>
  )
}
