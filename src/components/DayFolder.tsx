import { useState } from 'react'
import type { CSSProperties } from 'react'
import { useParams } from 'react-router-dom'
import { CASE, type CaseDoc, type SubfolderDef } from '../case/manifest'
import { hasSeenFasit } from '../lib/fasit'
import { useUnlock } from '../lib/UnlockContext'
import { useScrollMemory } from '../lib/useScrollMemory'
import { useT } from '../lib/i18n'
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
  const t = useT()
  const [openDoc, setOpenDoc] = useState<CaseDoc | null>(null)
  const [openFolder, setOpenFolder] = useState<SubfolderDef | null>(null)
  // «← Tilbake» skal lande der man var (rot / undermappe / dokument).
  const anchor = useScrollMemory(
    openDoc ? `dok:${openDoc.id}` : openFolder ? `mappe:${openFolder.id}` : 'rot',
  )

  if (!dayContent) {
    return (
      <AppWindow title={t('unknownFolder')} icon="📁">
        <p>{t('folderNotExist')}</p>
      </AppWindow>
    )
  }

  const title = dayContent.title

  if (loading) {
    return (
      <AppWindow title={title} icon="📁">
        <p className="notice">{t('checkingAccess')}</p>
      </AppWindow>
    )
  }

  if (!isUnlocked(dayNum)) {
    return (
      <AppWindow title={title} icon="🔒">
        <div className="panel">
          <p>
            <strong>{title}</strong> {t('notOpenYet')}
          </p>
          <p>{t('comeBack')}</p>
        </div>
      </AppWindow>
    )
  }

  const folders = dayContent.folders ?? []
  const folderOf = (doc: CaseDoc) => folders.find((f) => f.id === doc.folder)
  const childrenOf = (f: SubfolderDef) => folders.filter((c) => c.parent === f.id)
  // Antall dokumenter i mappen OG i eventuelle under-undermapper (for flis-telleren).
  const docsUnder = (f: SubfolderDef, docs: CaseDoc[]) =>
    docs.filter((d) => d.folder === f.id || childrenOf(f).some((c) => c.id === d.folder)).length

  if (openDoc) {
    // Dokumentets egen tint vinner over mappens.
    const tint = openDoc.tint ?? folderOf(openDoc)?.tint
    return (
      <AppWindow title={`${title} — ${openDoc.title}`} icon={GLYPH[openDoc.kind]}>
        <div ref={anchor} />
        <button className="btn" onClick={() => setOpenDoc(null)}>
          {t('backToFolder')}
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

  // Dokumenter med `afterReveal` holdes skjult til spilleren har sett
  // konklusjonen i POLITI-appen (per enhet) — sluttrapporten skal ikke kunne
  // leses i mappen først.
  const visibleDocs = dayContent.docs.filter((d) => !d.afterReveal || hasSeenFasit())
  const hiddenByReveal = dayContent.docs.length - visibleDocs.length

  // Inne i en undermappe: eventuelle under-undermapper først, så mappens egne
  // dokumenter — alt tintet med mappens farge.
  if (openFolder) {
    const folderDocs = visibleDocs.filter((d) => d.folder === openFolder.id)
    const subFolders = childrenOf(openFolder).filter((c) => docsUnder(c, visibleDocs) > 0)
    // Ligger vi i en under-undermappe? Da skal «tilbake» gå til foreldremappen.
    const parent = folders.find((f) => f.id === openFolder.parent)
    return (
      <AppWindow title={`${title} — ${openFolder.title}`} icon={openFolder.icon ?? '📁'}>
        <div ref={anchor} />
        <button className="btn" onClick={() => setOpenFolder(parent ?? null)}>
          {t('backTo', { name: parent ? parent.title : title })}
        </button>
        {openFolder.intro && (
          <div className="intro-note" style={{ marginTop: 14 }}>
            <Markdown source={openFolder.intro} />
          </div>
        )}
        <div className="doc-list" style={{ marginTop: openFolder.intro ? 0 : 14 }}>
          {subFolders.map((f) => {
            const count = docsUnder(f, visibleDocs)
            return (
              <button
                key={f.id}
                className="doc-tile doc-tile--folder"
                style={tintStyle(f.tint ?? openFolder.tint)}
                onClick={() => setOpenFolder(f)}
              >
                <span className="doc-tile__glyph" aria-hidden>
                  {f.icon ?? '📁'}
                </span>
                <span className="doc-tile__title">{f.title}</span>
                <span className="doc-tile__count">
                  {t(count === 1 ? 'docCount1' : 'docCountN', { n: count })}
                </span>
              </button>
            )
          })}
          {folderDocs.map((doc) => (
            <button
              key={doc.id}
              className="doc-tile"
              style={tintStyle(doc.tint ?? openFolder.tint)}
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
  // Kun rot-mapper her — under-undermapper vises inne i foreldremappen.
  const visibleFolders = folders.filter((f) => !f.parent && docsUnder(f, visibleDocs) > 0)

  return (
    <AppWindow title={title} icon="📁">
      <div ref={anchor} />
      {dayContent.intro && (
        <div className="intro-note">
          <Markdown source={dayContent.intro} />
        </div>
      )}
      {hiddenByReveal > 0 && (
        <p className="notice">{t('docsAfterReveal')}</p>
      )}
      {looseDocs.length === 0 && visibleFolders.length === 0 ? (
        hiddenByReveal === 0 && <p className="notice">{t('emptyFolder')}</p>
      ) : (
        <div className="doc-list">
          {visibleFolders.map((f) => {
            const count = docsUnder(f, visibleDocs)
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
                  {t(count === 1 ? 'docCount1' : 'docCountN', { n: count })}
                </span>
              </button>
            )
          })}
          {looseDocs.map((doc) => (
            <button
              key={doc.id}
              className="doc-tile"
              style={tintStyle(doc.tint)}
              onClick={() => setOpenDoc(doc)}
            >
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
