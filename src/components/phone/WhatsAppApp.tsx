import { useState } from 'react'
import { CASE, type ChatMessage, type WhatsAppChat } from '../../case/manifest'
import { assetUrl } from '../../lib/assets'
import { useScrollMemory } from '../../lib/useScrollMemory'
import PixelPortrait from '../PixelPortrait'
import PhoneHeader from './PhoneHeader'

const WA_GREEN = '#075e54'

// Avatar-sirkelen: mistenkt-portrett (pixel/img) > emoji > 👤.
function Avatar({ chat, small }: { chat: WhatsAppChat; small?: boolean }) {
  const cls = `wa-avatar ${small ? 'wa-avatar--sm' : ''}`
  const suspect = chat.suspectId ? CASE.suspects?.find((s) => s.id === chat.suspectId) : undefined
  if (suspect?.pixel) {
    return (
      <span className={`${cls} wa-avatar--portrait`} aria-hidden>
        <PixelPortrait data={suspect.pixel} />
      </span>
    )
  }
  if (suspect?.img) {
    return (
      <span className={`${cls} wa-avatar--portrait`} aria-hidden>
        <img src={assetUrl(suspect.img)} alt="" />
      </span>
    )
  }
  return (
    <span className={cls} aria-hidden>
      {chat.avatar ?? '👤'}
    </span>
  )
}

// Kort forhåndsvisning av siste synlige melding til samtalelisten.
function snippet(m: ChatMessage | undefined): string {
  if (!m) return ''
  if (m.deleted) return '🚫 Melding slettet'
  if (m.img && !m.text) return '📷 Bilde'
  return m.text ?? ''
}

// Stabil b80er-farge per avsendernavn (gruppechat, som ekte WhatsApp).
function nameColor(name: string): string {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360
  return `hsl(${h}, 55%, 42%)`
}

function Bubble({ m }: { m: ChatMessage }) {
  const out = m.from === 'me'
  return (
    <div className={`wa-msg ${out ? 'wa-msg--out' : 'wa-msg--in'}`} title={m.hover}>
      {!out && !m.deleted && m.author && (
        <span className="wa-msg__author" style={{ color: nameColor(m.author) }}>
          {m.author}
        </span>
      )}
      {m.deleted ? (
        <span className="wa-msg__deleted">🚫 Denne meldingen ble slettet</span>
      ) : (
        <>
          {m.img && <img className="wa-msg__img" src={assetUrl(m.img)} alt="" />}
          {m.text && <span className="wa-msg__text">{m.text}</span>}
        </>
      )}
      <span className="wa-msg__meta">
        {m.time}
        {out && !m.deleted && (
          <span className="wa-msg__ticks" aria-hidden>
            ✓✓
          </span>
        )}
      </span>
    </div>
  )
}

export default function WhatsAppApp({
  chats,
  visible,
  onBack,
}: {
  chats: WhatsAppChat[]
  visible: (day?: number) => boolean
  onBack: () => void
}) {
  const [open, setOpen] = useState<WhatsAppChat | null>(null)
  // «← Tilbake» skal lande der man var i samtalelisten (og i lange tråder).
  const anchor = useScrollMemory(open ? `chat:${open.id}` : 'list')

  if (open) {
    const msgs = open.messages.filter((m) => visible(m.day))
    return (
      <div className="wa-app" ref={anchor}>
        <PhoneHeader
          color={WA_GREEN}
          title={
            <>
              <Avatar chat={open} small /> {open.name}
            </>
          }
          subtitle={open.subtitle}
          onBack={() => setOpen(null)}
        />
        <div className="wa-thread">
          {msgs.map((m, i) => (
            <Bubble key={i} m={m} />
          ))}
        </div>
        <div className="wa-composer" aria-hidden>
          <span className="wa-composer__field">Melding</span>
          <span className="wa-composer__send">➤</span>
        </div>
      </div>
    )
  }

  return (
    <div className="wa-app" ref={anchor}>
      <PhoneHeader color={WA_GREEN} title="WhatsApp" onBack={onBack} />
      <div className="wa-chatlist">
        {chats.length === 0 && <p className="ph-empty">Ingen samtaler.</p>}
        {chats.map((c) => {
          const msgs = c.messages.filter((m) => visible(m.day))
          const last = msgs[msgs.length - 1]
          const unread = msgs.filter((m) => m.unread && m.from === 'them').length
          return (
            <button key={c.id} className="wa-chatrow" onClick={() => setOpen(c)}>
              <Avatar chat={c} />
              <span className="wa-chatrow__mid">
                <span className="wa-chatrow__name">{c.name}</span>
                <span className="wa-chatrow__snippet">{snippet(last)}</span>
              </span>
              <span className="wa-chatrow__side">
                <span className={`wa-chatrow__time ${unread ? 'wa-chatrow__time--unread' : ''}`}>
                  {last?.time ?? ''}
                </span>
                {unread > 0 && <span className="wa-badge">{unread}</span>}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
