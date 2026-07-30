import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { assetUrl } from '../lib/assets'
import { flagCheater } from '../lib/supabase'
import { sfx } from '../lib/sfx'
import { useT } from '../lib/i18n'
import AppWindow from './AppWindow'
import { larryFound } from './LarryEasterEgg'

// Larry-siden: åpnes fra Larry-ikonet på skrivebordet (som bare finnes etter at
// easter egget er sett minst én gang). Han tilbyr å «fjerne halvparten av
// vitnene» — og gjør ingenting. Sier man ja, noteres det server-side, og Larry
// sier rett ut at han noterte det. Ingen loggføres i det skjulte, og
// puslespillet røres ikke.
//
// Svaret huskes per enhet, så man ikke får tilbudet på nytt og «angrer» seg til
// et annet svar. Flagget i databasen er idempotent uansett.
const ANSWER_KEY = 'gfm:larry-answer'

type Answer = 'yes' | 'no' | null
type Phase = 'offer' | 'thinking' | 'revealed' | 'declined'

function storedAnswer(): Answer {
  try {
    const v = localStorage.getItem(ANSWER_KEY)
    return v === 'yes' || v === 'no' ? v : null
  } catch {
    return null
  }
}

function storeAnswer(a: Exclude<Answer, null>): void {
  try {
    localStorage.setItem(ANSWER_KEY, a)
  } catch {
    /* privat modus e.l. — svaret gjelder bare denne økten */
  }
}

export default function LarryPage() {
  const t = useT()
  // Har man svart før, hopp rett til utfallet i stedet for å spørre igjen.
  const [phase, setPhase] = useState<Phase>(() => {
    const a = storedAnswer()
    return a === 'yes' ? 'revealed' : a === 'no' ? 'declined' : 'offer'
  })

  // Ikonet finnes ikke før Larry er funnet — så ruta skal heller ikke være
  // nåbar ved å gjette URL-en.
  if (!larryFound()) return <Navigate to="/" replace />

  function accept() {
    storeAnswer('yes')
    sfx.glitch()
    setPhase('thinking')
    // Kort pause før poenget lander.
    window.setTimeout(() => setPhase('revealed'), 1400)
    // Flagget er hele poenget, men det skal aldri kunne velte siden.
    void flagCheater().catch(() => {})
  }

  function decline() {
    storeAnswer('no')
    sfx.click()
    setPhase('declined')
  }

  return (
    <AppWindow title={t('larryTitle')} icon="👽" variant="larry">
      <div className="larrypage">
        <img className="larrypage__img" src={assetUrl('case/memes/larry.gif')} alt="" aria-hidden />

        {phase === 'offer' && (
          <>
            <p className="larrypage__line">{t('larryOffer')}</p>
            <div className="larrypage__btns">
              <button className="larrypage__btn" onClick={accept}>
                {t('larryYes')}
              </button>
              <button className="larrypage__btn" onClick={decline}>
                {t('larryNo')}
              </button>
            </div>
          </>
        )}

        {phase === 'thinking' && <p className="larrypage__line larrypage__line--dots">…</p>}

        {phase === 'revealed' && (
          <>
            <p className="larrypage__line">{t('larryReveal1')}</p>
            <p className="larrypage__line">{t('larryReveal2')}</p>
            <p className="larrypage__line larrypage__line--noted">{t('larryReveal3')}</p>
          </>
        )}

        {phase === 'declined' && <p className="larrypage__line">{t('larryDeclined')}</p>}
      </div>
    </AppWindow>
  )
}
