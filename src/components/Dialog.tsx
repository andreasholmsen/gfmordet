import type { ReactNode } from 'react'

// Liten retro-dialog (modal) som gjenbruker tittellinje- og bevel-stilen fra
// vinduene. Brukes til «Om denne PC-en» og andre små meldinger.
export default function Dialog({
  title,
  icon = 'ℹ️',
  onClose,
  actions,
  children,
}: {
  title: string
  icon?: string
  onClose: () => void
  /** Egne knapper i bunnen (f.eks. Avbryt/Bekreft). Standard: én OK-knapp. */
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="titlebar">
          <span className="titlebar__icon" aria-hidden>
            {icon}
          </span>
          <span className="titlebar__title">{title}</span>
          <button className="titlebar__close" aria-label="Lukk" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="dialog__body">{children}</div>
        <div className="dialog__actions">
          {actions ?? (
            <button className="btn btn--primary" onClick={onClose}>
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
