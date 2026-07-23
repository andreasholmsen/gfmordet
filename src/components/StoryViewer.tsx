import { useState } from 'react'
import type { Story } from '../lib/supabase'
import { deleteMyStory } from '../lib/supabase'
import { sfx } from '../lib/sfx'

// «for 2 timer siden» osv.
function relativeTime(ms: number): string {
  const diff = Math.max(0, Date.now() - ms)
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'akkurat nå'
  if (min < 60) return `for ${min} min siden`
  const h = Math.floor(min / 60)
  if (h < 24) return `for ${h} ${h === 1 ? 'time' : 'timer'} siden`
  const d = Math.floor(h / 24)
  return `for ${d} ${d === 1 ? 'dag' : 'dager'} siden`
}

export default function StoryViewer({
  stories,
  startIndex,
  onClose,
  onDeleted,
}: {
  stories: Story[]
  startIndex: number
  onClose: () => void
  onDeleted?: (id: string) => void
}) {
  const [i, setI] = useState(startIndex)
  const [busy, setBusy] = useState(false)
  const story = stories[i]
  if (!story) return null

  function go(delta: number) {
    const next = i + delta
    if (next < 0 || next >= stories.length) {
      onClose()
      return
    }
    sfx.click()
    setI(next)
  }

  async function remove() {
    if (busy) return
    setBusy(true)
    try {
      await deleteMyStory(story.id, story.path)
      sfx.click()
      onDeleted?.(story.id)
      onClose()
    } catch {
      sfx.error()
      setBusy(false)
    }
  }

  return (
    <div className="story-viewer" role="dialog" aria-label={`Story fra ${story.author}`}>
      {/* Framdriftsstriper som på ekte IG */}
      <div className="story-viewer__bars">
        {stories.map((s, idx) => (
          <span
            key={s.id}
            className={`story-viewer__bar ${idx <= i ? 'story-viewer__bar--on' : ''}`}
          />
        ))}
      </div>

      <div className="story-viewer__head">
        <span className="ig-avatar ig-avatar--sm">{story.author.trim().charAt(0).toUpperCase()}</span>
        <span className="story-viewer__author">{story.author}</span>
        <span className="story-viewer__time">{relativeTime(story.createdAt)}</span>
        <button className="story-viewer__close" aria-label="Lukk" onClick={onClose}>
          ✕
        </button>
      </div>

      <img className="story-viewer__img" src={story.url} alt={`Story fra ${story.author}`} />

      {/* Tapp-soner: venstre = forrige, høyre = neste */}
      <button className="story-viewer__zone story-viewer__zone--prev" aria-label="Forrige" onClick={() => go(-1)} />
      <button className="story-viewer__zone story-viewer__zone--next" aria-label="Neste" onClick={() => go(1)} />

      {story.mine && (
        <button className="story-viewer__delete" onClick={remove} disabled={busy}>
          {busy ? 'Fjerner …' : '🗑 Fjern'}
        </button>
      )}
    </div>
  )
}
