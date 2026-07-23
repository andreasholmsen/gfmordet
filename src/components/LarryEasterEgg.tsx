import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { assetUrl } from '../lib/assets'
import { sfx } from '../lib/sfx'

// Skjult easter egg: 0.1% sjanse etter hvert klikk PÅ SKRIVEBORDET (eller
// manuelt via triggerLarry()) for at «telefonen hackes» — glitch inn,
// larry.gif spilles, og alt forsvinner igjen uten forklaring. Vises aldri inne
// i en app (WeChat, minesveiper, …). Rent visuelt (pointer-events: none).
const CHANCE = 0.001
const GLITCH_IN_MS = 650 // glitch-inn før gif-en er «på»
const SHOW_MS = 4200 // hvor lenge larry.gif vises (juster til gif-lengden)
const GLITCH_OUT_MS = 450 // glitch-ut når den forsvinner

type Phase = 'idle' | 'in' | 'show' | 'out'

// Når Larry er sett minst én gang «låses han opp» og et Larry-ikon dukker opp
// på skrivebordet (vedvarer i localStorage). Best effort som resten av appen.
const FOUND_KEY = 'gf-mordet.larry-found.v1'

/** Har spilleren funnet Larry minst én gang? */
export function larryFound(): boolean {
  try {
    return localStorage.getItem(FOUND_KEY) === '1'
  } catch {
    return false
  }
}

/** Marker Larry som funnet + varsle skrivebordet (så ikonet dukker opp med en gang). */
function markLarryFound(): void {
  try {
    if (localStorage.getItem(FOUND_KEY) === '1') return
    localStorage.setItem(FOUND_KEY, '1')
  } catch {
    /* ignorer – varsle uansett så ikonet vises i denne økten */
  }
  window.dispatchEvent(new Event('larry:found'))
}

/** Trigger easter egget manuelt (brukes av hold-for-test og Larry-ikonet). */
export function triggerLarry() {
  window.dispatchEvent(new Event('larry:show'))
}

export default function LarryEasterEgg() {
  const [phase, setPhase] = useState<Phase>('idle')
  const activeRef = useRef(false)

  // Kun det tilfeldige klikket begrenses til skrivebordet ('/'). Ref holdes
  // fersk hver render, så click-lytteren (registrert én gang) ser riktig rute.
  const location = useLocation()
  const onDesktopRef = useRef(location.pathname === '/')
  onDesktopRef.current = location.pathname === '/'

  useEffect(() => {
    const timers: number[] = []

    function show() {
      if (activeRef.current) return
      activeRef.current = true
      // Lukk et evt. åpent tastatur på mobil ved å ta fokus fra input/textarea,
      // så Larry-gif-en ikke vises bak tastaturet.
      const focused = document.activeElement
      if (focused instanceof HTMLElement) focused.blur()
      // Lås opp Larry-ikonet på skrivebordet fra og med nå.
      markLarryFound()
      setPhase('in')
      sfx.glitch()
      timers.push(window.setTimeout(() => setPhase('show'), GLITCH_IN_MS))
      timers.push(window.setTimeout(() => setPhase('out'), GLITCH_IN_MS + SHOW_MS))
      timers.push(
        window.setTimeout(
          () => {
            setPhase('idle')
            activeRef.current = false
          },
          GLITCH_IN_MS + SHOW_MS + GLITCH_OUT_MS,
        ),
      )
    }

    function onClick() {
      if (!activeRef.current && onDesktopRef.current && Math.random() < CHANCE) show()
    }

    document.addEventListener('click', onClick)
    window.addEventListener('larry:show', show)
    return () => {
      document.removeEventListener('click', onClick)
      window.removeEventListener('larry:show', show)
      timers.forEach(clearTimeout)
    }
  }, [])

  if (phase === 'idle') return null

  return (
    <div className={`larry larry--${phase}`} aria-hidden>
      <img className="larry__img" src={assetUrl('case/memes/larry.gif')} alt="" />
      <div className="larry__scan" />
    </div>
  )
}
