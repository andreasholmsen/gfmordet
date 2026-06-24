import { useMemo, useState } from 'react'
import { CASE } from '../case/manifest'
import { useUnlock } from '../lib/UnlockContext'
import { getPlayer, type Player } from '../lib/player'
import AppWindow from './AppWindow'
import NamePrompt from './NamePrompt'
import VoteForm from './VoteForm'
import ResultsView from './ResultsView'
import Markdown from './Markdown'

export default function PoliceApp() {
  const { unlockedDays, isUnlocked, loading } = useUnlock()
  const [player, setPlayer] = useState<Player | null>(getPlayer())

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
      <AppWindow title="POLITI" icon="🚓">
        <p className="notice">Kobler til … </p>
      </AppWindow>
    )
  }

  if (!player) {
    return (
      <AppWindow title="POLITI" icon="🚓">
        <NamePrompt onDone={setPlayer} />
      </AppWindow>
    )
  }

  return (
    <AppWindow title="POLITI" icon="🚓">
      <div className="police">
        <p style={{ marginTop: 0, fontSize: '0.85rem' }}>
          Innlogget som <strong>{player.displayName}</strong>
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
          <Day4Reveal />
        ) : (
          <>
            <h2>{dayContent.title}</h2>
            {dayContent.question && <VoteForm day={dayContent} player={player} />}
            <hr style={{ margin: '20px 0', borderColor: 'var(--shadow)' }} />
            <h3>Resultater</h3>
            <ResultsView day={dayContent} />
          </>
        )}
      </div>
    </AppWindow>
  )
}

function Day4Reveal() {
  return (
    <div>
      <h2>🔍 {CASE.solution.headline}</h2>
      <Markdown source={CASE.solution.body} />
      <hr style={{ margin: '20px 0', borderColor: 'var(--shadow)' }} />
      <h3>Slik gjettet dere</h3>
      {CASE.days
        .filter((d) => d.question)
        .map((d) => (
          <div key={d.day} style={{ marginBottom: 18 }}>
            <p style={{ fontWeight: 'bold', marginBottom: 6 }}>
              {d.title}: {d.question!.prompt}
            </p>
            <ResultsView day={d} />
          </div>
        ))}
    </div>
  )
}
