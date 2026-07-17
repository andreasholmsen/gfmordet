import { useEffect, useRef, useState } from 'react'
import { assetUrl } from '../lib/assets'
import { sfx } from '../lib/sfx'

// Skjult easter egg: 1% sjanse etter hvert klikk (eller manuelt via
// triggerLarry()) for at «telefonen hackes» — glitch inn, larry.gif spilles,
// og alt forsvinner igjen uten forklaring. Rent visuelt (pointer-events: none).
const CHANCE = 0.01
const GLITCH_IN_MS = 650 // glitch-inn før gif-en er «på»
const SHOW_MS = 4200 // hvor lenge larry.gif vises (juster til gif-lengden)
const GLITCH_OUT_MS = 450 // glitch-ut når den forsvinner

type Phase = 'idle' | 'in' | 'show' | 'out'

/** Trigger easter egget manuelt (brukes av hold-for-test). */
export function triggerLarry() {
  window.dispatchEvent(new Event('larry:show'))
}

export default function LarryEasterEgg() {
  const [phase, setPhase] = useState<Phase>('idle')
  const activeRef = useRef(false)

  useEffect(() => {
    const timers: number[] = []

    function show() {
      if (activeRef.current) return
      activeRef.current = true
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
      if (!activeRef.current && Math.random() < CHANCE) show()
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
