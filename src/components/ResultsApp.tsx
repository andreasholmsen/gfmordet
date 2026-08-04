import { useEffect, useState } from 'react'
import { CASE, type Question } from '../case/manifest'
import { FINAL_RESULTS, FINAL_FREE_TEXT } from '../case/results'
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

export default function ResultsApp() {
  const days = CASE.days
  const { isUnlocked } = useUnlock()
  // Ark-faner: én per dag MED avstemning (dag 4 har ingen og får ikke ark).
  const voteDays = days.filter((d) => d.question)
  const [tab, setTab] = useState<number>(voteDays[0]?.day ?? 1)
  const day = days.find((d) => d.day === tab) ?? days[0]
  const [animate, setAnimate] = useState(false)

  // En dags stemmetall holdes tilbake til dagen ETTER er låst opp — samme
  // progresjonsregel som fasiten i POLITI-appen: du skal ikke kunne se hva
  // flertallet stemte før du selv har svart.
  const nextDay = days.find((d) => d.day === day.day + 1)
  const released = !nextDay || isUnlocked(nextDay.day)

  // Tallene er de EKTE slutt-tallene fra spillet (bakt inn i src/case/results.ts).
  const rows = released ? (FINAL_RESULTS[day.day] ?? []) : []
  const theories = released ? (FINAL_FREE_TEXT[day.day] ?? []) : []
  const isFreeText = day.question?.type === 'free_text'

  // Animer stolpene inn etter første maling (og på nytt ved fanebytte).
  useEffect(() => {
    setAnimate(false)
    const id = window.setTimeout(() => setAnimate(true), 60)
    return () => window.clearTimeout(id)
  }, [day])

  const opts = optionsOf(day.question)
  const total = rows.reduce((s, r) => s + r.n, 0)

  // Bygg stolpene: alle alternativer (farge etter fast indeks) + evt. ekstra
  // choices som finnes i data men ikke i alternativlista.
  const countFor = (id: string) => rows.find((r) => r.choice === id)?.n ?? 0
  const known = new Set(opts.map((o) => o.id))
  const bars = [
    ...opts.map((o, i) => ({
      id: o.id,
      label: o.label,
      color: PALETTE[i % PALETTE.length],
      n: countFor(o.id),
    })),
    ...rows
      .filter((r) => !known.has(r.choice) && r.choice !== '(fritekst)')
      .map((r) => ({ id: r.choice, label: r.choice, color: '#9aa0a6', n: r.n })),
  ].sort((a, b) => b.n - a.n)

  return (
    <AppWindow title="Resultater.xlsx – Excel" icon="📊" variant="excel">
      <div className="excel">
        <div className="excel__ribbon">
          <span className="excel__file">📊 Resultater.xlsx</span>
          <span className="excel__hint">{released ? 'Slutt-tall fra spillet' : 'Låst'}</span>
        </div>

        <div className="excel__content">
          {!released ? (
            <p className="notice">
              🔒 Stemmetallene for {day.title} vises når du har svart på dagens spørsmål i
              POLITI-appen — du skal ikke kunne se hva de andre stemte før du har svart selv.
            </p>
          ) : !day.question ? (
            <p className="notice">Ingen avstemning på denne dagen.</p>
          ) : isFreeText ? (
            <>
              <p className="notice notice--ok">
                {theories.length} teorier ble sendt inn under spillet:
              </p>
              <table className="excel-grid">
                <thead>
                  <tr>
                    <th className="excel-grid__corner" />
                    <th>A</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="excel-grid__headrow">
                    <td className="excel-grid__rownum">1</td>
                    <td>Teori</td>
                  </tr>
                  {theories.map((t, i) => (
                    <tr key={i}>
                      <td className="excel-grid__rownum">{i + 2}</td>
                      <td>{t}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : total === 0 ? (
            <p className="notice">Ingen stemmer på denne dagen.</p>
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
                <div className="excel-chart__title">{day.question!.prompt}</div>
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

        {/* Ark-faner nederst, som i Excel — kun dager med avstemning */}
        <div className="excel__sheets">
          {voteDays.map((d) => (
            <button
              key={d.day}
              className={`excel__sheet ${d.day === tab ? 'excel__sheet--active' : ''}`}
              onClick={() => setTab(d.day)}
            >
              {d.title}
            </button>
          ))}
        </div>
      </div>
    </AppWindow>
  )
}
