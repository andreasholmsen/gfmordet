import { useState } from 'react'
import type { DayContent } from '../case/manifest'
import { submitVote } from '../lib/supabase'
import type { Player } from '../lib/player'

export default function VoteForm({ day, player }: { day: DayContent; player: Player }) {
  const q = day.question!
  const [choice, setChoice] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle')
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
    try {
      await submitVote({
        day: day.day,
        playerId: player.playerId,
        name: player.displayName,
        choice: q.type === 'free_text' ? null : choice,
        freeText: showFreeText ? text.trim() : null,
      })
      setStatus('done')
    } catch (err) {
      setStatus('idle')
      setError(err instanceof Error ? err.message : 'Noe gikk galt. Prøv igjen.')
    }
  }

  if (status === 'done') {
    return (
      <div className="panel">
        <p className="notice notice--ok">Stemmen din er registrert! ✓</p>
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

      {(q.type === 'multiple_choice' || q.type === 'mc_with_other') && (
        <ul className="choice-list">
          {q.options.map((opt) => (
            <li key={opt.id}>
              <label className={`choice ${choice === opt.id ? 'choice--selected' : ''}`}>
                <input
                  type="radio"
                  name={`q-${day.day}`}
                  value={opt.id}
                  checked={choice === opt.id}
                  onChange={() => setChoice(opt.id)}
                />
                {opt.label}
              </label>
            </li>
          ))}
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
