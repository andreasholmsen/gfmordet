import { useEffect, useState } from 'react'
import type { CaseDoc } from '../case/manifest'
import { assetUrl } from '../lib/assets'
import Markdown from './Markdown'

// Henter tekstinnhold fra fil når et markdown/html-dokument peker på en src.
function useFileText(src: string | undefined, enabled: boolean) {
  const [text, setText] = useState<string | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    if (!enabled || !src) return
    let alive = true
    fetch(assetUrl(src))
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((t) => alive && setText(t))
      .catch(() => alive && setError(true))
    return () => {
      alive = false
    }
  }, [src, enabled])
  return { text, error }
}

export default function DocView({ doc }: { doc: CaseDoc }) {
  const needsFile = (doc.kind === 'markdown' || doc.kind === 'html') && !doc.inline
  const { text, error } = useFileText(doc.src, needsFile)

  if ((doc.kind === 'image' || doc.kind === 'pdf') && !doc.src) {
    return <p className="notice notice--error">Dokumentet mangler en fil (src).</p>
  }

  if (doc.kind === 'image') {
    return (
      <div className="doc-view">
        <img src={assetUrl(doc.src!)} alt={doc.title} />
      </div>
    )
  }

  if (doc.kind === 'pdf') {
    return (
      <div className="doc-view">
        <iframe src={assetUrl(doc.src!)} title={doc.title} />
        <p className="notice">
          Får du ikke vist PDF-en?{' '}
          <a href={assetUrl(doc.src!)} target="_blank" rel="noreferrer">
            Åpne i ny fane
          </a>
          .
        </p>
      </div>
    )
  }

  // markdown / html
  const content = doc.inline ?? text ?? ''
  if (needsFile && error) {
    return <p className="notice notice--error">Kunne ikke laste dokumentet.</p>
  }
  if (needsFile && text === null) {
    return <p className="notice">Laster …</p>
  }

  if (doc.kind === 'html') {
    return <div className="markdown" dangerouslySetInnerHTML={{ __html: content }} />
  }
  return <Markdown source={content} />
}
