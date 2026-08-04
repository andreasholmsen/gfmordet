import { useState } from 'react'
import type { DayContent } from '../case/manifest'
import { useUnlock } from '../lib/UnlockContext'
import { saveMyVote } from '../lib/votes'
import { sfx } from '../lib/sfx'
import { assetUrl } from '../lib/assets'

export default function VoteForm({ day }: { day: DayContent }) {
  const q = day.question!
  const { refresh } = useUnlock()
  const [choice, setChoice] = useState<string | null>(null)
  const [text, setText] = useState('')

  const showFreeText =
    q.type === 'free_text' || (q.type === 'mc_with_other' && choice === q.otherOptionId)

  const canSubmit = (() => {
    if (q.type === 'free_text') return text.trim().length > 0
    if (q.type === 'mc_with_other') {
      if (!choice) return false
      return choice !== q.otherOptionId || text.trim().length > 0
    }
    return Boolean(choice) // multiple_choice
  })()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const myChoice = q.type === 'free_text' ? null : choice
    const myFreeText = showFreeText ? text.trim() : null
    // Helt lokalt (localStorage) — spillet er over, ingen server. Lagringen
    // låser opp neste dag; refresh() får PoliceApp til å vise dagens fasit.
    saveMyVote(day.day, { choice: myChoice, freeText: myFreeText })
    sfx.success()
    refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="police__question">{q.prompt}</p>

      {(q.type === 'multiple_choice' || q.type === 'mc_with_other' || q.type === 'image_choice') && (
        <ul className={`choice-list ${q.type === 'image_choice' ? 'choice-list--images' : ''}`}>
          {q.options.map((opt) => {
            const img = 'img' in opt ? opt.img : undefined
            return (
              <li key={opt.id}>
                <label
                  className={`choice ${img ? 'choice--image' : ''} ${
                    choice === opt.id ? 'choice--selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${day.day}`}
                    value={opt.id}
                    checked={choice === opt.id}
                    onChange={() => setChoice(opt.id)}
                  />
                  {img && <img className="choice__img" src={assetUrl(img)} alt={opt.label} />}
                  <span className="choice__label">{opt.label}</span>
                </label>
              </li>
            )
          })}
        </ul>
      )}

      {showFreeText && (
        <textarea
          className="field"
          placeholder={
            (q.type === 'free_text' && q.placeholder) ||
            (q.type === 'mc_with_other' && q.otherPlaceholder) ||
            'Skriv svaret ditt …'
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
        />
      )}

      <p className="notice" style={{ marginTop: 14 }}>
        Når du sender inn låses svaret ditt, dagens fasit vises — og neste dag åpnes.
      </p>

      <div style={{ marginTop: 14 }}>
        <button className="btn btn--primary" type="submit" disabled={!canSubmit}>
          Send inn svar
        </button>
      </div>
    </form>
  )
}
