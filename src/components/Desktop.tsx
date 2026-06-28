import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CASE } from '../case/manifest'
import { useUnlock } from '../lib/UnlockContext'
import { sfx } from '../lib/sfx'
import ContextMenu, { type MenuItem } from './ContextMenu'
import Dialog from './Dialog'

interface IconDef {
  label: string
  glyph: string
  to: string
  locked?: boolean
}

function DesktopIcon({ icon }: { icon: IconDef }) {
  const navigate = useNavigate()
  return (
    <button
      className={`desktop-icon ${icon.locked ? 'desktop-icon--locked' : ''}`}
      onClick={() => {
        if (icon.locked) return
        sfx.click()
        navigate(icon.to)
      }}
      aria-disabled={icon.locked}
    >
      <span className="desktop-icon__glyph" aria-hidden>
        {icon.locked ? '🔒' : icon.glyph}
      </span>
      <span className="desktop-icon__label">{icon.label}</span>
    </button>
  )
}

type DialogKind = 'about' | 'recycle' | null

export default function Desktop() {
  const { isUnlocked, loading, demo, refresh } = useUnlock()
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [dialog, setDialog] = useState<DialogKind>(null)

  const dayIcons: IconDef[] = CASE.days.map((d) => ({
    label: d.title,
    glyph: '📁',
    to: `/dag/${d.day}`,
    locked: !loading && !isUnlocked(d.day),
  }))

  const appIcons: IconDef[] = [
    { label: 'Instagram', glyph: '📷', to: '/instagram' },
    { label: 'POLITI', glyph: '🚓', to: '/politi' },
  ]
  if (CASE.suspects && CASE.suspects.length > 0) {
    appIcons.push({ label: 'Mistenkte', glyph: '📌', to: '/mistenkte' })
  }
  appIcons.push({ label: 'Minesveiper', glyph: '💣', to: '/spill/minesveiper' })

  const menuItems: MenuItem[] = [
    { label: 'Oppdater', onClick: () => refresh() },
    { label: 'Tøm papirkurv', onClick: () => setDialog('recycle'), separator: true },
    { label: 'Om denne PC-en', onClick: () => setDialog('about'), separator: true },
  ]

  return (
    <div
      className="desktop"
      onContextMenu={(e) => {
        e.preventDefault()
        sfx.click()
        setMenu({ x: e.clientX, y: e.clientY })
      }}
    >
      <header className="desktop__header">
        <h1>{CASE.title}</h1>
        <p>{CASE.intro}</p>
      </header>

      {demo && (
        <div style={{ maxWidth: 720, margin: '0 auto', width: '100%', padding: '0 12px' }}>
          <div className="demo-banner">
            ⚠️ Demo-modus: Supabase er ikke konfigurert, så alle dager er åpne og stemmer lagres
            ikke. Se README for oppsett.
          </div>
        </div>
      )}

      <div className="icon-grid">
        {[...dayIcons, ...appIcons].map((icon) => (
          <DesktopIcon key={icon.to} icon={icon} />
        ))}
      </div>

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />
      )}

      {dialog === 'about' && (
        <Dialog title="Om denne PC-en" icon="🖥️" onClose={() => setDialog(null)}>
          <p>
            <strong>POLITIET // SAKSSYSTEM v3.7</strong>
          </p>
          <p>
            Sikkert terminalmiljø for etterforskning. Bevismateriale slippes dag for dag. Alle
            handlinger logges (på liksom 😉).
          </p>
          <p style={{ color: 'var(--shadow)' }}>
            Bygget med kaffe og altfor lite søvn. Lykke til, etterforsker.
          </p>
        </Dialog>
      )}

      {dialog === 'recycle' && (
        <Dialog title="Papirkurv" icon="🗑️" onClose={() => setDialog(null)}>
          <p>Papirkurven er allerede tom.</p>
          <p style={{ color: 'var(--shadow)' }}>
            (Bevis kastes aldri i denne saken — alt kan bli viktig.)
          </p>
        </Dialog>
      )}
    </div>
  )
}
