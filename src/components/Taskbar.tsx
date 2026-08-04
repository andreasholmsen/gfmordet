import { useEffect, useState } from 'react'
import { CASE } from '../case/manifest'
import { useUnlock } from '../lib/UnlockContext'
import { useT } from '../lib/i18n'

function two(n: number): string {
  return String(n).padStart(2, '0')
}

export default function Taskbar() {
  const { unlockedDays } = useUnlock()
  const t = useT()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const clock = new Date(now)
  const clockLabel = `${two(clock.getHours())}:${two(clock.getMinutes())}:${two(clock.getSeconds())}`

  return (
    <nav className="taskbar" aria-label="Oppgavelinje">
      {/* Spillet er over — ingen nedtelling eller innlogging lenger. Statusen
          viser progresjonen (svar på dagens spørsmål låser opp neste dag). */}
      <div className="taskbar__status">
        <span>{t('dayStatus', { n: unlockedDays.length, total: CASE.days.length })}</span>
      </div>

      <span className="taskbar__clock" aria-hidden>
        {clockLabel}
      </span>
    </nav>
  )
}
