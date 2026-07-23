import { useMemo, useState } from 'react'
import { CASE } from '../case/manifest'
import { useUnlock } from '../lib/UnlockContext'
import { useAuth } from '../lib/AuthContext'
import AppWindow from './AppWindow'
import VoteForm from './VoteForm'
import ResultsView from './ResultsView'
import KillerReveal from './KillerReveal'

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
              <VoteForm key={dayContent.day} day={dayContent} />
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

