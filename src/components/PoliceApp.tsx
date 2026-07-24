import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { CASE } from '../case/manifest'
import { useUnlock } from '../lib/UnlockContext'
import { useAuth } from '../lib/AuthContext'
import { hasSupabase, getRomanceStatus, type RomanceStatus } from '../lib/supabase'
import AppWindow from './AppWindow'
import VoteForm from './VoteForm'
import ResultsView from './ResultsView'
import KillerReveal from './KillerReveal'

// Romansaiansa-gate: dag 1 krever profil, dag 2 krever ferdig swiping (kun for
// deltakere med profil). Blokkert → vis vei til Romansaiansa i stedet for skjema.
// Kun UX — submit_vote håndhever det samme server-side.
function VoteGate({ day, children }: { day: number; children: ReactNode }) {
  const navigate = useNavigate()
  const [status, setStatus] = useState<RomanceStatus | null>(null)

  useEffect(() => {
    if (!hasSupabase || (day !== 1 && day !== 2)) return
    getRomanceStatus().then(setStatus)
  }, [day])

  // Ingen gate i demo, eller for dag 3/4.
  if (!hasSupabase || (day !== 1 && day !== 2)) return <>{children}</>
  if (status === null) return <p className="notice">Sjekker Romansaiansa …</p>

  let blocked: string | null = null
  if (day === 1 && !status.hasProfile) {
    blocked = 'Du må lage en Romansaiansa-profil (selfie + mini-quiz) for å stemme på dag 1.'
  } else if (day === 2 && status.hasProfile && !status.swipeComplete) {
    blocked = `Du må swipe ferdig i Romansaiansa (${status.swipedCount}/${status.deckTotal}) for å stemme på dag 2.`
  }
  if (!blocked) return <>{children}</>

  return (
    <div className="panel">
      <p style={{ marginTop: 0 }}>💔 {blocked}</p>
      <button className="btn btn--primary" onClick={() => navigate('/romansaiansa')}>
        Åpne Romansaiansa 🔥
      </button>
    </div>
  )
}

export default function PoliceApp() {
  const { unlockedDays, isUnlocked, loading } = useUnlock()
  const { user } = useAuth()

  // Synlige faner = åpne dager. Standardfane = siste åpne dag.
  const visibleDays = useMemo(
    () => CASE.days.filter((d) => unlockedDays.includes(d.day)),
    [unlockedDays],
  )
  const [tab, setTab] = useState<number | null>(null)
  const activeDay = tab ?? visibleDays[visibleDays.length - 1]?.day ?? 1
  const dayContent = CASE.days.find((d) => d.day === activeDay)

  if (loading) {
    return (
      <AppWindow title="POLITI" icon="🚓" variant="police">
        <p className="notice">Kobler til … </p>
      </AppWindow>
    )
  }

  if (!user) {
    // Skal ikke skje bak innloggingsveggen, men vær defensiv.
    return (
      <AppWindow title="POLITI" icon="🚓" variant="police">
        <p className="notice">Du må være innlogget for å bruke POLITI-appen.</p>
      </AppWindow>
    )
  }

  return (
    <AppWindow title="POLITI" icon="🚓" variant="police">
      <div className="police">
        <p style={{ marginTop: 0, fontSize: '0.85rem' }}>
          Innlogget som <strong>{user.displayName}</strong>
        </p>

        {visibleDays.length > 1 && (
          <div className="tabs">
            {visibleDays.map((d) => (
              <button
                key={d.day}
                className={`tab ${d.day === activeDay ? 'tab--active' : ''}`}
                onClick={() => setTab(d.day)}
              >
                {d.title}
              </button>
            ))}
          </div>
        )}

        {!dayContent ? (
          <p className="notice">Ingen åpne dager ennå.</p>
        ) : !isUnlocked(dayContent.day) ? (
          <p className="notice">{dayContent.title} er ikke åpnet ennå.</p>
        ) : dayContent.day === 4 ? (
          <KillerReveal day3={CASE.days.find((d) => d.day === 3)} />
        ) : (
          <>
            <h2>{dayContent.title}</h2>
            {dayContent.question && (
              <VoteGate day={dayContent.day}>
                <VoteForm key={dayContent.day} day={dayContent} />
              </VoteGate>
            )}
            <hr style={{ margin: '20px 0', borderColor: 'var(--shadow)' }} />
            <h3>Resultater</h3>
            <ResultsView day={dayContent} />
          </>
        )}
      </div>
    </AppWindow>
  )
}

