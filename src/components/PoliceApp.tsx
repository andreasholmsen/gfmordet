import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CASE, type DayContent } from '../case/manifest'
import { useUnlock } from '../lib/UnlockContext'
import { useAuth } from '../lib/AuthContext'
import { getMyVote } from '../lib/votes'
import AppWindow from './AppWindow'
import Markdown from './Markdown'
import VoteForm from './VoteForm'
import KillerReveal from './KillerReveal'

// Tydelig sperre når dagens avstemning er stengt (en nyere dag har åpnet) —
// så ingen prøver å stemme på feil dag. Viser hva man svarte, og peker til
// dagen som faktisk gjelder. (Server-siden håndhever det samme uansett.)
function VoteClosed({
  day,
  currentDay,
  onGoToCurrent,
}: {
  day: DayContent
  currentDay: number
  onGoToCurrent: () => void
}) {
  const q = day.question
  const saved = getMyVote(day.day)
  const answerLabel = (() => {
    if (!q || !saved) return null
    if (q.type === 'free_text') return saved.freeText
    const opt = 'options' in q ? q.options.find((o) => o.id === saved.choice) : undefined
    const base = opt?.label ?? saved.choice ?? ''
    if (q.type === 'mc_with_other' && saved.choice === q.otherOptionId && saved.freeText) {
      return `${base}: ${saved.freeText}`
    }
    return base
  })()

  return (
    <div className="vote-closed">
      <span className="vote-closed__lock" aria-hidden>
        🔒
      </span>
      <p className="vote-closed__title">Avstemningen for {day.title} er STENGT</p>
      {answerLabel ? (
        <p className="vote-closed__answer">
          Du svarte: <strong>{answerLabel}</strong>
        </p>
      ) : (
        // Gjelder også for dem som kom sent til spillet: de skal skjønne at de
        // fortsatt kan være med videre, ikke at de har mistet toget.
        <p className="vote-closed__answer">
          Du svarte ikke på dette spørsmålet. Det er helt greit — les fasiten over, så er du
          klar for dagens spørsmål.
        </p>
      )}
      <p className="vote-closed__now">
        Det er <strong>Dag {currentDay}</strong> som gjelder nå.
      </p>
      <button className="btn btn--primary" onClick={onGoToCurrent}>
        Gå til Dag {currentDay} →
      </button>
    </div>
  )
}

// Har spilleren åpnet dagens briefing (nytt avhør)? Huskes per enhet.
const briefingKey = (day: number) => `gfm:politi-briefing:${day}`
function briefingRead(day: number): boolean {
  try {
    return localStorage.getItem(briefingKey(day)) === '1'
  } catch {
    return false
  }
}

export default function PoliceApp() {
  const { unlockedDays, isUnlocked, loading, demo } = useUnlock()
  const { user } = useAuth()
  const navigate = useNavigate()
  // Åpnet briefing (per dag). State så spørsmålet dukker opp umiddelbart.
  const [readDays, setReadDays] = useState<Record<number, boolean>>({})
  // Åpen briefing-visning (dagen den gjelder), eller null.
  const [openBriefing, setOpenBriefing] = useState<number | null>(null)

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

        {CASE.suspects && CASE.suspects.length > 0 && (
          <button
            className="btn"
            style={{ marginBottom: 14 }}
            onClick={() => navigate('/mistenkte')}
          >
            📌 Åpne Mistenkte-tavla
          </button>
        )}

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

            {/* Nytt avhør som må leses før dagens spørsmål vises. */}
            {dayContent.briefing &&
              (openBriefing === dayContent.day ? (
                <div className="briefing">
                  <button className="btn" onClick={() => setOpenBriefing(null)}>
                    ← Tilbake
                  </button>
                  <div className="briefing__body">
                    <Markdown source={dayContent.briefing.body} />
                  </div>
                </div>
              ) : (
                <div className="briefing__teaser">
                  {dayContent.briefing.intro && (
                    <div className="briefing__lead">
                      <Markdown source={dayContent.briefing.intro} />
                    </div>
                  )}
                  <button
                    className="btn btn--primary"
                    onClick={() => {
                      const d = dayContent.day
                      try {
                        localStorage.setItem(briefingKey(d), '1')
                      } catch {
                        /* privat modus e.l. — gjelder bare denne økten */
                      }
                      setReadDays((r) => ({ ...r, [d]: true }))
                      setOpenBriefing(d)
                    }}
                  >
                    📄 {dayContent.briefing.title}
                  </button>
                </div>
              ))}

            {/* Spørsmålet holdes tilbake til briefingen er åpnet. */}
            {/* Mens avhøret leses vises ikke spørsmålet — én ting av gangen. */}
            {dayContent.briefing &&
              openBriefing !== dayContent.day &&
              !(readDays[dayContent.day] || briefingRead(dayContent.day)) && (
                <p className="notice" style={{ marginTop: 14 }}>
                  🔒 Dagens spørsmål åpnes når du har lest avhøret over.
                </p>
              )}

            {dayContent.question &&
              openBriefing !== dayContent.day &&
              (!dayContent.briefing ||
                readDays[dayContent.day] ||
                briefingRead(dayContent.day)) &&
              // Stemming stenger når neste dag åpner. (Hoppes over i demo/dev,
              // der alle dager er kunstig åpne samtidig.) Da vises dagens FASIT
              // (`reveal`) — samtidig som stemmetallene frigis i Excel.
              (!demo && !import.meta.env.DEV && isUnlocked(dayContent.day + 1) ? (
                <>
                  {dayContent.reveal && (
                    <div className="day-reveal">
                      <Markdown source={dayContent.reveal} />
                    </div>
                  )}
                  <VoteClosed
                    day={dayContent}
                    currentDay={Math.max(...unlockedDays)}
                    onGoToCurrent={() => setTab(Math.max(...unlockedDays))}
                  />
                </>
              ) : (
                <VoteForm key={dayContent.day} day={dayContent} />
              ))}
            {/* Resultater vises IKKE her — de ligger i Excel-appen (/resultater). */}
          </>
        )}
      </div>
    </AppWindow>
  )
}

