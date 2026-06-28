import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CASE } from '../case/manifest'
import { useUnlock } from '../lib/UnlockContext'
import { useSettings } from '../lib/SettingsContext'
import { getSchedule, type Schedule } from '../lib/supabase'
import { sfx } from '../lib/sfx'

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
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [now, setNow] = useState(() => Date.now())

  // Hent tidsplanen én gang (null i demo / hvis RPC-en ikke finnes).
  useEffect(() => {
    let alive = true
    getSchedule().then((s) => alive && setSchedule(s))
    return () => {
      alive = false
    }
  }, [])

  // Tikk hvert sekund.
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

      <span className="taskbar__clock" aria-hidden>
        {clockLabel}
      </span>
    </nav>
  )
}
