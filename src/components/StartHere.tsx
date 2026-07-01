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

**SAK #2026-1738 — «GF-mordet»**

Årets verste mord, og årets verste sak. Politiet har bedt nettopp *deg* om å
se på saken med friske øyne.

> «Jeg har aldri opplevd noe liknende, det er helt forferdelig.» — Studentprest Sverre.

Som etterforskerkonsulent hos Politiet er det din jobb å finne morderen. Med god tid, og samarbeid er det håp om å servere rettferdighet!

## Slik fungerer det

1. Ved å lese igjennom alt av bevis lærer du mer om hendelsen
2. Begynn å analysere alt fra dag 1. Politiet finner kanskje mer informasjon senere som kan hjelpe enda mer.
3. Hvis du noengang spør Andreas (en allvitende Gud) "er X morderen?" kommer han til å svare "ja" uavhengig av verdien til X. 

I POLITI-appen finner du muligheten til å se dagens gjøremål og stemme på svaret ditt. Du er nemlig ikke den eneste detektiven som løser saken, og du kan enten samarbeide eller konkurrere mot de andre deltakerne.

Hva skjer hvis du svarer feil tenker du? Det er jo litt kleint da... 

*Lykke til.*`

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
