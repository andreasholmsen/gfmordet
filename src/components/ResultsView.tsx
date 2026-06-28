import { useEffect, useState } from 'react'
import type { DayContent } from '../case/manifest'
import { getFreeText, getResults, type ResultRow } from '../lib/supabase'
import { getMyVote } from '../lib/votes'

// Bygger id->label for flervalg slik at resultatene viser lesbare navn.
function labelMap(day: DayContent): Record<string, string> {
  const q = day.question
  if (
    q &&
    (q.type === 'multiple_choice' || q.type === 'mc_with_other' || q.type === 'image_choice')
  ) {
    return Object.fromEntries(q.options.map((o) => [o.id, o.label]))
  }
  return {}
}

export default function ResultsView({ day }: { day: DayContent }) {
  const [rows, setRows] = useState<ResultRow[] | null>(null)
  const [texts, setTexts] = useState<string[]>([])
  const [animate, setAnimate] = useState(false)
  const isFreeText = day.question?.type === 'free_text'
  const myVote = getMyVote(day.day)

  useEffect(() => {
    let alive = true
    getResults(day.day).then((r) => alive && setRows(r))
    if (isFreeText) getFreeText(day.day).then((t) => alive && setTexts(t))
    return () => {
      alive = false
    }
  }, [day.day, isFreeText])

  // Trigger bar-animasjonen etter at radene er malt første gang.
  useEffect(() => {
    if (rows && rows.length > 0) {
      const id = window.setTimeout(() => setAnimate(true), 60)
      return () => window.clearTimeout(id)
    }
  }, [rows])

  if (rows === null) return <p className="notice">Laster resultater …</p>

  // Tomt = resultatene er ikke frigitt ennå (serveren holder dem tilbake).
  if (rows.length === 0 && texts.length === 0) {
    return (
      <p className="notice">
        Resultatene for {day.title.toLowerCase()} blir synlige dagen etter avstemningen.
      </p>
    )
  }

  if (isFreeText) {
    return (
      <div>
        <p className="notice">{texts.length} teorier ble sendt inn:</p>
        <ul style={{ paddingLeft: 18 }}>
          {texts.map((t, i) => (
            <li key={i} style={{ marginBottom: 6 }}>
              {t}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const labels = labelMap(day)
  const total = rows.reduce((s, r) => s + r.n, 0) || 1
  const sorted = [...rows].sort((a, b) => b.n - a.n)
  const topChoice = sorted[0]?.choice

  // Fant vi spillerens egen stemme blant resultatene?
  const mine = myVote?.choice ? rows.find((r) => r.choice === myVote.choice) : undefined
  const minePct = mine ? Math.round((mine.n / total) * 100) : 0

  return (
    <div className="results">
      {mine && (
        <p className="notice notice--ok results__mine-note">
          Du stemte <strong>{labels[myVote!.choice!] ?? myVote!.choice}</strong> — det gjorde{' '}
          {minePct} % av etterforskerne ({mine.n} stk).
        </p>
      )}
      {sorted.map((r) => {
        const pct = Math.round((r.n / total) * 100)
        const isMine = myVote?.choice === r.choice
        const isTop = r.choice === topChoice
        return (
          <div
            key={r.choice}
            className={`result-row ${isMine ? 'result-row--mine' : ''} ${
              isTop ? 'result-row--top' : ''
            }`}
          >
            <div className="result-row__label">
              <span>
                {isTop && <span aria-hidden>👑 </span>}
                {labels[r.choice] ?? r.choice}
                {isMine && <span className="result-row__you"> (din stemme)</span>}
              </span>
              <span>
                {r.n} ({pct}%)
              </span>
            </div>
            <div className="result-bar">
              <div className="result-bar__fill" style={{ width: animate ? `${pct}%` : '0%' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
