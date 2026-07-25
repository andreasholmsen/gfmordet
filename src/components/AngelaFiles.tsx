import { useEffect, useState } from 'react'
import { CASE, type CaseDoc } from '../case/manifest'
import { useUnlock } from '../lib/UnlockContext'
import AppWindow from './AppWindow'
import DocView from './DocView'
import PhoneLock from './PhoneLock'
import MailApp from './phone/MailApp'
import PhoneHeader from './phone/PhoneHeader'
import SlackApp from './phone/SlackApp'
import WhatsAppApp from './phone/WhatsAppApp'

// Husk at telefonen er låst opp på denne enheten (kode/hack gjøres én gang).
const UNLOCK_KEY = 'gfm:angela-unlocked'

const GLYPH: Record<CaseDoc['kind'], string> = {
  image: '🖼️',
  pdf: '📕',
  markdown: '📄',
  html: '📄',
}

type PhoneAppId = 'whatsapp' | 'mail' | 'slack' | 'files'

// Klokka i statuslinjen (oppdateres hvert halvminutt).
function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(t)
  }, [])
  return now.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })
}

export default function AngelaFiles() {
  const files = CASE.angelaFiles ?? []
  const phone = CASE.angelaPhone
  const { isUnlocked } = useUnlock()
  const clock = useClock()
  const [openApp, setOpenApp] = useState<PhoneAppId | null>(null)
  const [openDoc, setOpenDoc] = useState<CaseDoc | null>(null)
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return localStorage.getItem(UNLOCK_KEY) === '1'
    } catch {
      return false
    }
  })

  // Telefonen er låst med kode (hvis satt i manifestet) til man taster riktig
  // eller lykkes med politi-hacket.
  if (CASE.phonePin && !unlocked) {
    return (
      <PhoneLock
        onUnlock={() => {
          try {
            localStorage.setItem(UNLOCK_KEY, '1')
          } catch {
            /* privat modus e.l. — lås opp bare for denne økten */
          }
          setUnlocked(true)
        }}
      />
    )
  }

  // Dag-gating av telefoninnhold: `day` på samtaler/meldinger/e-poster betyr
  // «vises først når dag N er åpen» — samme server-tidslås som dag-mappene.
  const visible = (day?: number) => !day || isUnlocked(day)

  const waChats = (phone?.whatsapp ?? []).filter((c) => visible(c.day))
  const waUnread = waChats.reduce(
    (n, c) =>
      n + c.messages.filter((m) => visible(m.day) && m.unread && m.from === 'them').length,
    0
  )
  const mails = (phone?.email ?? []).filter((m) => visible(m.day))
  const mailUnread = mails.filter((m) => m.unread).length
  const slack =
    phone?.slack && phone.slack.channels.some((c) => visible(c.day)) ? phone.slack : null

  const apps: {
    id: PhoneAppId
    label: string
    glyph: string
    bg: string
    badge?: number
  }[] = []
  if (waChats.length > 0)
    apps.push({ id: 'whatsapp', label: 'WhatsApp', glyph: '💬', bg: '#25d366', badge: waUnread })
  if (mails.length > 0)
    apps.push({ id: 'mail', label: 'E-post', glyph: '✉️', bg: '#3478f6', badge: mailUnread })
  if (slack) apps.push({ id: 'slack', label: 'Slack', glyph: '#', bg: '#3f0e40' })
  if (files.length > 0) apps.push({ id: 'files', label: 'Filer', glyph: '📁', bg: '#ffd6e8' })

  let content
  if (openApp === 'whatsapp') {
    content = <WhatsAppApp chats={waChats} visible={visible} onBack={() => setOpenApp(null)} />
  } else if (openApp === 'mail') {
    content = <MailApp mails={mails} onBack={() => setOpenApp(null)} />
  } else if (openApp === 'slack' && slack) {
    content = <SlackApp slack={slack} visible={visible} onBack={() => setOpenApp(null)} />
  } else if (openApp === 'files') {
    content = openDoc ? (
      <div className="ph-files">
        <PhoneHeader color="#ffd6e8" dark title={openDoc.title} onBack={() => setOpenDoc(null)} />
        <div className="ph-files__view">
          <DocView doc={openDoc} />
        </div>
      </div>
    ) : (
      <div className="ph-files">
        <PhoneHeader color="#ffd6e8" dark title="Filer" onBack={() => setOpenApp(null)} />
        <div className="ph-files__grid doc-list">
          {files.map((doc) => (
            <button key={doc.id} className="doc-tile" onClick={() => setOpenDoc(doc)}>
              <span className="doc-tile__glyph" aria-hidden>
                {GLYPH[doc.kind]}
              </span>
              <span className="doc-tile__title">{doc.title}</span>
            </button>
          ))}
        </div>
      </div>
    )
  } else {
    // Hjemskjerm
    content = (
      <div className="ph-home">
        {apps.length === 0 ? (
          <p className="ph-empty">Telefonen er tom.</p>
        ) : (
          <div className="ph-apps">
            {apps.map((a) => (
              <button
                key={a.id}
                className="ph-app"
                onClick={() => {
                  setOpenDoc(null)
                  setOpenApp(a.id)
                }}
              >
                <span className="ph-app__icon" style={{ background: a.bg }} aria-hidden>
                  {a.glyph}
                  {a.badge ? <span className="ph-app__badge">{a.badge}</span> : null}
                </span>
                <span className="ph-app__label">{a.label}</span>
              </button>
            ))}
          </div>
        )}
        <p className="ph-home__note">🌸 Angelas mobil — vær litt forsiktig, dette er personlige ting.</p>
      </div>
    )
  }

  return (
    <AppWindow title="Offerets filer" icon="🌸" variant="angela">
      <div className="phone">
        <div className="phone__screen">
          <div className="ph-status">
            <span className="ph-status__time">{clock}</span>
            <span className="ph-status__right">
              <span aria-hidden>▂▄▆█</span>
              <span className="ph-status__batt">🪫 9 %</span>
            </span>
          </div>
          {content}
        </div>
      </div>
    </AppWindow>
  )
}
