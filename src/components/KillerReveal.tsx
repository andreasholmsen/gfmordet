import { useEffect, useRef, useState } from 'react'
import { CASE, type DayContent, type Suspect } from '../case/manifest'
import { assetUrl } from '../lib/assets'
import { markFasitSeen } from '../lib/fasit'
import { getMyVote } from '../lib/votes'
import { sfx } from '../lib/sfx'
import Markdown from './Markdown'
import PixelPortrait from './PixelPortrait'

type Phase = 'sealed' | 'decrypt' | 'lineup' | 'verdict' | 'dossier'

const DECRYPT_LINES = [
  'Kryssjekker alibier …',
  'Analyserer telefonlogg …',
  'Leser dørlogg, natt til 02.08 …',
  'Sporer partnerkonto hos Checkin …',
  'DEKRYPTERER BEVIS … 100%',
]

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Ett anklagekort (mistenkt) med valgfritt stempel.
function AccusedCard({ s, stamp }: { s: Suspect; stamp?: 'renvasket' | 'skyldig' | null }) {
  return (
    <article className={`suspect reveal-card ${stamp === 'skyldig' ? 'reveal-card--killer' : ''}`}>
      <div className="suspect__photo">
        {s.pixel ? (
          <PixelPortrait data={s.pixel} className="suspect__pixel" />
        ) : s.img ? (
          <img src={assetUrl(s.img)} alt={s.name} />
        ) : (
          <span className="suspect__initials" aria-hidden>
            {initials(s.name)}
          </span>
        )}
        {stamp && (
          <span className={`suspect__stamp suspect__stamp--${stamp} reveal-stamp`}>
            {stamp === 'skyldig' ? 'SKYLDIG' : 'RENVASKET'}
          </span>
        )}
      </div>
      <h2 className="suspect__name">{s.name}</h2>
      <p className="suspect__role">{s.role}</p>
    </article>
  )
}

export default function KillerReveal({ day3 }: { day3?: DayContent }) {
  const { solution, suspects } = CASE
  // Tilfeldig rekkefølge i line-upen (trekkes på nytt per åpning) — SKYLDIG-
  // kortet skal ikke alltid stå på samme plass i rutenettet.
  const [shuffled] = useState<Suspect[]>(() => shuffle(suspects ?? []))
  const killer = shuffled.find((s) => s.id === solution.killerId)
  const others = shuffled.filter((s) => s.id !== solution.killerId)
  // EGEN tilfeldig rekkefølge for RENVASKET-stemplingen, uavhengig av
  // visningsrekkefølgen — ellers ville stemplene gått pent fra øverst til
  // venstre mot nederst til høyre.
  const [stampOrder] = useState<string[]>(() =>
    shuffle((suspects ?? []).filter((s) => s.id !== solution.killerId).map((s) => s.id)),
  )

  // Uten mistenkte / uten treff på killerId: fall tilbake til enkel visning.
  const canStage = Boolean(killer)

  const [phase, setPhase] = useState<Phase>(canStage ? 'sealed' : 'dossier')
  const [decryptShown, setDecryptShown] = useState(0)
  const [clearedCount, setClearedCount] = useState(0) // hvor mange uskyldige er stemplet
  const timers = useRef<number[]>([])
  const reduce = prefersReducedMotion()

  function clearTimers() {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }
  useEffect(() => clearTimers, [])

  function runSequence() {
    clearTimers()
    setPhase('decrypt')
    setDecryptShown(0)
    setClearedCount(0)

    const step = reduce ? 320 : 850
    DECRYPT_LINES.forEach((_, i) => {
      timers.current.push(
        window.setTimeout(() => {
          setDecryptShown(i + 1)
          sfx.beep()
        }, step * (i + 1)),
      )
    })

    const gap = reduce ? 500 : 750
    const afterDecrypt = step * DECRYPT_LINES.length + gap
    timers.current.push(window.setTimeout(() => setPhase('lineup'), afterDecrypt))

    // Uskyldige stemples ett og ett.
    const stampStep = reduce ? 320 : 780
    others.forEach((_, i) => {
      timers.current.push(
        window.setTimeout(
          () => {
            setClearedCount(i + 1)
            sfx.beep()
          },
          afterDecrypt + gap + stampStep * (i + 1),
        ),
      )
    })

    const verdictAt = afterDecrypt + gap + stampStep * (others.length + 1) + 600
    timers.current.push(
      window.setTimeout(() => {
        setPhase('verdict')
        sfx.sting()
      }, verdictAt),
    )
    timers.current.push(
      window.setTimeout(() => {
        setPhase('dossier')
        sfx.granted()
      }, verdictAt + (reduce ? 1100 : 3000)),
    )
  }

  function skip() {
    clearTimers()
    setDecryptShown(DECRYPT_LINES.length)
    setClearedCount(others.length)
    setPhase('dossier')
  }

  // --- Enkel fallback (ingen mistenkte / killerId matcher ikke) --------------
  if (!canStage) {
    return <Dossier day3={day3} />
  }

  // --- Forseglet mappe -------------------------------------------------------
  if (phase === 'sealed') {
    return (
      <div className="reveal reveal__sealed">
        <div className="reveal__seal">SAK #2026-1738</div>
        <h2 className="reveal__sealed-title">SAKEN ER LØST</h2>
        <p className="reveal__sealed-sub">Bevisene er samlet. Er du klar for konklusjonen?</p>
        <button className="btn btn--primary reveal__open" onClick={runSequence}>
          🔓 ÅPNE SAKEN
        </button>
      </div>
    )
  }

  // --- Dekryptering ----------------------------------------------------------
  if (phase === 'decrypt') {
    return (
      <div className="reveal">
        <div className="reveal__decrypt">
          {DECRYPT_LINES.slice(0, decryptShown).map((line, i) => (
            <div key={i} className="reveal__decrypt-line">
              {line}
            </div>
          ))}
          <span className="reveal__cursor" aria-hidden />
        </div>
        <button className="reveal__skip" onClick={skip}>
          hopp over ›
        </button>
      </div>
    )
  }

  // --- Line-up + verdict -----------------------------------------------------
  if (phase === 'lineup' || phase === 'verdict') {
    const isVerdict = phase === 'verdict'
    return (
      <div className={`reveal ${isVerdict ? 'reveal--verdict' : ''}`}>
        <p className="reveal__lineup-title">
          {isVerdict ? 'Morderen er …' : 'Politiet renvasker de uskyldige …'}
        </p>
        <div className="reveal__lineup">
          {shuffled.map((s) => {
            if (s.id === solution.killerId) {
              return (
                <div
                  key={s.id}
                  className={`reveal__killer-slot ${isVerdict ? 'reveal__killer-slot--lit' : ''}`}
                >
                  <AccusedCard s={s} stamp={isVerdict ? 'skyldig' : null} />
                </div>
              )
            }
            // De uskyldige stemples i stampOrder-rekkefølge (tilfeldig person
            // hver gang), IKKE i visningsrekkefølge.
            const idx = stampOrder.indexOf(s.id)
            return <AccusedCard key={s.id} s={s} stamp={idx < clearedCount ? 'renvasket' : null} />
          })}
        </div>
        <button className="reveal__skip" onClick={skip}>
          hopp over ›
        </button>
      </div>
    )
  }

  // --- Dossier (fasit + personlig dom + statistikk + wink) -------------------
  return <Dossier day3={day3} />
}

