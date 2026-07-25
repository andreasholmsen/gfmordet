import type { ReactNode } from 'react'

/** Felles app-header inne i telefonen: farget stripe med tilbake-pil. */
export default function PhoneHeader({
  color,
  dark,
  title,
  subtitle,
  onBack,
  right,
}: {
  color: string // bakgrunnsfarge på stripen
  /** true ⇒ mørk tekst (for lyse striper). Standard er hvit tekst. */
  dark?: boolean
  title: ReactNode
  subtitle?: ReactNode
  onBack: () => void
  right?: ReactNode
}) {
  return (
    <div className={`ph-head ${dark ? 'ph-head--dark' : ''}`} style={{ background: color }}>
      <button className="ph-head__back" onClick={onBack} aria-label="Tilbake">
        ‹
      </button>
      <div className="ph-head__titles">
        <span className="ph-head__title">{title}</span>
        {subtitle && <span className="ph-head__subtitle">{subtitle}</span>}
      </div>
      {right && <div className="ph-head__right">{right}</div>}
    </div>
  )
}
