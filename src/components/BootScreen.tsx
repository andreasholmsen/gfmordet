import { useEffect, useRef, useState } from 'react'
import { sfx } from '../lib/sfx'

// Full-skjerms "terminal som booter politisystemet"-animasjon. Vises hver gang
// siden lastes/oppdateres (App monteres på nytt), men IKKE ved intern navigasjon.
const LINES = [
  'POLITIET // SAKSSYSTEM v3.7',
  'initialiserer sikker tilkobling …',
  'dekrypterer bevismateriale … OK',
  'laster vitneutsagn … OK',
  'kobler til spaningsdatabasen … OK',
  'analyserer fingeravtrykk … OK',
  'verifiserer etterforsker … OK',
  'TILGANG INNVILGET',
]

const STEP_MS = 180 // tid mellom hver linje
const HOLD_MS = 300 // pause etter siste linje
const FADE_MS = 350 // utfading

export default function BootScreen({ onDone }: { onDone: () => void }) {
  const [shown, setShown] = useState(0)
  const [fading, setFading] = useState(false)
  const timers = useRef<number[]>([])
  const done = useRef(false)

  function finish() {
    if (done.current) return
    done.current = true
    timers.current.forEach(clearTimeout)
    onDone()
  }

  useEffect(() => {
    LINES.forEach((line, i) => {
      timers.current.push(
        window.setTimeout(() => {
          setShown(i + 1)
          if (line === 'TILGANG INNVILGET') sfx.granted()
          else sfx.beep()
        }, STEP_MS * (i + 1)),
      )
    })
    const endAt = STEP_MS * LINES.length + HOLD_MS
    timers.current.push(window.setTimeout(() => setFading(true), endAt))
    timers.current.push(window.setTimeout(finish, endAt + FADE_MS))
    return () => timers.current.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className={`boot ${fading ? 'boot--out' : ''}`}
      onClick={finish}
      role="status"
      aria-label="Laster politisystemet"
    >
      <div className="boot__scanlines" aria-hidden />
      <div className="boot__text">
        {LINES.slice(0, shown).map((line, i) => {
          const isLast = i === shown - 1
          const granted = line === 'TILGANG INNVILGET'
          const hasOk = line.endsWith(' OK')
          return (
            <div className="boot__line" key={i}>
              {granted ? (
                <span className="boot__granted">{line}</span>
              ) : hasOk ? (
                <>
                  {line.slice(0, -3)}
                  <span className="boot__ok"> OK</span>
                </>
              ) : (
                line
              )}
              {isLast && !granted && <span className="boot__cursor" aria-hidden />}
            </div>
          )
        })}
      </div>
      <div className="boot__bar" aria-hidden>
        <div className="boot__bar-fill" />
      </div>
      <div className="boot__hint">trykk for å hoppe over</div>
    </div>
  )
}
