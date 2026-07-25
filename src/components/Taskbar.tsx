import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CASE } from '../case/manifest'
import { useUnlock } from '../lib/UnlockContext'
import { useSettings } from '../lib/SettingsContext'
import { useAuth } from '../lib/AuthContext'
import { getSchedule, type Schedule } from '../lib/supabase'
import { sfx } from '../lib/sfx'
import Dialog from './Dialog'

function two(n: number): string {
  return String(n).padStart(2, '0')
}

// Finn neste dag som ennå ikke er åpnet, og når den åpner.
function nextUnlock(schedule: Schedule, nowMs: number): { day: number; at: number } | null {
  let best: { day: number; at: number } | null = null
  for (const [day, at] of Object.entries(schedule.releaseAt)) {
    if (at > nowMs && (!best || at < best.at)) best = { day: Number(day), at }
  }
  return best
}

export default function Taskbar() {
  const navigate = useNavigate()
  const { unlockedDays, refresh, demo } = useUnlock()
  const { muted, toggleMuted } = useSettings()
  const { user, signOut } = useAuth()
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [confirmLogout, setConfirmLogout] = useState(false)

  // Hent tidsplanen én gang (null i demo / hvis RPC-en ikke finnes).
  useEffect(() => {
    let alive = true
    getSchedule().then((s) => alive && setSchedule(s))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  // Serverkorrigert «nå».
  const serverNow = now + (schedule?.offsetMs ?? 0)
  const next = schedule ? nextUnlock(schedule, serverNow) : null

  // Når nedtellingen passerer null: hent åpne dager på nytt så mappen låses opp
  // (kun én gang per måltidspunkt).
  const refreshedFor = useRef<number | null>(null)
  useEffect(() => {
    if (next && serverNow >= next.at && refreshedFor.current !== next.at) {
      refreshedFor.current = next.at
      refresh()
    }
  }, [next, serverNow, refresh])

  const clock = new Date(now)
  const clockLabel = `${two(clock.getHours())}:${two(clock.getMinutes())}:${two(clock.getSeconds())}`

  let countdown: string | null = null
  if (next) {
    const left = Math.max(0, next.at - serverNow)
    const s = Math.floor(left / 1000)
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    countdown =
      h > 0
        ? `Dag ${next.day} åpner om ${h}t ${two(m)}m ${two(sec)}s`
        : `Dag ${next.day} åpner om ${two(m)}:${two(sec)}`
  }

  const openCount = unlockedDays.length

  return (
    <nav className="taskbar" aria-label="Oppgavelinje">
      <button
        className="taskbar__start"
        onClick={() => {
          sfx.click()
          navigate('/')
        }}
      >
        <span aria-hidden>🖥️</span> {CASE.title}
      </button>

      <div className="taskbar__status">
        {countdown ? (
          <span className="taskbar__countdown">{countdown}</span>
        ) : (
          <span>
            {demo ? 'Demo' : `Dag ${openCount} av ${CASE.days.length} åpen`}
          </span>
        )}
      </div>

      <button
        className="taskbar__mute"
        onClick={toggleMuted}
        aria-pressed={muted}
        aria-label={muted ? 'Slå på lyd' : 'Slå av lyd'}
        title={muted ? 'Slå på lyd' : 'Slå av lyd'}
      >
        {muted ? '🔇' : '🔊'}
      </button>

      {user && (
        <button
          className="taskbar__user"
          onClick={() => {
            sfx.click()
            setConfirmLogout(true) // bekreft først — ett klikk skal ikke logge ut
          }}
          title="Logg ut"
        >
          <span aria-hidden>👤</span> {user.displayName}
          <span className="taskbar__logout"> · Logg ut</span>
        </button>
      )}

      {confirmLogout && user && (
        <Dialog
          title="Logg ut"
          icon="👤"
          onClose={() => setConfirmLogout(false)}
          actions={
            <>
              <button className="btn" onClick={() => setConfirmLogout(false)}>
                Avbryt
              </button>
              <button
                className="btn btn--primary"
                onClick={() => {
                  setConfirmLogout(false)
                  void signOut()
                }}
              >
                Logg ut
              </button>
            </>
          }
        >
          <p style={{ marginTop: 0 }}>
            Er du sikker på at du vil logge ut, <strong>{user.displayName}</strong>?
          </p>
          <p style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: 0 }}>
            Stemmene dine er trygt lagret — du kan logge inn igjen når som helst.
          </p>
        </Dialog>
      )}

      <span className="taskbar__clock" aria-hidden>
        {clockLabel}
      </span>
    </nav>
  )
}
