import { useEffect, useState } from 'react'
import { CASE } from '../case/manifest'
import {
  hasSupabase,
  getRomanceStatus,
  getMyMatch,
  getSwipeDeck,
  recordSwipe,
  cancelMatch,
  createRomanceProfile,
  uploadProfilePhoto,
  type DeckCard,
  type MyMatch,
} from '../lib/supabase'
import { sfx } from '../lib/sfx'
import AppWindow from './AppWindow'
import CameraCapture from './CameraCapture'

type View = 'loading' | 'setup' | 'swipe' | 'done' | 'match' | 'offline'

export default function RomansaiansaApp() {
  const [view, setView] = useState<View>(hasSupabase ? 'loading' : 'offline')
  const [match, setMatch] = useState<MyMatch | null>(null)

  async function load() {
    const [status, m] = await Promise.all([getRomanceStatus(), getMyMatch()])
    if (m) {
      setMatch(m)
      setView('match')
      return
    }
    if (!status.hasProfile) setView('setup')
    else if (status.deckTotal - status.swipedCount > 0) setView('swipe')
    else setView('done')
  }

  useEffect(() => {
    if (hasSupabase) load()
  }, [])

  return (
    <AppWindow title="Romansaiansa" icon="🔥" variant="instagram">
      <div className="romance">
        <div className="romance__brand">
          Romansaiansa <span aria-hidden>🔥</span>
        </div>

        {view === 'offline' && (
          <p className="notice">Romansaiansa krever pålogging og nett — ikke tilgjengelig i demo.</p>
        )}
        {view === 'loading' && <p className="notice">Kobler til …</p>}
        {view === 'setup' && <Setup onDone={load} />}
        {view === 'swipe' && <SwipeDeck onDone={() => setView('done')} />}
        {view === 'done' && <DoneCard />}
        {view === 'match' && match && <MatchCard match={match} onChanged={load} />}
      </div>
    </AppWindow>
  )
}

