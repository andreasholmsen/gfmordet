import { CASE } from '../case/manifest'
import type { Suspect } from '../case/manifest'
import { assetUrl } from '../lib/assets'
import AppWindow from './AppWindow'
import Markdown from './Markdown'

const STATUS_LABEL: Record<NonNullable<Suspect['status']>, string> = {
  mistenkt: 'MISTENKT',
  renvasket: 'RENVASKET',
  ukjent: 'UKJENT',
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function SuspectCard({ s }: { s: Suspect }) {
  const status = s.status ?? 'ukjent'
  return (
    <article className={`suspect suspect--${status}`}>
      <span className="suspect__pin" aria-hidden />
      <div className="suspect__photo">
        {s.img ? (
          <img src={assetUrl(s.img)} alt={s.name} />
        ) : (
          <span className="suspect__initials" aria-hidden>
            {initials(s.name)}
          </span>
        )}
        <span className={`suspect__stamp suspect__stamp--${status}`}>{STATUS_LABEL[status]}</span>
      </div>
      <h2 className="suspect__name">{s.name}</h2>
      <p className="suspect__role">{s.role}</p>
      {s.notes && (
        <div className="suspect__notes">
          <Markdown source={s.notes} />
        </div>
      )}
    </article>
  )
}

export default function SuspectBoard() {
  const suspects = CASE.suspects ?? []
  return (
    <AppWindow title="Mistenkte" icon="📌" variant="folder">
      <div className="suspect-board">
        {suspects.length === 0 ? (
          <p className="notice">Ingen personer er lagt inn i saken ennå.</p>
        ) : (
          <div className="suspect-grid">
            {suspects.map((s) => (
              <SuspectCard key={s.id} s={s} />
            ))}
          </div>
        )}
      </div>
    </AppWindow>
  )
}
