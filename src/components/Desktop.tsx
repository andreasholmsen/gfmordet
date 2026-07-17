import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { CASE } from '../case/manifest'
import { useUnlock } from '../lib/UnlockContext'
import { sfx } from '../lib/sfx'
import { markStartSeen, startSeen } from '../lib/intro'
import ContextMenu, { type MenuItem } from './ContextMenu'
import Dialog from './Dialog'
import { triggerLarry } from './LarryEasterEgg'

interface IconDef {
  label: string
  glyph: string
  node?: ReactNode // egendefinert ikon (overstyrer glyph)
  to?: string // intern rute
  href?: string // ekstern lenke (åpnes i ny fane)
  locked?: boolean
  blink?: boolean
}

// Instagram-logo som CSS-ikon (gradient + kameralinse).
const IgGlyph = () => <span className="ig-glyph" aria-hidden />

// LinkedIn-logo som CSS-ikon (blå boks med «in»).
const LinkedInGlyph = () => (
  <span className="li-glyph" aria-hidden>
    in
  </span>
)

// Angelas mappe — pastellfarget flis med blomst (skiller seg fra de grå dagmappene).
const AngelaGlyph = () => (
  <span className="angela-glyph" aria-hidden>
    🌸
  </span>
)

// Excel-logo som CSS-ikon (grønn flis med hvit «X»).
const ExcelGlyph = () => (
  <span className="excel-glyph" aria-hidden>
    <span className="excel-glyph__x">X</span>
  </span>
)

// WeChat-logo som CSS-ikon (grønn flis med hvite pratebobler).
const WeChatGlyph = () => (
  <span className="wechat-glyph" aria-hidden>
    <span className="wechat-glyph__bubble wechat-glyph__bubble--back" />
    <span className="wechat-glyph__bubble wechat-glyph__bubble--front" />
  </span>
)

function DesktopIcon({ icon }: { icon: IconDef }) {
  const navigate = useNavigate()
  return (
    <button
      className={`desktop-icon ${icon.locked ? 'desktop-icon--locked' : ''} ${
        icon.blink ? 'desktop-icon--blink' : ''
      }`}
      onClick={() => {
        if (icon.locked) return
        sfx.click()
        if (icon.href) {
          window.open(icon.href, '_blank', 'noopener,noreferrer')
          return
        }
        if (icon.to === '/start') markStartSeen()
        if (icon.to) navigate(icon.to)
      }}
      aria-disabled={icon.locked}
    >
      <span className="desktop-icon__glyph" aria-hidden>
        {icon.locked ? '🔒' : (icon.node ?? icon.glyph)}
      </span>
      <span className="desktop-icon__label">{icon.label}</span>
    </button>
  )
}

type DialogKind = 'about' | 'recycle' | null

export default function Desktop() {
  const { isUnlocked, demo, refresh } = useUnlock()
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [dialog, setDialog] = useState<DialogKind>(null)

  // «START HER» blinker til den har vært åpnet minst én gang.
  const startIcon: IconDef = {
    label: 'START HER',
    glyph: '📨',
    to: '/start',
    blink: !startSeen(),
  }

  // Vis kun dager som er åpne — låste dager (f.eks. dag 2–4) skjules helt.
  const dayIcons: IconDef[] = CASE.days
    .filter((d) => isUnlocked(d.day))
    .map((d) => ({
      label: d.title,
      glyph: '📁',
      to: `/dag/${d.day}`,
    }))

  const appIcons: IconDef[] = [
    { label: 'Instagram', glyph: '📷', node: <IgGlyph />, to: '/instagram' },
    { label: 'POLITI', glyph: '🚓', to: '/politi' },
    // TODO: skjules senere — viser live stemmetall (kamuflert som Excel).
    { label: 'Excel', glyph: '📊', node: <ExcelGlyph />, to: '/resultater' },
    { label: 'WeChat', glyph: '💬', node: <WeChatGlyph />, to: '/wechat' },
  ]
  if (CASE.suspects && CASE.suspects.length > 0) {
    appIcons.push({ label: 'Mistenkte', glyph: '📌', to: '/mistenkte' })
  }
  if (CASE.angelaFiles && CASE.angelaFiles.length > 0) {
    appIcons.push({ label: 'Offerets filer', glyph: '🌸', node: <AngelaGlyph />, to: '/angela' })
  }
  appIcons.push({ label: 'Minesveiper', glyph: '💣', to: '/spill/minesveiper' })
  appIcons.push({
    label: 'LinkedIn',
    glyph: '💼',
    node: <LinkedInGlyph />,
    to: '/linkedin',
  })

  const menuItems: MenuItem[] = [
    { label: 'Oppdater', onClick: () => refresh() },
    {
      label: 'Tøm papirkurv',
      onClick: () => setDialog('recycle'),
      separator: true,
      // Skjult test-snarvei: hold inne i 3 sek for å tvinge fram Larry-glitchen.
      onHold: () => triggerLarry(),
    },
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
      <header className="desktop__title">
        <h1>{CASE.title}</h1>
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
        {[startIcon, ...dayIcons, ...appIcons].map((icon) => (
          <DesktopIcon key={icon.to ?? icon.href} icon={icon} />
        ))}
      </div>

      {/* Introteksten ligger skjult UNDER appene — man må scrolle ned for å finne den. */}
      <div className="desktop__intro">
        <p>{CASE.intro}</p>
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