// Selve konklusjonen. Egen komponent så fallback kan gjenbruke den.
function Dossier({ day3 }: { day3?: DayContent }) {
  const { solution, suspects } = CASE
  const killer = (suspects ?? []).find((s) => s.id === solution.killerId)

  // Nå har spilleren sett konklusjonen — lås opp sluttrapporten i Dag 4-mappen
  // (per enhet, se src/lib/fasit.ts).
  useEffect(() => markFasitSeen(), [])

  // Personlig dom fra spillerens dag 3-stemme.
  const myVote = day3 ? getMyVote(day3.day) : null
  let personal: { right: boolean; label: string } | null = null
  if (myVote?.choice && day3?.question && 'options' in day3.question) {
    const opt = day3.question.options.find((o) => o.id === myVote.choice)
    const label = opt?.label ?? myVote.choice
    personal = { right: myVote.choice === solution.killerId, label }
  }

  return (
    <div className="reveal reveal__dossier">
      <div className="reveal__verdict-head">
        {killer && (
          <div className="reveal__mugshot">
            {killer.pixel ? (
              <PixelPortrait data={killer.pixel} className="suspect__pixel" />
            ) : killer.img ? (
              <img src={assetUrl(killer.img)} alt={killer.name} />
            ) : (
              <span className="suspect__initials" aria-hidden>
                {initials(killer.name)}
              </span>
            )}
            <span className="suspect__stamp suspect__stamp--skyldig">SKYLDIG</span>
          </div>
        )}
        <h2 className="reveal__headline">🔍 {solution.headline}</h2>
      </div>

      <Markdown source={solution.body} />

      {personal && (
        <p className={`reveal__personal ${personal.right ? 'reveal__personal--right' : 'reveal__personal--wrong'}`}>
          {personal.right ? (
            <>
              Du pekte ut <strong>{personal.label}</strong> — <strong>RIKTIG!</strong> 🎯
            </>
          ) : (
            <>
              Du pekte ut <strong>{personal.label}</strong> — <strong>FEIL.</strong> Morderen var
              en annen.
            </>
          )}
        </p>
      )}
      {day3 && !personal && (
        <p className="reveal__personal">Du avga ingen stemme på dette spørsmålet.</p>
      )}

      {/* Stemmestatistikken vises IKKE her — den ligger i Excel-appen. */}

      {solution.wink && <p className="reveal__wink">{solution.wink}</p>}
    </div>
  )
}
