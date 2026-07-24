import { useState } from 'react'
import { CASE, type CaseDoc } from '../case/manifest'
import AppWindow from './AppWindow'
import DocView from './DocView'
import Markdown from './Markdown'

const GLYPH: Record<CaseDoc['kind'], string> = {
  image: '🖼️',
  pdf: '📕',
  markdown: '📄',
  html: '📄',
}

export default function AngelaFiles() {
  const files = CASE.angelaFiles ?? []
  const [openDoc, setOpenDoc] = useState<CaseDoc | null>(null)

  if (openDoc) {
    return (
      <AppWindow title={`Offerets filer — ${openDoc.title}`} icon={GLYPH[openDoc.kind]} variant="angela">
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
    <AppWindow title="Offerets filer" icon="🌸" variant="angela">
      <div className="intro-note">
        <Markdown source={'Angelas private filer. 🌸 _Vær litt forsiktig — dette er personlige ting._'} />
      </div>
      {files.length === 0 ? (
        <p className="notice">Ingen filer her.</p>
      ) : (
        <div className="doc-list">
          {files.map((doc) => (
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
