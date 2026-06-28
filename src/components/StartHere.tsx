import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppWindow from './AppWindow'
import CrimeSceneIntro from './CrimeSceneIntro'
import Markdown from './Markdown'
import { markStartSeen } from '../lib/intro'

// «START HER»-opplevelsen: spiller åsted-cinematicen, og når den er ferdig (eller
// hoppet over) vises et introduksjonsdokument. Introen kan alltid spilles av på
// nytt med knappen nederst. Åpnes fra skrivebordsikonet (ruten /start).

// PLACEHOLDER — bytt ut med ekte intro-tekst. (Foreløpig gibberish.)
const INTRO_DOC = `# Velkommen, etterforsker

**SAK #2026-0731 — «GF-mordet»**

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
incididunt ut labore et dolore magna aliqua. Politiet har bedt nettopp *deg* om å
se på saken med friske øyne.

> «Noen i denne kretsen lyver. Finn ut hvem.» — Førstebetjent K.

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate.

## Slik fungerer det

1. Hver dag åpnes en ny mappe med bevis.
2. Les dokumentene, studér Instagram-feeden og Mistenkte-tavla.
3. Svar på dagens spørsmål i **POLITI**-appen.

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error.

*Lykke til. Sannheten avsløres dag 4.*`

export default function StartHere() {
  const [phase, setPhase] = useState<'intro' | 'doc'>('intro')
  const navigate = useNavigate()

  // Marker som sett så snart opplevelsen åpnes (stopper blinkingen på ikonet).
  useEffect(() => {
    markStartSeen()
  }, [])

  if (phase === 'intro') {
    return <CrimeSceneIntro onDone={() => setPhase('doc')} />
  }

  return (
    <AppWindow title="START HER" icon="📨" variant="folder">
      <Markdown source={INTRO_DOC} />
      <div className="start-doc__actions">
        <button className="btn btn--primary" onClick={() => navigate('/')}>
          Begynn å løse! 🔍
        </button>
      </div>
    </AppWindow>
  )
}
