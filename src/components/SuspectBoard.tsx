import { CASE } from '../case/manifest'
import type { Suspect } from '../case/manifest'
import { assetUrl } from '../lib/assets'
import { useUnlock } from '../lib/UnlockContext'
import AppWindow from './AppWindow'
import PixelPortrait from './PixelPortrait'

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
  const { isUnlocked } = useUnlock()
  // `renvasketDay` overstyrer status når dagen er åpen (server-tidslås) —
  // brukt til å renvaske alle som ikke var på vorset når dag 3 slippes.
  const status: NonNullable<Suspect['status']> =
    s.renvasketDay != null && isUnlocked(s.renvasketDay) ? 'renvasket' : (s.status ?? 'ukjent')
  return (
    <article className={`suspect suspect--${status}`}>
      <span className="suspect__pin" aria-hidden />
      <div className="suspect__photo">
        {s.pixel ? (
          <PixelPortrait data={s.pixel} className="suspect__pixel" />
        ) : s.img ? (
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
    </article>
  )
}

export default function SuspectBoard() {
  const suspects = CASE.suspects ?? []
  return (
    <AppWindow title="Mistenkte" icon="📌" variant="folder" closeTo="/politi">
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
