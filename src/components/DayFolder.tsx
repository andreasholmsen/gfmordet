import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CASE, type CaseDoc } from '../case/manifest'
import { useUnlock } from '../lib/UnlockContext'
import { getMyMatch, type MyMatch } from '../lib/supabase'
import AppWindow from './AppWindow'
import DocView from './DocView'
import Markdown from './Markdown'

const GLYPH: Record<CaseDoc['kind'], string> = {
  image: '🖼️',
  pdf: '📕',
  markdown: '📄',
  html: '📄',
}

export default function DayFolder() {
  const { day } = useParams()
  const dayNum = Number(day)
  const dayContent = CASE.days.find((d) => d.day === dayNum)
  const { isUnlocked, loading } = useUnlock()
  const [openDoc, setOpenDoc] = useState<CaseDoc | null>(null)

  // Dag 3-bevis er delt mellom matchede partnere. Hent egen match for å vite
  // hvilken halvdel (side) man ser. Uparet/avlyst → alt beviset (solo).
  const [match, setMatch] = useState<MyMatch | null>(null)
  const [matchChecked, setMatchChecked] = useState(false)
  useEffect(() => {
    if (dayNum !== 3) return
    let alive = true
    getMyMatch().then((m) => {
      if (!alive) return
      setMatch(m)
      setMatchChecked(true)
    })
    return () => {
      alive = false
    }
  }, [dayNum])

  if (!dayContent) {
    return (
      <AppWindow title="Ukjent mappe" icon="📁">
        <p>Denne mappen finnes ikke.</p>
      </AppWindow>
    )
  }

  const title = dayContent.title

  if (loading) {
    return (
      <AppWindow title={title} icon="📁">
        <p className="notice">Sjekker tilgang …</p>
      </AppWindow>
    )
  }

  if (!isUnlocked(dayNum)) {
    return (
      <AppWindow title={title} icon="🔒">
        <div className="panel">
          <p>
            <strong>{title}</strong> er ikke åpnet ennå.
          </p>
          <p>Kom tilbake når dagens dokumenter slippes.</p>
        </div>
      </AppWindow>
    )
  }

  if (openDoc) {
    return (
      <AppWindow title={`${title} — ${openDoc.title}`} icon={GLYPH[openDoc.kind]}>
        <button className="btn" onClick={() => setOpenDoc(null)}>
          ← Tilbake til mappen
        </button>
        <div style={{ marginTop: 14 }}>
          <DocView doc={openDoc} />
        </div>
      </AppWindow>
    )
  }

  // Dag 3: hvis matchet (og ikke avlyst), vis kun min halvdel (+ umerkede docs).
  // Ellers (solo/avlyst/uparet, eller andre dager) vis alt.
  const paired = dayNum === 3 && match !== null && !match.cancelled
  const visibleDocs = paired
    ? dayContent.docs.filter((d) => !d.group || d.group === match!.side)
    : dayContent.docs

  // Unngå å lekke den andre halvdelen mens matchen fortsatt lastes.
  if (dayNum === 3 && !matchChecked) {
    return (
      <AppWindow title={title} icon="📁">
        <p className="notice">Sjekker samarbeid …</p>
      </AppWindow>
    )
  }

  return (
    <AppWindow title={title} icon="📁">
      {dayContent.intro && (
        <div className="intro-note">
          <Markdown source={dayContent.intro} />
        </div>
      )}
      {paired && (
        <div className="intro-note">
          🔥 Din partner <strong>{match!.partnerName}</strong> har resten av beviset — finn
          hverandre og samarbeid! (Vil du heller spille alene, kan du avlyse i Romansaiansa.)
        </div>
      )}
      {visibleDocs.length === 0 ? (
        <p className="notice">Ingen dokumenter i denne mappen.</p>
      ) : (
        <div className="doc-list">
          {visibleDocs.map((doc) => (
            <button key={doc.id} className="doc-tile" onClick={() => setOpenDoc(doc)}>
              <span className="doc-tile__glyph" aria-hidden>
                {GLYPH[doc.kind]}
              </span>
              <span className="doc-tile__title">{doc.title}</span>
            </button>
          ))}
        </div>
      )}
    </AppWindow>
  )
}
