import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { CASE, type CaseDoc } from '../case/manifest'
import { useUnlock } from '../lib/UnlockContext'
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

  // Et åpent dokument vises i samme vindu med tilbake-knapp.
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

  return (
    <AppWindow title={title} icon="📁">
      {dayContent.intro && (
        <div className="intro-note">
          <Markdown source={dayContent.intro} />
        </div>
      )}
      {dayContent.docs.length === 0 ? (
        <p className="notice">Ingen dokumenter i denne mappen.</p>
      ) : (
        <div className="doc-list">
          {dayContent.docs.map((doc) => (
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