// --- Oppsett: selfie → om deg → quiz -----------------------------------------
function Setup({ onDone }: { onDone: () => void }) {
  const cfg = CASE.romance
  const [step, setStep] = useState<'photo' | 'about' | 'quiz'>('photo')
  const [camera, setCamera] = useState(false)
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null)
  const [gender, setGender] = useState<string>('')
  const [interested, setInterested] = useState<string[]>([])
  const [quiz, setQuiz] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!cfg) return <p className="notice">Romansaiansa er ikke konfigurert.</p>

  function toggleInterested(id: string) {
    setInterested((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  }

  async function submit() {
    if (!photo || !gender || interested.length === 0) return
    setBusy(true)
    setError(null)
    try {
      const path = await uploadProfilePhoto(photo.blob)
      await createRomanceProfile({ photoPath: path, gender, interestedIn: interested, quiz })
      sfx.success()
      onDone()
    } catch (err) {
      sfx.error()
      setBusy(false)
      setError(err instanceof Error ? err.message : 'Noe gikk galt. Prøv igjen.')
    }
  }

  const quizComplete = cfg.quiz.every((q) => quiz[q.id])

  return (
    <div className="romance__setup">
      {step === 'photo' && (
        <>
          <h2 className="romance__h">Ta en selfie 📸</h2>
          <p className="romance__lead">Vis ansiktet ditt — dette er profilbildet ditt i Romansaiansa.</p>
          {photo ? (
            <img className="romance__selfie" src={photo.url} alt="Din selfie" />
          ) : (
            <div className="romance__selfie romance__selfie--empty">Ingen selfie ennå</div>
          )}
          <button className="btn btn--primary" onClick={() => setCamera(true)}>
            {photo ? 'Ta ny selfie' : 'Åpne kamera'}
          </button>
          {photo && (
            <button className="btn" onClick={() => setStep('about')}>
              Neste →
            </button>
          )}
        </>
      )}

      {step === 'about' && (
        <>
          <h2 className="romance__h">Om deg</h2>
          <p className="romance__label">Jeg er</p>
          <div className="romance__opts">
            {cfg.genders.map((g) => (
              <button
                key={g.id}
                className={`romance__chip ${gender === g.id ? 'romance__chip--on' : ''}`}
                onClick={() => setGender(g.id)}
              >
                {g.label}
              </button>
            ))}
          </div>
          <p className="romance__label">Interessert i</p>
          <div className="romance__opts">
            {cfg.interestedIn.map((o) => (
              <button
                key={o.id}
                className={`romance__chip ${interested.includes(o.id) ? 'romance__chip--on' : ''}`}
                onClick={() => toggleInterested(o.id)}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="romance__nav">
            <button className="btn" onClick={() => setStep('photo')}>
              ← Tilbake
            </button>
            <button
              className="btn btn--primary"
              disabled={!gender || interested.length === 0}
              onClick={() => setStep('quiz')}
            >
              Neste →
            </button>
          </div>
        </>
      )}

      {step === 'quiz' && (
        <>
          <h2 className="romance__h">Mini-quiz 💘</h2>
          {cfg.quiz.map((q) => (
            <div key={q.id} className="romance__q">
              <p className="romance__label">{q.prompt}</p>
              <div className="romance__opts">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    className={`romance__chip ${quiz[q.id] === opt ? 'romance__chip--on' : ''}`}
                    onClick={() => setQuiz((cur) => ({ ...cur, [q.id]: opt }))}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {error && <p className="notice notice--error">{error}</p>}
          <div className="romance__nav">
            <button className="btn" onClick={() => setStep('about')} disabled={busy}>
              ← Tilbake
            </button>
            <button className="btn btn--primary" disabled={!quizComplete || busy} onClick={submit}>
              {busy ? 'Lagrer …' : 'Fullfør profil'}
            </button>
          </div>
        </>
      )}

      {camera && (
        <CameraCapture
          defaultFacing="user"
          confirmLabel="Bruk selfie"
          onConfirm={(blob) => {
            if (photo) URL.revokeObjectURL(photo.url)
            setPhoto({ blob, url: URL.createObjectURL(blob) })
          }}
          onClose={() => setCamera(false)}
        />
      )}
    </div>
  )
}

// --- Swiping -----------------------------------------------------------------
function SwipeDeck({ onDone }: { onDone: () => void }) {
  const [deck, setDeck] = useState<DeckCard[] | null>(null)
  const [i, setI] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getSwipeDeck().then(setDeck)
  }, [])

  if (deck === null) return <p className="notice">Laster …</p>
  if (deck.length === 0) {
    return (
      <div className="romance__done">
        <p className="notice">Ingen å swipe på akkurat nå — sjekk tilbake senere!</p>
      </div>
    )
  }
  if (i >= deck.length) {
    return (
      <div className="romance__done">
        <p className="notice notice--ok">Ferdig swipet! 🎉 Du kan nå stemme på dag 2.</p>
        <p className="romance__lead">Matcher avsløres når dag 3 starter.</p>
      </div>
    )
  }

  const card = deck[i]

  async function swipe(liked: boolean) {
    if (busy) return
    setBusy(true)
    try {
      await recordSwipe(card.id, liked)
      sfx.click()
      const next = i + 1
      setI(next)
      if (next >= deck!.length) onDone()
    } catch {
      sfx.error()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="romance__swipe">
      <p className="romance__progress">
        {i + 1} av {deck.length}
      </p>
      <div className="romance__card">
        <img className="romance__card-img" src={card.url} alt={card.name} />
        <div className="romance__card-info">
          <div className="romance__card-name">{card.name}</div>
          {Object.values(card.quiz).length > 0 && (
            <div className="romance__card-quiz">
              {Object.values(card.quiz).slice(0, 2).join(' · ')}
            </div>
          )}
        </div>
      </div>
      <div className="romance__swipe-actions">
        <button className="romance__nope" onClick={() => swipe(false)} disabled={busy} aria-label="Nei">
          ✗
        </button>
        <button className="romance__like" onClick={() => swipe(true)} disabled={busy} aria-label="Ja">
          ♥
        </button>
      </div>
    </div>
  )
}

// --- Ferdig (profil klar, venter på dag 3) -----------------------------------
function DoneCard() {
  return (
    <div className="romance__done">
      <p className="notice notice--ok">Profilen din er klar! 💘</p>
      <p className="romance__lead">
        Du har swipet ferdig. Når dag 3 starter blir du matchet med en annen etterforsker — og
        dere deler beviset mellom dere.
      </p>
    </div>
  )
}

// --- Match (dag 3) -----------------------------------------------------------
function MatchCard({ match, onChanged }: { match: MyMatch; onChanged: () => void }) {
  const [busy, setBusy] = useState(false)

  async function cancel() {
    if (busy) return
    if (!window.confirm('Avlyse romansen? Da spiller dere hver for dere og får hele beviset selv.')) return
    setBusy(true)
    try {
      await cancelMatch()
      sfx.click()
      onChanged()
    } catch {
      sfx.error()
      setBusy(false)
    }
  }

  if (match.cancelled) {
    return (
      <div className="romance__done">
        <p className="notice">Romansen er avlyst 💔</p>
        <p className="romance__lead">Du spiller solo nå — du har tilgang til hele dag 3-beviset selv.</p>
      </div>
    )
  }

  return (
    <div className="romance__match">
      <p className="romance__match-head">Det ble en match! 💘</p>
      {match.partnerUrl && <img className="romance__selfie" src={match.partnerUrl} alt={match.partnerName} />}
      <p className="romance__lead">
        Du er matchet med <strong>{match.partnerName}</strong>. Dere har hver deres halvdel av dag
        3-beviset — finn hverandre og løs saken sammen!
      </p>
      <button className="btn" onClick={cancel} disabled={busy}>
        {busy ? 'Avlyser …' : 'Avlys romanse'}
      </button>
    </div>
  )
}
