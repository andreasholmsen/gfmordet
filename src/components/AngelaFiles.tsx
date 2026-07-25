import { useEffect, useState } from 'react'
import { CASE, type CaseDoc } from '../case/manifest'
import { useUnlock } from '../lib/UnlockContext'
import { useScrollMemory } from '../lib/useScrollMemory'
import AppWindow from './AppWindow'
import DocView from './DocView'
import PhoneLock from './PhoneLock'
import MailApp from './phone/MailApp'
import PhoneHeader from './phone/PhoneHeader'
import SlackApp from './phone/SlackApp'
import WhatsAppApp from './phone/WhatsAppApp'
import SignalBoxHack from './SignalBoxHack'
import BruteForceHack from './BruteForceHack'

// Husk at telefonen er låst opp på denne enheten (kode/hack gjøres én gang).
const UNLOCK_KEY = 'gfm:angela-unlocked'
// E-post-appen har sitt eget hack (signal box). Løst én gang per enhet.
const EMAIL_HACK_KEY = 'gfm:hack-email'
// WhatsApp-hacket (BruteForce). Løst én gang per enhet.
const WHATSAPP_HACK_KEY = 'gfm:hack-whatsapp'

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
  const [emailHacked, setEmailHacked] = useState(() => {
    try {
      return localStorage.getItem(EMAIL_HACK_KEY) === '1'
    } catch {
      return false
    }
  })
  const [waHacked, setWaHacked] = useState(() => {
    try {
      return localStorage.getItem(WHATSAPP_HACK_KEY) === '1'
    } catch {
      return false
    }
  })

  // Scrolleminne for hjemskjerm + Filer-appen. De andre appene (WhatsApp/
  // e-post/Slack) husker sitt eget — derfor deaktivert mens de er åpne, så vi
  // ikke overstyrer restaureringen deres (de deler samme rullefelt).
  const filesView = openApp === 'files' || openApp === null
  const anchor = useScrollMemory(
    openApp === 'files' ? (openDoc ? `dok:${openDoc.id}` : 'filer') : `app:${openApp ?? 'hjem'}`,
    filesView,
  )

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

  // App-nivå tidslås (appDays): appen vises på hjemskjermen, men er «kryptert»
  // til dagen er nådd. Her skal hvert sitt hack-minigame inn senere — inntil da
  // åpnes appen automatisk når dagen nås.
  const appLock = (app: 'whatsapp' | 'email' | 'slack'): number | undefined => {
    const d = phone?.appDays?.[app]
    return d && !isUnlocked(d) ? d : undefined
  }

  const apps: {
    id: PhoneAppId
    label: string
    glyph: string
    bg: string
    badge?: number
    /** Satt ⇒ appen er låst til denne dagen (viser 🔒 + «dag N»). */
    lockedUntil?: number
    /** Dagen er nådd, men hacket er uløst ⇒ «denne kan hackes»-utseende (🔓). */
    hackable?: boolean
  }[] = []
  if (waChats.length > 0)
    apps.push({
      id: 'whatsapp',
      label: 'WhatsApp',
      glyph: '💬',
      bg: '#25d366',
      badge: waUnread,
      lockedUntil: appLock('whatsapp'),
      hackable: !appLock('whatsapp') && !waHacked,
    })
  if (mails.length > 0)
    apps.push({
      id: 'mail',
      label: 'E-post',
      glyph: '✉️',
      bg: '#3478f6',
      badge: mailUnread,
      lockedUntil: appLock('email'),
      hackable: !appLock('email') && !emailHacked,
    })
  if (slack)
    apps.push({ id: 'slack', label: 'Slack', glyph: '#', bg: '#3f0e40', lockedUntil: appLock('slack') })
  if (files.length > 0) apps.push({ id: 'files', label: 'Filer', glyph: '📁', bg: '#ffd6e8' })

  const openAppDef = apps.find((a) => a.id === openApp)

  let content
  if (openAppDef?.lockedUntil) {
    // Låst app: placeholder-skjerm der hack-minigamet skal inn senere.
    content = (
      <div className="ph-encrypted">
        <PhoneHeader color="#1c2540" title={openAppDef.label} onBack={() => setOpenApp(null)} />
        <div className="ph-encrypted__body">
          <span className="ph-encrypted__lock" aria-hidden>
            🔒
          </span>
          <p className="ph-encrypted__title">Kryptert innhold</p>
          <p className="ph-encrypted__text">
            Politiets datateam jobber med å låse opp {openAppDef.label}. Forventet
            gjennombrudd: <strong>dag {openAppDef.lockedUntil}</strong>.
          </p>
        </div>
      </div>
    )
  } else if (openApp === 'whatsapp') {
    // Dagen er nådd, men WhatsApp er «sikret»: BruteForce-hacket må løses først.
    content = waHacked ? (
      <WhatsAppApp chats={waChats} visible={visible} onBack={() => setOpenApp(null)} />
    ) : (
      <div className="ph-hackwrap">
        <PhoneHeader
          color="#0b3d2e"
          title="WhatsApp — sikkerhetslås"
          onBack={() => setOpenApp(null)}
        />
        <BruteForceHack
          word={phone?.whatsappHackWord}
          onSolved={() => {
            try {
              localStorage.setItem(WHATSAPP_HACK_KEY, '1')
            } catch {
              /* privat modus e.l. — åpne bare for denne økten */
            }
            setWaHacked(true)
          }}
        />
      </div>
    )
  } else if (openApp === 'mail') {
    // Dagen er nådd, men e-posten er «sikret»: signal box-hacket må løses først
    // (én gang per enhet). De andre appene får egne hacks senere.
    content = emailHacked ? (
      <MailApp mails={mails} onBack={() => setOpenApp(null)} />
    ) : (
      <div className="ph-hackwrap">
        <PhoneHeader
          color="#1c2540"
          title="E-post — sikkerhetslås"
          onBack={() => setOpenApp(null)}
        />
        <SignalBoxHack
          onSolved={() => {
            try {
              localStorage.setItem(EMAIL_HACK_KEY, '1')
            } catch {
              /* privat modus e.l. — åpne bare for denne økten */
            }
            setEmailHacked(true)
          }}
        />
      </div>
    )
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
                className={`ph-app ${a.lockedUntil ? 'ph-app--locked' : ''} ${
                  a.hackable ? 'ph-app--hackable' : ''
                }`}
                onClick={() => {
                  setOpenDoc(null)
                  setOpenApp(a.id)
                }}
              >
                <span className="ph-app__icon" style={{ background: a.bg }} aria-hidden>
                  {a.glyph}
                  {/* uleste vises ikke på låste/uhackede apper (unngå å avsløre innhold) */}
                  {!a.lockedUntil && !a.hackable && a.badge ? (
                    <span className="ph-app__badge">{a.badge}</span>
                  ) : null}
                  {a.lockedUntil ? (
                    <span className="ph-app__lockbadge" aria-hidden>
                      🔒
                    </span>
                  ) : a.hackable ? (
                    <span className="ph-app__lockbadge ph-app__lockbadge--hackable" aria-hidden>
                      🔓
                    </span>
                  ) : null}
                </span>
                <span className="ph-app__label">{a.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <AppWindow title="Offerets filer" icon="🌸" variant="angela">
      <div className="phone" ref={anchor}>
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
