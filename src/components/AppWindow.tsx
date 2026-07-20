import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { sfx } from '../lib/sfx'

export type WindowVariant =
  | 'folder'
  | 'instagram'
  | 'police'
  | 'linkedin'
  | 'angela'
  | 'excel'
  | 'wechat'
  | 'spotify'

// Lengde på lukke-animasjonen (må matche den lengste .window--closing-animasjonen).
const CLOSE_MS = 270

export default function AppWindow({
  title,
  icon,
  variant = 'folder',
  children,
}: {
  title: string
  icon: string
  variant?: WindowVariant
  children: ReactNode
}) {
  const navigate = useNavigate()
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    sfx.openWindow()
  }, [])

  function handleClose() {
    if (closing) return
    sfx.closeWindow()
    setClosing(true) // spiller lukke-animasjonen, så naviger
    window.setTimeout(() => navigate('/'), CLOSE_MS)
  }

  return (
    <div
      className={`window window--${variant} ${closing ? 'window--closing' : ''}`}
      role="dialog"
      aria-label={title}
    >
      <div className="titlebar">
        <span className="titlebar__icon" aria-hidden>
          {icon}
        </span>
        <span className="titlebar__title">{title}</span>
        <button className="titlebar__close" aria-label="Lukk" onClick={handleClose}>
          ✕
        </button>
      </div>
      <div className="window__body">{children}</div>
    </div>
  )
}
