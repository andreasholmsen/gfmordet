import { useEffect, useRef, useState } from 'react'
import {
  hasSupabase,
  getActiveStories,
  getMyLastStoryAt,
  uploadStory,
  STORY_COOLDOWN_MS,
  type Story,
} from '../lib/supabase'
import { sfx } from '../lib/sfx'
import StoryViewer from './StoryViewer'

const initial = (name: string) => name.trim().charAt(0).toUpperCase()

function cooldownLabel(msLeft: number): string {
  const s = Math.ceil(msLeft / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}t ${m}m`
  if (m > 0) return `${m} min`
  return `${s} sek`
}

export default function StoriesBar() {
  const [stories, setStories] = useState<Story[]>([])
  const [lastAt, setLastAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewer, setViewer] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function refresh() {
    getActiveStories().then(setStories)
    getMyLastStoryAt().then(setLastAt)
  }

  useEffect(() => {
    if (!hasSupabase) return
    refresh()
  }, [])

  // Tikk for cooldown-nedtellingen.
  const cooldownLeft = lastAt ? Math.max(0, lastAt + STORY_COOLDOWN_MS - now) : 0
  useEffect(() => {
    if (cooldownLeft <= 0) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [cooldownLeft])

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // tillat samme fil på nytt senere
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      await uploadStory(file)
      sfx.success()
      setNow(Date.now())
      refresh()
    } catch (err) {
      sfx.error()
      setError(err instanceof Error ? err.message : 'Kunne ikke laste opp bildet.')
    } finally {
      setBusy(false)
    }
  }

  // Uten backend gir stories ingen mening — vis ingenting (den scriptede feeden
  // under fungerer fortsatt).
  if (!hasSupabase) return null

  const onCooldown = cooldownLeft > 0

  return (
    <div className="stories">
      <div className="stories__row">
        {/* Din egen «+ story»-flis */}
        <button
          className="ig-story stories__add"
          onClick={() => {
            if (busy || onCooldown) return
            sfx.click()
            fileRef.current?.click()
          }}
          disabled={busy || onCooldown}
          aria-label="Legg ut en story"
        >
          <span className="ig-story__ring stories__add-ring">
            <span className="ig-story__inner">
              <span className="stories__add-plus" aria-hidden>
                {busy ? '…' : '+'}
              </span>
            </span>
          </span>
          <span className="ig-story__name">
            {busy ? 'Laster opp' : onCooldown ? `Ny om ${cooldownLabel(cooldownLeft)}` : 'Din story'}
          </span>
        </button>

        {stories.map((s, idx) => (
          <button className="ig-story" key={s.id} onClick={() => setViewer(idx)}>
            <span className={`ig-story__ring ${s.mine ? 'ig-story__ring--mine' : ''}`}>
              <span className="ig-story__inner">
                <span className="ig-avatar stories__thumb" style={{ backgroundImage: `url(${s.url})` }}>
                  {initial(s.author)}
                </span>
              </span>
            </span>
            <span className="ig-story__name">{s.mine ? 'Deg' : s.author}</span>
          </button>
        ))}
      </div>

      {error && <p className="notice notice--error stories__error">{error}</p>}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={onPick}
      />

      {viewer !== null && stories[viewer] && (
        <StoryViewer
          stories={stories}
          startIndex={viewer}
          onClose={() => setViewer(null)}
          onDeleted={() => {
            setViewer(null)
            refresh()
          }}
        />
      )}
    </div>
  )
}
