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
const INTRO_DOC = `# Velkommen sjef

**SAK #2026-1738 — «GF-mordet»**

Århundrets mest forferdelig mord, og politiet har bedt nettopp *deg* om å
se på saken med friske øyne. Wiiild, right?

> «Jeg har aldri opplevd noe liknende, det er helt forferdelig.» — *Studentprest Sverre*.

Som etterforskerkonsulent hos Politiet er det din jobb å finne morderen - raskere enn rasketoget.

![Sørmarka](case/intro/sormarka.jpg)

## Slik fungerer det

1. Les gjennom alt av bevis
2. Svar på dagens spørsmål i POLITI-appen
3. **Ved bruk av avansert lyveteknikk så sier Andreas ja til alle spørsmål som spør om morderen.**

Sjekk POLITI-appen neste for å se på dagens spørsmål!! Du vil få muligheten til å velge et navn og stemme. Du er nemlig ikke den eneste detektiven på saken!

Hva skjer hvis du svarer feil tenker du? Det er jo litt kleint da... 

Hvis noe er utydelig så bare prøv deg litt frem. Etter du har stemt kan du fortsatt bytte mening etterhvert ;)

*Lykke til.*





PS: Har jeg brukt ditt navn i saken, og du ønsker å holdes ute? Null stress - send meg en melding på Slack eller si ifra så anonymiserer jeg ting fort som bare det. Tok meg litt kreative friheter til å nevne hvem jeg ville, men er såklart ikke meningen å skape dårlig stemning. Legger meg helt flat! Bare et forsøk på god humor.
`

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
