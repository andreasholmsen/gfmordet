import { useMemo } from 'react'
import { Marked } from 'marked'
import { assetUrl } from '../lib/assets'

// Egen Marked-instans slik at vi ikke muterer globale innstillinger.
// Bilde-renderer er overstyrt: relative kilder (f.eks. 'case/dag1/foto.jpg')
// rutes gjennom assetUrl() så de får riktig base-prefiks (/gfmordet/). Slik kan
// man skrive ![Åstedsskisse](case/dag1/skisse.jpg) rett i markdown-dokumenter.
function isAbsolute(href: string): boolean {
  return /^(https?:|data:|\/\/|mailto:)/i.test(href)
}

const md = new Marked({
  renderer: {
    image({ href, title, text }) {
      const src = href && !isAbsolute(href) ? assetUrl(href) : href
      const titleAttr = title ? ` title="${title}"` : ''
      const alt = text ?? ''
      return `<img src="${src}" alt="${alt}"${titleAttr} loading="lazy" />`
    },
  },
})

// Enkel markdown-render. Innholdet kommer fra manifestet (vårt eget), så vi
// stoler på kilden og trenger ikke ekstern sanitering her.
export default function Markdown({ source }: { source: string }) {
  const html = useMemo(() => md.parse(source, { async: false }) as string, [source])
  return <div className="markdown" dangerouslySetInnerHTML={{ __html: html }} />
}
