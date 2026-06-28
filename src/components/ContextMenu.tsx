import { useEffect } from 'react'

export interface MenuItem {
  label: string
  onClick: () => void
  /** vis en skillelinje over dette punktet */
  separator?: boolean
}

// Win95-aktig høyreklikk-meny. Posisjoneres der brukeren klikket.
export default function ContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number
  y: number
  items: MenuItem[]
  onClose: () => void
}) {
  // Lukk ved klikk utenfor eller Escape.
  useEffect(() => {
    const close = () => onClose()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('click', close)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // Hold menyen innenfor skjermen.
  const left = Math.min(x, window.innerWidth - 200)
  const top = Math.min(y, window.innerHeight - items.length * 32 - 16)

  return (
    <ul className="ctx-menu" style={{ left, top }} role="menu">
      {items.map((item) => (
        <li key={item.label} className={item.separator ? 'ctx-menu__sep' : ''}>
          <button
            role="menuitem"
            className="ctx-menu__item"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
              item.onClick()
            }}
          >
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  )
}
