import { useState } from 'react'
import type { DayContent } from '../case/manifest'
import { submitVote } from '../lib/supabase'
import type { Player } from '../lib/player'
import { getMyVote, saveMyVote } from '../lib/votes'
import { sfx } from '../lib/sfx'
import { assetUrl } from '../lib/assets'

export default function VoteForm({ day, player }: { day: DayContent; player: Player }) {
  const q = day.question!
  // Gjenopprett en tidligere stemme fra denne enheten, så valget vises igjen
  // når appen åpnes på nytt (ingen tvil om man har stemt). Kjøres kun ved mount
  // — PoliceApp gir VoteForm en key per dag, så den remountes ved fanebytte.
  const saved = getMyVote(day.day)
  const [choice, setChoice] = useState<string | null>(saved?.choice ?? null)
  const [text, setText] = useState(saved?.freeText ?? '')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>(saved ? 'done' : 'idle')
  const [error, setError] = useState<string | null>(null)

  const showFreeText =
    q.type === 'free_text' || (q.type === 'mc_with_other' && choice === q.otherOptionId)

  const canSubmit = (() => {
    if (status === 'sending') return false
    if (q.type === 'free_text') return text.trim().length > 0
    if (q.type === 'mc_with_other') {
      if (!choice) return false
      return choice !== q.otherOptionId || text.trim().length > 0
    }
    return Boolean(choice) // multiple_choice
  })()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setStatus('sending')
    const myChoice = q.type === 'free_text' ? null : choice
    const myFreeText = showFreeText ? text.trim() : null
    try {
      await submitVote({
        day: day.day,
        playerId: player.playerId,
        name: player.displayName,
        choice: myChoice,
        freeText: myFreeText,
      })
      saveMyVote(day.day, { choice: myChoice, freeText: myFreeText })
      sfx.success()
      setStatus('done')
    } catch (err) {
      sfx.error()
      setStatus('idle')
      setError(err instanceof Error ? err.message : 'Noe gikk galt. Prøv igjen.')
    }
  }

  if (status === 'done') {
    // Vis hva som ble stemt, så det er tydelig at man har svart.
    const answerLabel = (() => {
      if (q.type === 'free_text') return text
      const opt = 'options' in q ? q.options.find((o) => o.id === choice) : undefined
      const base = opt?.label ?? choice ?? ''
      if (q.type === 'mc_with_other' && choice === q.otherOptionId && text) {
        return `${base}: ${text}`
      }
      return base
    })()
    return (
      <div className="panel">
        <p className="notice notice--ok">Stemmen din er registrert! ✓</p>
        {answerLabel && (
          <p>
            Du svarte: <strong>{answerLabel}</strong>
          </p>
        )}
        <p>Du kan endre svaret ditt så lenge avstemningen er åpen.</p>
        <button className="btn" onClick={() => setStatus('idle')}>
          Endre svar
        </button>
      </div>
    )
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

      {error && <p className="notice notice--error">{error}</p>}

      <div style={{ marginTop: 14 }}>
        <button className="btn btn--primary" type="submit" disabled={!canSubmit}>
          {status === 'sending' ? 'Sender …' : 'Send inn svar'}
        </button>
      </div>
    </form>
  )
}
