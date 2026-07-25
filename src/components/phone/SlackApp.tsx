import { useState } from 'react'
import { CASE, type AngelaPhoneConfig, type SlackChannel, type SlackMessage } from '../../case/manifest'
import { assetUrl } from '../../lib/assets'
import { useScrollMemory } from '../../lib/useScrollMemory'
import PixelPortrait from '../PixelPortrait'
import PhoneHeader from './PhoneHeader'

// Avatar-firkanten: mistenkt-portrett (pixel/img) > emoji > forbokstav.
function Avatar({ m }: { m: SlackMessage }) {
  const suspect = m.suspectId ? CASE.suspects?.find((s) => s.id === m.suspectId) : undefined
  if (suspect?.pixel) {
    return (
      <span className="pslack-msg__avatar pslack-msg__avatar--portrait" aria-hidden>
        <PixelPortrait data={suspect.pixel} />
      </span>
    )
  }
  if (suspect?.img) {
    return (
      <span className="pslack-msg__avatar pslack-msg__avatar--portrait" aria-hidden>
        <img src={assetUrl(suspect.img)} alt="" />
      </span>
    )
  }
  return (
    <span className={`pslack-msg__avatar ${m.avatar ? 'pslack-msg__avatar--emoji' : ''}`} aria-hidden>
      {m.avatar ?? m.author.slice(0, 1).toUpperCase()}
    </span>
  )
}

const SLACK_PURPLE = '#3f0e40'

export default function SlackApp({
  slack,
  visible,
  onBack,
}: {
  slack: NonNullable<AngelaPhoneConfig['slack']>
  visible: (day?: number) => boolean
  onBack: () => void
}) {
  const [open, setOpen] = useState<SlackChannel | null>(null)
  const channels = slack.channels.filter((c) => visible(c.day))
  // «← Tilbake» skal lande der man var i kanallisten.
  const anchor = useScrollMemory(open ? `kanal:${open.id}` : 'liste')

  if (open) {
    const msgs = open.messages.filter((m) => visible(m.day))
    return (
      <div className="pslack-app" ref={anchor}>
        <PhoneHeader
          color={SLACK_PURPLE}
          title={open.dm ? open.name : `# ${open.name}`}
          subtitle={open.topic}
          onBack={() => setOpen(null)}
        />
        <div className="pslack-thread">
          {msgs.map((m, i) => (
            <div key={i} className="pslack-msg">
              <Avatar m={m} />
              <span className="pslack-msg__body">
                <span className="pslack-msg__head">
                  <span className="pslack-msg__author">{m.author}</span>
                  {m.time && <span className="pslack-msg__time">{m.time}</span>}
                </span>
                <span className="pslack-msg__text">
                  {m.text}
                  {m.edited && <span className="pslack-msg__edited"> (redigert)</span>}
                </span>
                {m.img && (
                  <img
                    className="pslack-msg__img"
                    src={/^https?:\/\//.test(m.img) ? m.img : assetUrl(m.img)}
                    alt=""
                  />
                )}
                {m.seenBy && <span className="pslack-msg__seen">👀 Sett av {m.seenBy}</span>}
              </span>
            </div>
          ))}
        </div>
        <div className="pslack-composer" aria-hidden>
          <span>Melding til {open.dm ? open.name : `#${open.name}`}</span>
        </div>
      </div>
    )
  }

  const chans = channels.filter((c) => !c.dm)
  const dms = channels.filter((c) => c.dm)

  return (
    <div className="pslack-app" ref={anchor}>
      <PhoneHeader color={SLACK_PURPLE} title={slack.workspace ?? 'Slack'} onBack={onBack} />
      <div className="pslack-list">
        {channels.length === 0 && <p className="ph-empty">Ingen kanaler.</p>}
        {chans.length > 0 && <div className="pslack-section">Kanaler</div>}
        {chans.map((c) => (
          <button key={c.id} className="pslack-row" onClick={() => setOpen(c)}>
            <span className="pslack-row__hash" aria-hidden>
              #
            </span>
            <span className="pslack-row__name">{c.name}</span>
          </button>
        ))}
        {dms.length > 0 && <div className="pslack-section">Direktemeldinger</div>}
        {dms.map((c) => (
          <button key={c.id} className="pslack-row" onClick={() => setOpen(c)}>
            <span className="pslack-row__hash" aria-hidden>
              👤
            </span>
            <span className="pslack-row__name">{c.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
