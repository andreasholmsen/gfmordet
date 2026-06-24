import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

export default function AppWindow({
  title,
  icon,
  children,
}: {
  title: string
  icon: string
  children: ReactNode
}) {
  const navigate = useNavigate()
  return (
    <div className="window" role="dialog" aria-label={title}>
      <div className="titlebar">
        <span className="titlebar__icon" aria-hidden>
          {icon}
        </span>
        <span className="titlebar__title">{title}</span>
        <button className="titlebar__close" aria-label="Lukk" onClick={() => navigate('/')}>
          ✕
        </button>
      </div>
      <div className="window__body">{children}</div>
    </div>
  )
}
