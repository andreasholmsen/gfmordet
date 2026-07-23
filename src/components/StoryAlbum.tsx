import { useEffect, useState } from 'react'
import { getAllStories, type Story } from '../lib/supabase'
import AppWindow from './AppWindow'
import StoryViewer from './StoryViewer'

export default function StoryAlbum() {
  const [stories, setStories] = useState<Story[] | null>(null)
  const [viewer, setViewer] = useState<number | null>(null)

  useEffect(() => {
    let alive = true
    getAllStories().then((s) => alive && setStories(s))
    return () => {
      alive = false
    }
  }, [])

  return (
    <AppWindow title="Minnealbum" icon="📸" variant="instagram">
      <div className="story-album">
        <h2 className="story-album__title">📸 Minnealbum</h2>
        {stories === null ? (
          <p className="notice">Laster …</p>
        ) : stories.length === 0 ? (
          <p className="notice">
            Minnealbumet åpnes når saken er løst. Da samles alle øyeblikkene fra spillet her.
          </p>
        ) : (
          <>
            <p className="notice">{stories.length} øyeblikk fra spillet:</p>
            <div className="story-album__grid">
              {stories.map((s, idx) => (
                <button
                  key={s.id}
                  className="story-album__cell"
                  style={{ backgroundImage: `url(${s.url})` }}
                  onClick={() => setViewer(idx)}
                  aria-label={`Bilde fra ${s.author}`}
                >
                  <span className="story-album__cap">{s.mine ? 'Deg' : s.author}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {viewer !== null && stories && stories[viewer] && (
          <StoryViewer
            stories={stories}
            startIndex={viewer}
            onClose={() => setViewer(null)}
            onDeleted={() => {
              setViewer(null)
              getAllStories().then(setStories)
            }}
          />
        )}
      </div>
    </AppWindow>
  )
}
