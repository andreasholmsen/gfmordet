import { useState } from 'react'
import type { AngelaPhoneConfig, SlackChannel } from '../../case/manifest'
import PhoneHeader from './PhoneHeader'

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

  if (open) {
    const msgs = open.messages.filter((m) => visible(m.day))
    return (
      <div className="pslack-app">
        <PhoneHeader
          color={SLACK_PURPLE}
          title={open.dm ? open.name : `# ${open.name}`}
          subtitle={open.topic}
          onBack={() => setOpen(null)}
        />
        <div className="pslack-thread">
          {msgs.map((m, i) => (
            <div key={i} className="pslack-msg">
              <span className="pslack-msg__avatar" aria-hidden>
                {m.author.slice(0, 1).toUpperCase()}
              </span>
              <span className="pslack-msg__body">
                <span className="pslack-msg__head">
                  <span className="pslack-msg__author">{m.author}</span>
                  {m.time && <span className="pslack-msg__time">{m.time}</span>}
                </span>
                <span className="pslack-msg__text">
                  {m.text}
                  {m.edited && <span className="pslack-msg__edited"> (redigert)</span>}
                </span>
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
    <div className="pslack-app">
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
