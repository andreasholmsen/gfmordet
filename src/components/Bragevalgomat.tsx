import { useEffect, useState } from 'react'
import AppWindow from './AppWindow'
import { sfx } from '../lib/sfx'
import { assetUrl } from '../lib/assets'
import {
  BRAGER,
  VALGOMAT_QUESTIONS,
  type BrageProfile,
} from '../case/bragevalgomat'

// Bragevalgomaten — frittstående quiz (bare for moro, ingen kobling til saken
// eller Supabase). Spilleren svarer på spørsmålene og matches mot den Bragen
// med flest like svar. Svarene huskes per enhet, og quizen kan tas på nytt.

const STORAGE_KEY = 'gfm:bragevalgomat'

type Answers = Record<string, string>

function loadSaved(): Answers | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Answers
    // Gyldig kun hvis alle NÅVÆRENDE spørsmål er besvart (spørsmålslista kan
    // ha endret seg siden sist — da starter man heller på nytt).
    const complete = VALGOMAT_QUESTIONS.every((q) =>
      q.options.some((o) => o.id === parsed[q.id]),
    )
    return complete ? parsed : null
  } catch {
    return null
  }
}

// Stokker alternativene per spørsmål (Fisher–Yates) hver gang quizen startes,
// så rekkefølgen aldri røper hvilken Brage som «eier» hvilket svar. Stabil
// innenfor én gjennomkjøring (tilbake-knappen viser samme rekkefølge).
function shuffledQuestions() {
  return VALGOMAT_QUESTIONS.map((q) => {
    const options = [...q.options]
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[options[i], options[j]] = [options[j], options[i]]
    }
    return { ...q, options }
  })
}

interface Ranked {
  brage: BrageProfile
  matches: number
  pct: number
}

function rank(answers: Answers): Ranked[] {
  const total = VALGOMAT_QUESTIONS.length || 1
  return BRAGER.map((brage) => {
    const matches = VALGOMAT_QUESTIONS.filter((q) => brage.answers[q.id] === answers[q.id]).length
    return { brage, matches, pct: Math.round((matches / total) * 100) }
  }).sort((a, b) => b.matches - a.matches)
}

function Quiz({ onDone, initial }: { onDone: (a: Answers) => void; initial: Answers }) {
  const [questions] = useState(shuffledQuestions)
  const [answers, setAnswers] = useState<Answers>(initial)
  const [idx, setIdx] = useState(0)
  const q = questions[idx]
  const last = idx === questions.length - 1

  function pick(optionId: string) {
    sfx.click()
    const next = { ...answers, [q.id]: optionId }
    setAnswers(next)
    if (last) onDone(next)
    else setIdx(idx + 1)
  }

  return (
    <div className="valgomat">
      <div className="valgomat__progress" aria-hidden>
        <div
          className="valgomat__progress-fill"
          style={{ width: `${(idx / questions.length) * 100}%` }}
        />
      </div>
      <p className="valgomat__step">
        Spørsmål {idx + 1} av {questions.length}
      </p>

      <h2 className="valgomat__question">{q.text}</h2>

      <div className="choice-list">
        {q.options.map((o) => (
          <button
            key={o.id}
            className={`choice ${answers[q.id] === o.id ? 'choice--selected' : ''}`}
            onClick={() => pick(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>

      {idx > 0 && (
        <button
          className="btn valgomat__back"
          onClick={() => {
            sfx.click()
            setIdx(idx - 1)
          }}
        >
          ← Forrige spørsmål
        </button>
      )}
    </div>
  )
}

function Result({ answers, onRetake }: { answers: Answers; onRetake: () => void }) {
  const ranked = rank(answers)
  const winner = ranked[0]

  // Samme bar-animasjon som resultatvisningen i POLITI-appen.
  const [animate, setAnimate] = useState(false)
  useEffect(() => {
    const id = window.setTimeout(() => setAnimate(true), 60)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <div className="valgomat">
      <div className="valgomat__winner">
        {winner.brage.img ? (
          <img
            className="valgomat__winner-img"
            src={assetUrl(winner.brage.img)}
            alt={winner.brage.name}
          />
        ) : (
          <span className="valgomat__winner-emoji" aria-hidden>
            {winner.brage.emoji}
          </span>
        )}
        <p className="valgomat__winner-lead">Du er …</p>
        <h2 className="valgomat__winner-name">{winner.brage.name}</h2>
        <p className="valgomat__winner-pct">{winner.pct} % match</p>
        <p className="valgomat__winner-desc">{winner.brage.description}</p>
      </div>

      <h3 className="valgomat__list-title">Alle Bragene</h3>
      <div className="results">
        {ranked.map((r, i) => (
          <div key={r.brage.id} className={`result-row ${i === 0 ? 'result-row--top' : ''}`}>
            <div className="result-row__label">
              <span>
                {i === 0 && <span aria-hidden>👑 </span>}
                {r.brage.emoji} {r.brage.name}
              </span>
              <span>{r.pct}%</span>
            </div>
            <div className="result-bar">
              <div className="result-bar__fill" style={{ width: animate ? `${r.pct}%` : '0%' }} />
            </div>
          </div>
        ))}
      </div>

      <button className="btn" onClick={onRetake}>
        🔁 Ta quizen på nytt
      </button>
    </div>
  )
}

export default function Bragevalgomat() {
  const [saved, setSaved] = useState<Answers | null>(loadSaved)

  // Forhåndslast alle Brage-fotoene i det appen åpnes, så vinnerbildet står
  // klart i nettleser-cachen når quizen er ferdig (ingen venting på ~1 MB jpg).
  useEffect(() => {
    for (const b of BRAGER) {
      if (b.img) new Image().src = assetUrl(b.img)
    }
  }, [])
  // Ved omstart beholdes de gamle svarene som forvalg i quizen.
  const [retaking, setRetaking] = useState(false)

  function finish(answers: Answers) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers))
    } catch {
      /* full/blokkert lagring er ufarlig — resultatet vises uansett */
    }
    sfx.success()
    setSaved(answers)
    setRetaking(false)
  }

  return (
    <AppWindow title="BRAGE" icon="🗳️" variant="folder">
      {saved && !retaking ? (
        <Result answers={saved} onRetake={() => setRetaking(true)} />
      ) : (
        <Quiz onDone={finish} initial={saved ?? {}} />
      )}
    </AppWindow>
  )
}
