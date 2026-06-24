import { useEffect, useState } from 'react'
import type { DayContent } from '../case/manifest'
import { getFreeText, getResults, type ResultRow } from '../lib/supabase'

// Bygger id->label for flervalg slik at resultatene viser lesbare navn.
function labelMap(day: DayContent): Record<string, string> {
  const q = day.question
  if (q && (q.type === 'multiple_choice' || q.type === 'mc_with_other')) {
    return Object.fromEntries(q.options.map((o) => [o.id, o.label]))
  }
  return {}
}

export default function ResultsView({ day }: { day: DayContent }) {
  const [rows, setRows] = useState<ResultRow[] | null>(null)
  const [texts, setTexts] = useState<string[]>([])
  const isFreeText = day.question?.type === 'free_text'

  useEffect(() => {
    let alive = true
    getResults(day.day).then((r) => alive && setRows(r))
    if (isFreeText) getFreeText(day.day).then((t) => alive && setTexts(t))
    return () => {
      alive = false
    }
  }, [day.day, isFreeText])

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

  return (
    <div className="results">
      {sorted.map((r) => {
        const pct = Math.round((r.n / total) * 100)
        return (
          <div key={r.choice} className="result-row">
            <div className="result-row__label">
              <span>{labels[r.choice] ?? r.choice}</span>
              <span>
                {r.n} ({pct}%)
              </span>
            </div>
            <div className="result-bar">
              <div className="result-bar__fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
