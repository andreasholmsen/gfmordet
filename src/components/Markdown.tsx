import { useMemo } from 'react'
import { marked } from 'marked'

// Enkel markdown-render. Innholdet kommer fra manifestet (vårt eget), så vi
// stoler på kilden og trenger ikke ekstern sanitering her.
export default function Markdown({ source }: { source: string }) {
  const html = useMemo(() => marked.parse(source, { async: false }) as string, [source])
  return <div className="markdown" dangerouslySetInnerHTML={{ __html: html }} />
}
