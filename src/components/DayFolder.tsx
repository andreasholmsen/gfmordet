import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { useParams } from 'react-router-dom'
import { CASE, type CaseDoc, type SubfolderDef } from '../case/manifest'
import { useUnlock } from '../lib/UnlockContext'
import { useScrollMemory } from '../lib/useScrollMemory'
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

// Flis-stil for et tint-tema (undermappe): lys pastellbakgrunn, mørk tekst.
function tintStyle(tint?: string): CSSProperties | undefined {
  return tint ? { background: `linear-gradient(180deg, #fff, ${tint})` } : undefined
}

export default function DayFolder() {
  const { day } = useParams()
  const dayNum = Number(day)
  const dayContent = CASE.days.find((d) => d.day === dayNum)
  const { isUnlocked, loading } = useUnlock()
  const [openDoc, setOpenDoc] = useState<CaseDoc | null>(null)
  const [openFolder, setOpenFolder] = useState<SubfolderDef | null>(null)
  // «← Tilbake» skal lande der man var (rot / undermappe / dokument).
  const anchor = useScrollMemory(
    openDoc ? `dok:${openDoc.id}` : openFolder ? `mappe:${openFolder.id}` : 'rot',
  )

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

  const folders = dayContent.folders ?? []
  const folderOf = (doc: CaseDoc) => folders.find((f) => f.id === doc.folder)

  if (openDoc) {
    const tint = folderOf(openDoc)?.tint
    return (
      <AppWindow title={`${title} — ${openDoc.title}`} icon={GLYPH[openDoc.kind]}>
        <div ref={anchor} />
        <button className="btn" onClick={() => setOpenDoc(null)}>
          ← Tilbake til mappen
        </button>
        <div
          className={tint ? 'doc-tinted' : undefined}
          style={tint ? ({ '--doc-tint': tint } as CSSProperties) : undefined}
        >
          <div style={{ marginTop: 14 }}>
            <DocView doc={openDoc} />
          </div>
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

  // Inne i en undermappe: vis kun dens dokumenter, tintet med mappens farge.
  if (openFolder) {
    const folderDocs = visibleDocs.filter((d) => d.folder === openFolder.id)
    return (
      <AppWindow title={`${title} — ${openFolder.title}`} icon={openFolder.icon ?? '📁'}>
        <div ref={anchor} />
        <button className="btn" onClick={() => setOpenFolder(null)}>
          ← Tilbake til {title}
        </button>
        {openFolder.intro && (
          <div className="intro-note" style={{ marginTop: 14 }}>
            <Markdown source={openFolder.intro} />
          </div>
        )}
        <div className="doc-list" style={{ marginTop: openFolder.intro ? 0 : 14 }}>
          {folderDocs.map((doc) => (
            <button
              key={doc.id}
              className="doc-tile"
              style={tintStyle(openFolder.tint)}
              onClick={() => setOpenDoc(doc)}
            >
              <span className="doc-tile__glyph" aria-hidden>
                {GLYPH[doc.kind]}
              </span>
              <span className="doc-tile__title">{doc.title}</span>
            </button>
          ))}
        </div>
      </AppWindow>
    )
  }

  // Rot-nivå: undermapper (kun de som har synlige dokumenter) + løse dokumenter.
  const looseDocs = visibleDocs.filter((d) => !folderOf(d))
  const visibleFolders = folders.filter((f) => visibleDocs.some((d) => d.folder === f.id))

  return (
    <AppWindow title={title} icon="📁">
      <div ref={anchor} />
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
      {looseDocs.length === 0 && visibleFolders.length === 0 ? (
        <p className="notice">Ingen dokumenter i denne mappen.</p>
      ) : (
        <div className="doc-list">
          {visibleFolders.map((f) => {
            const count = visibleDocs.filter((d) => d.folder === f.id).length
            return (
              <button
                key={f.id}
                className="doc-tile doc-tile--folder"
                style={tintStyle(f.tint)}
                onClick={() => setOpenFolder(f)}
              >
                <span className="doc-tile__glyph" aria-hidden>
                  {f.icon ?? '📁'}
                </span>
                <span className="doc-tile__title">{f.title}</span>
                <span className="doc-tile__count">
                  {count} {count === 1 ? 'dokument' : 'dokumenter'}
                </span>
              </button>
            )
          })}
          {looseDocs.map((doc) => (
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
