import { useEffect, useRef } from 'react'

export interface MenuItem {
  label: string
  onClick: () => void
  /** vis en skillelinje over dette punktet */
  separator?: boolean
  /** valgfritt: hold inne (long-press) på punktet i `holdMs` for å utløse dette
   *  i stedet for det vanlige klikket. Skjult test-snarvei. */
  onHold?: () => void
  holdMs?: number
}

// Ett menypunkt — støtter både vanlig klikk og valgfri long-press (onHold).
function MenuItemButton({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const timer = useRef<number | undefined>(undefined)
  const held = useRef(false)

  function cancelHold() {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = undefined
  }

  return (
    <button
      role="menuitem"
      className="ctx-menu__item"
      onPointerDown={() => {
        if (!item.onHold) return
        held.current = false
        timer.current = window.setTimeout(() => {
          held.current = true
          onClose()
          item.onHold!()
        }, item.holdMs ?? 3000)
      }}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
      onClick={(e) => {
        e.stopPropagation()
        cancelHold()
        if (held.current) {
          held.current = false // long-press håndterte det allerede
          return
        }
        onClose()
        item.onClick()
      }}
    >
      {item.label}
    </button>
  )
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
          <MenuItemButton item={item} onClose={onClose} />
        </li>
      ))}
    </ul>
  )
}
