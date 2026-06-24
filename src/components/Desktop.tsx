import { useNavigate } from 'react-router-dom'
import { CASE } from '../case/manifest'
import { useUnlock } from '../lib/UnlockContext'

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
      onClick={() => !icon.locked && navigate(icon.to)}
      aria-disabled={icon.locked}
    >
      <span className="desktop-icon__glyph" aria-hidden>
        {icon.locked ? '🔒' : icon.glyph}
      </span>
      <span className="desktop-icon__label">{icon.label}</span>
    </button>
  )
}

export default function Desktop() {
  const { isUnlocked, loading, demo } = useUnlock()

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

  return (
    <div className="desktop">
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
    </div>
  )
}
