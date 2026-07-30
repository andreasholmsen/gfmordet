import { useEffect, useState } from 'react'
import { CASE, type DayContent, type Question } from '../case/manifest'
import { getLiveResults, hasSupabase, type ResultRow } from '../lib/supabase'
import { useUnlock } from '../lib/UnlockContext'
import AppWindow from './AppWindow'

// Distinkte farger per alternativ (fungerer med mange mistenkte, også på mobil).
const PALETTE = [
  '#e63946', '#f4a261', '#2a9d8f', '#457b9d', '#9b5de5', '#f15bb5',
  '#00bbf9', '#8ac926', '#ff924c', '#ffca3a', '#c81d25', '#6a4c93',
]

function optionsOf(q: Question | undefined) {
  if (
    q &&
    (q.type === 'multiple_choice' || q.type === 'mc_with_other' || q.type === 'image_choice')
  ) {
    return q.options
  }
  return []
}

// Demo-data (KUN uten Supabase) så diagrammet er synlig under utvikling.
function demoRows(day: DayContent): ResultRow[] {
  if (day.question?.type === 'free_text') return [{ choice: '(fritekst)', n: 23 }]
  return optionsOf(day.question).map((o, i) => ({ choice: o.id, n: Math.max(2, 37 - i * 8) }))
}

export default function ResultsApp() {
  const days = CASE.days
  const { isUnlocked } = useUnlock()
  const [dayNum, setDayNum] = useState<number>(days[0]?.day ?? 1)
  const day = days.find((d) => d.day === dayNum) ?? days[0]
  const [rows, setRows] = useState<ResultRow[] | null>(null)
  const [animate, setAnimate] = useState(false)

  // En dags stemmer holdes tilbake til dagen ETTER har åpnet — samme regel som
  // resultatene i POLITI-appen (dag 1 frigis når dag 2 slippes). Gjelder alle
  // dager, ikke bare dag 1, ellers lekker Excel dag 2/3 på samme måte.
  const nextDay = days.find((d) => d.day === day.day + 1)
  const released = !nextDay || isUnlocked(nextDay.day)

  useEffect(() => {
    let alive = true
    setRows(null)
    setAnimate(false)
    if (!released) return // ikke hent tall vi ikke får vise
    if (!hasSupabase) {
      setRows(demoRows(day)) // demo-modus: syntetiske tall
    } else {
      getLiveResults(day.day).then((r) => alive && setRows(r))
    }
    return () => {
      alive = false
    }
  }, [day, released])

  // Animer stolpene inn etter første maling.
  useEffect(() => {
    if (rows && rows.length > 0) {
      const id = window.setTimeout(() => setAnimate(true), 60)
      return () => window.clearTimeout(id)
    }
  }, [rows])

  const opts = optionsOf(day.question)
  const total = (rows ?? []).reduce((s, r) => s + r.n, 0)

  // Bygg stolpene: alle alternativer (farge etter fast indeks) + evt. ekstra
  // choices som finnes i data men ikke i alternativlista.
  const countFor = (id: string) => rows?.find((r) => r.choice === id)?.n ?? 0
  const known = new Set(opts.map((o) => o.id))
  const bars = [
    ...opts.map((o, i) => ({
      id: o.id,
      label: o.label,
      color: PALETTE[i % PALETTE.length],
      n: countFor(o.id),
    })),
    ...(rows ?? [])
      .filter((r) => !known.has(r.choice) && r.choice !== '(fritekst)')
      .map((r) => ({ id: r.choice, label: r.choice, color: '#9aa0a6', n: r.n })),
  ].sort((a, b) => b.n - a.n)

  return (
    <AppWindow title="Resultater.xlsx – Excel" icon="📊" variant="excel">
      <div className="excel">
        <div className="excel__ribbon">
          <span className="excel__file">📊 Resultater.xlsx</span>
          <span className="excel__hint">
            {released ? `Live${!hasSupabase ? ' · demo-tall' : ''}` : 'Låst'}
          </span>
        </div>

        <div className="excel__content">
          {!released ? (
            <p className="notice">
              🔒 Avstemningen for {day.title} vises når {nextDay!.title} åpner. Tallene
              offentliggjøres først når dagen er over — ingen skal kunne se hva de andre har
              stemt underveis.
            </p>
          ) : rows === null ? (
            <p className="notice">Laster …</p>
          ) : !day.question ? (
            <p className="notice">Ingen avstemning på denne dagen.</p>
          ) : day.question.type === 'free_text' ? (
            <p className="notice notice--ok">{total} teorier sendt inn så langt.</p>
          ) : total === 0 ? (
            <p className="notice">Ingen stemmer ennå.</p>
          ) : (
            <>
              {/* Regneark-rutenett (kolonnebokstaver + radnummer) */}
              <table className="excel-grid">
                <thead>
                  <tr>
                    <th className="excel-grid__corner" />
                    <th>A</th>
                    <th>B</th>
                    <th>C</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="excel-grid__headrow">
                    <td className="excel-grid__rownum">1</td>
                    <td>Alternativ</td>
                    <td>Stemmer</td>
                    <td>Andel</td>
                  </tr>
                  {bars.map((b, i) => (
                    <tr key={b.id}>
                      <td className="excel-grid__rownum">{i + 2}</td>
                      <td>
                        <span
                          className="excel-grid__swatch"
                          style={{ background: b.color }}
                          aria-hidden
                        />
                        {b.label}
                      </td>
                      <td className="excel-grid__num">{b.n}</td>
                      <td className="excel-grid__num">{Math.round((b.n / total) * 100)} %</td>
                    </tr>
                  ))}
                  <tr className="excel-grid__totalrow">
                    <td className="excel-grid__rownum">{bars.length + 2}</td>
                    <td>Totalt</td>
                    <td className="excel-grid__num">{total}</td>
                    <td className="excel-grid__num">100 %</td>
                  </tr>
                </tbody>
              </table>

              {/* Innebygd diagram (Excel-stil stolpediagram) */}
              <div className="excel-chart">
                <div className="excel-chart__title">{day.question.prompt}</div>
                <div className="excel-chart__plot">
                  {bars.map((b) => {
                    const pct = Math.round((b.n / total) * 100)
                    return (
                      <div className="excel-bar" key={b.id}>
                        <span className="excel-bar__cat" title={b.label}>
                          {b.label}
                        </span>
                        <span className="excel-bar__track">
                          <span
                            className="excel-bar__fill"
                            style={{ width: animate ? `${pct}%` : '0%', background: b.color }}
                          />
                          <span className="excel-bar__val">{b.n}</span>
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Ark-faner nederst, som i Excel */}
        <div className="excel__sheets">
          {days.map((d) => (
            <button
              key={d.day}
              className={`excel__sheet ${d.day === dayNum ? 'excel__sheet--active' : ''}`}
              onClick={() => setDayNum(d.day)}
            >
              {d.title}
            </button>
          ))}
        </div>
      </div>
    </AppWindow>
  )
}
