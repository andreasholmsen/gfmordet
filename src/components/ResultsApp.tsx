import { useEffect, useState } from 'react'
import { CASE, type DayContent, type Question } from '../case/manifest'
import {
  getCheatFlags,
  getLiveFreeText,
  getLiveResults,
  hasSupabase,
  type LarryRow,
  type ResultRow,
} from '../lib/supabase'
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
  // Ark-faner: én per dag + «Larry» (hvem takket ja til Larrys «hjelp»).
  const [tab, setTab] = useState<number | 'larry'>(days[0]?.day ?? 1)
  const isLarry = tab === 'larry'
  const day = days.find((d) => d.day === tab) ?? days[0]
  const [rows, setRows] = useState<ResultRow[] | null>(null)
  const [larry, setLarry] = useState<LarryRow[] | null>(null)
  const [theories, setTheories] = useState<string[] | null>(null)
  const [animate, setAnimate] = useState(false)

  // En dags stemmer holdes tilbake til dagen ETTER har åpnet — samme regel som
  // resultatene i POLITI-appen (dag 1 frigis når dag 2 slippes). Gjelder alle
  // dager, ikke bare dag 1, ellers lekker Excel dag 2/3 på samme måte.
  const nextDay = days.find((d) => d.day === day.day + 1)
  const released = !nextDay || isUnlocked(nextDay.day)

  useEffect(() => {
    if (isLarry) return
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
  }, [day, released, isLarry])

  // KUN I DEV (`npm run dev`): hent fritekst-teoriene LIVE (uten tidslås) så
  // eieren kan følge med underveis. `import.meta.env.DEV` er false i prod-bygget
  // og hele blokken fjernes av bundleren — spillerne kan aldri se dette.
  const isFreeText = day.question?.type === 'free_text'
  useEffect(() => {
    if (!import.meta.env.DEV || isLarry || !isFreeText) return
    let alive = true
    setTheories(null)
    if (!hasSupabase) {
      setTheories(['(demo) Sommelieren gjorde det med isbiten', '(demo) Hun ble skremt til døde'])
    } else {
      getLiveFreeText(day.day).then((t) => alive && setTheories(t))
    }
    return () => {
      alive = false
    }
  }, [day, isLarry, isFreeText])

  // Larry-arket: hentes hver gang fanen åpnes (liten liste, alltid fersk).
  useEffect(() => {
    if (!isLarry) return
    let alive = true
    setLarry(null)
    if (!hasSupabase) {
      setLarry([
        { name: 'Demo-etterforsker', at: new Date().toISOString() },
        { name: 'Agent Testesen', at: new Date().toISOString() },
      ])
    } else {
      getCheatFlags().then((r) => alive && setLarry(r))
    }
    return () => {
      alive = false
    }
  }, [isLarry])

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
            {isLarry || released ? `Live${!hasSupabase ? ' · demo-tall' : ''}` : 'Låst'}
          </span>
        </div>

        <div className="excel__content">
          {isLarry ? (
            larry === null ? (
              <p className="notice">Laster …</p>
            ) : larry.length === 0 ? (
              <p className="notice">Ingen har takket ja til Larry ennå. 👽</p>
            ) : (
              <table className="excel-grid">
                <thead>
                  <tr>
                    <th className="excel-grid__corner" />
                    <th>A</th>
                    <th>B</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="excel-grid__headrow">
                    <td className="excel-grid__rownum">1</td>
                    <td>Takket ja til Larry 👽</td>
                    <td>Tidspunkt</td>
                  </tr>
                  {larry.map((r, i) => (
                    <tr key={i}>
                      <td className="excel-grid__rownum">{i + 2}</td>
                      <td>{r.name}</td>
                      <td className="excel-grid__num">
                        {new Date(r.at).toLocaleString('nb-NO', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                  <tr className="excel-grid__totalrow">
                    <td className="excel-grid__rownum">{larry.length + 2}</td>
                    <td>Totalt</td>
                    <td className="excel-grid__num">{larry.length}</td>
                  </tr>
                </tbody>
              </table>
            )
          ) : !released ? (
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

          {/* KUN I DEV: live fritekst-teorier, én per rad. Renderes aldri i
              prod-bygget (import.meta.env.DEV er false og koden fjernes). */}
          {import.meta.env.DEV && !isLarry && isFreeText && (
            <div style={{ marginTop: 16 }}>
              <p className="notice">
                🛠️ Dev-visning: {theories === null ? 'laster teorier …' : `${theories.length} teorier (live, uten tidslås)`}
              </p>
              {theories !== null && theories.length > 0 && (
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
              )}
            </div>
          )}
        </div>

        {/* Ark-faner nederst, som i Excel */}
        <div className="excel__sheets">
          {days.map((d) => (
            <button
              key={d.day}
              className={`excel__sheet ${d.day === tab ? 'excel__sheet--active' : ''}`}
              onClick={() => setTab(d.day)}
            >
              {d.title}
            </button>
          ))}
          <button
            className={`excel__sheet ${isLarry ? 'excel__sheet--active' : ''}`}
            onClick={() => setTab('larry')}
          >
            Larry 👽
          </button>
        </div>
      </div>
    </AppWindow>
  )
}
