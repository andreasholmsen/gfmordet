import { useEffect, useMemo, useRef, useState } from 'react'
import { assetUrl } from '../lib/assets'
import { sfx } from '../lib/sfx'

// «BRUTEFORCE.EXE» (GTA-stil) — hacket til Angelas WhatsApp. Alle bokstavhjulene
// (ett per tegn i passordet) vises side om side og spinner; fokus flyttes
// venstre → høyre. Stopp det aktive hjulet idet den RØDE bokstaven (den
// riktige) står i den blå stripen — da fryses hjulet og neste får fokus.
// Feil stopp ⇒ ett tegn TILBAKE (hjulet bak låses opp igjen). Ingen timer —
// bare timing. Tapp brettet / STOPP-knappen / mellomrom på PC. Musikk looper.

const TICK_MS = 260 // hjulets fart (én rad per tick)
const REEL_LEN = 10 // bokstaver per hjul (målbokstaven én gang per runde)
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Hjul for én bokstav: målbokstaven + (REEL_LEN-1) andre, stokket.
function makeReel(target: string): string[] {
  const others = shuffle(ALPHABET.split('').filter((c) => c !== target)).slice(0, REEL_LEN - 1)
  return shuffle([target, ...others])
}

export default function BruteForceHack({
  word = 'GIGACHAD',
  onSolved,
}: {
  word?: string
  onSolved: () => void
}) {
  const letters = useMemo(() => word.toUpperCase().replace(/[^A-ZÆØÅ]/g, '').split(''), [word])
  const reels = useMemo(() => letters.map(makeReel), [letters])
  const [tick, setTick] = useState(0)
  const [pos, setPos] = useState(0) // hjulet med fokus
  // frossen rulleposisjon per løst hjul (null = spinner fortsatt)
  const [frozenAt, setFrozenAt] = useState<(number | null)[]>(() => letters.map(() => null))
  const [failFlash, setFailFlash] = useState(false) // kort rødt blaff på aktivt hjul
  const [granted, setGranted] = useState(false)
  const doneRef = useRef(false)

  useEffect(() => {
    sfx.glitch()
    // bakgrunnsmusikk så lenge hacket er åpent (samme spor/volum som de andre)
    return sfx.loopFile([assetUrl('sfx/hack-theme.m4a'), assetUrl('sfx/hack-theme.mp3')], 0.125)
  }, [])

  // Alle uløste hjul spinner i takt (ulike reels gir ulikt innhold).
  useEffect(() => {
    if (granted) return
    const id = window.setInterval(() => setTick((t) => (t + 1) % REEL_LEN), TICK_MS)
    return () => window.clearInterval(id)
  }, [granted])

  useEffect(() => {
    if (!granted) return
    const id = window.setTimeout(onSolved, 1500)
    return () => window.clearTimeout(id)
  }, [granted, onSolved])

  function stop() {
    if (granted || doneRef.current) return
    const center = reels[pos][tick]
    if (center === letters[pos]) {
      setFrozenAt((f) => f.map((v, i) => (i === pos ? tick : v)))
      if (pos === letters.length - 1) {
        doneRef.current = true
        setPos((p) => p + 1)
        setGranted(true)
        sfx.granted()
        return
      }
      sfx.success()
      setPos((p) => p + 1)
    } else {
      // Feil timing: ett tegn tilbake — hjulet bak låses opp og spinner igjen.
      sfx.error()
      setFailFlash(true)
      window.setTimeout(() => setFailFlash(false), 400)
      const back = Math.max(0, pos - 1)
      setFrozenAt((f) => f.map((v, i) => (i === back ? null : v)))
      setPos(back)
    }
  }

  // Mellomrom/Enter på PC.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        stop()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // CHEAT (for spillederen): hold STOPP-knappen inne i 10 sek → alle hjulene
  // fryses på riktig bokstav og tilgang gis. Klikket som følger etter et langt
  // trykk er ufarlig (stop() er sperret når granted er satt).
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
      doneRef.current = true
      setFrozenAt(reels.map((reel, i) => reel.indexOf(letters[i])))
      setPos(letters.length)
      setGranted(true)
      sfx.granted()
    }, 10_000)
  }
  useEffect(() => cheatStop, [])

  return (
    <div className="bf" role="dialog" aria-label="WhatsApp-hack: BruteForce">
      <div className="bf__brand">
        BRUTEFORCE.EXE
        <span className="bf__tagline">— busting through the backdoor since 1998 —</span>
      </div>

      <div className="bf__progress">
        PASSORD: {Math.min(pos, letters.length)}/{letters.length}
      </div>

      <button className="bf__board" onClick={stop} aria-label="Stopp hjulet med fokus">
        {letters.map((target, i) => {
          const at = frozenAt[i] ?? tick
          const solved = frozenAt[i] !== null
          return (
            <span
              key={i}
              className={`bf__colwheel ${i === pos && !granted ? 'bf__colwheel--active' : ''} ${
                solved ? 'bf__colwheel--done' : ''
              } ${i === pos && failFlash ? 'bf__colwheel--fail' : ''}`}
            >
              {[-2, -1, 0, 1, 2].map((k) => {
                const letter = reels[i][(at + k + REEL_LEN * 2) % REEL_LEN]
                return (
                  <span
                    key={k}
                    className={`bf__cell ${k === 0 ? 'bf__cell--center' : ''} ${
                      solved && k === 0
                        ? 'bf__cell--locked'
                        : letter === target
                          ? 'bf__cell--target'
                          : ''
                    }`}
                  >
                    {letter}
                  </span>
                )
              })}
            </span>
          )
        })}
        <span className="bf__strip" aria-hidden />
      </button>

      <button
        className="bf__stop"
        onClick={stop}
        onPointerDown={cheatStart}
        onPointerUp={cheatStop}
        onPointerLeave={cheatStop}
        onPointerCancel={cheatStop}
        onContextMenu={(e) => e.preventDefault()}
      >
        ⏹ STOPP
      </button>
      <p className="bf__hint">
        Stopp når den <strong>røde</strong> bokstaven står i den blå stripen. Bom ⇒ ett tegn
        tilbake.
      </p>

      {granted && (
        <div className="bf__overlay bf__overlay--ok" aria-hidden>
          TILGANG GITT ✓
        </div>
      )}
    </div>
  )
}
