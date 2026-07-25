import { useState } from 'react'
import type { CaseDoc, EmailMessage } from '../../case/manifest'
import { useScrollMemory } from '../../lib/useScrollMemory'
import DocView from '../DocView'
import Markdown from '../Markdown'
import PhoneHeader from './PhoneHeader'

const MAIL_BLUE = '#3478f6'

type MailFolder = NonNullable<EmailMessage['folder']>
const FOLDER_ORDER: MailFolder[] = ['innboks', 'sendt', 'utkast', 'spam']
const FOLDER_LABEL: Record<MailFolder, string> = {
  innboks: 'Innboks',
  sendt: 'Sendt',
  utkast: 'Utkast',
  spam: 'Søppelpost',
}

const DOC_GLYPH: Record<CaseDoc['kind'], string> = {
  image: '🖼️',
  pdf: '📕',
  markdown: '📄',
  html: '📄',
}

export default function MailApp({
  mails,
  onBack,
}: {
  mails: EmailMessage[]
  onBack: () => void
}) {
  const [folder, setFolder] = useState<MailFolder>('innboks')
  const [open, setOpen] = useState<EmailMessage | null>(null)
  const [attachment, setAttachment] = useState<CaseDoc | null>(null)
  // «← Tilbake» husker posisjonen — per fane, per åpnet e-post og per vedlegg.
  const anchor = useScrollMemory(
    attachment ? `vedlegg:${attachment.id}` : open ? `epost:${open.id}` : `liste:${folder}`,
  )

  // Kun faner med innhold vises (mail uten `folder` havner i innboksen).
  const folderOf = (m: EmailMessage): MailFolder => m.folder ?? 'innboks'
  const tabs = FOLDER_ORDER.filter((f) => mails.some((m) => folderOf(m) === f))

  if (attachment && open) {
    return (
      <div className="pmail-app" ref={anchor}>
        <PhoneHeader
          color={MAIL_BLUE}
          title={attachment.title}
          onBack={() => setAttachment(null)}
        />
        <div className="pmail-attachment-view" data-scroll>
          <DocView doc={attachment} />
        </div>
      </div>
    )
  }

  if (open) {
    return (
      <div className="pmail-app" ref={anchor}>
        <PhoneHeader color={MAIL_BLUE} title={FOLDER_LABEL[folderOf(open)]} onBack={() => setOpen(null)} />
        <div className="pmail-read" data-scroll>
          <h2 className="pmail-read__subject">{open.subject}</h2>
          <div className="pmail-read__meta">
            <div>
              <strong>Fra:</strong> {open.from}
            </div>
            {open.to && (
              <div>
                <strong>Til:</strong> {open.to}
              </div>
            )}
            {open.date && <div className="pmail-read__date">{open.date}</div>}
            {folderOf(open) === 'utkast' && (
              <div className="pmail-read__draft">📝 Utkast — aldri sendt</div>
            )}
          </div>
          <div className="pmail-read__body">
            <Markdown source={open.body} />
          </div>
          {open.attachments && open.attachments.length > 0 && (
            <div className="pmail-read__attachments">
              <span className="pmail-read__att-label">📎 Vedlegg</span>
              {open.attachments.map((a) => (
                <button key={a.id} className="pmail-att" onClick={() => setAttachment(a)}>
                  <span aria-hidden>{DOC_GLYPH[a.kind]}</span> {a.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const list = mails.filter((m) => folderOf(m) === folder)

  return (
    <div className="pmail-app" ref={anchor}>
      <PhoneHeader color={MAIL_BLUE} title="E-post" onBack={onBack} />
      {tabs.length > 1 && (
        <div className="pmail-tabs">
          {tabs.map((f) => (
            <button
              key={f}
              className={`pmail-tab ${f === folder ? 'pmail-tab--active' : ''}`}
              onClick={() => setFolder(f)}
            >
              {FOLDER_LABEL[f]}
            </button>
          ))}
        </div>
      )}
      <div className="pmail-list" data-scroll>
        {list.length === 0 && <p className="ph-empty">Ingen e-post her.</p>}
        {list.map((m) => (
          <button
            key={m.id}
            className={`pmail-row ${m.unread ? 'pmail-row--unread' : ''}`}
            onClick={() => setOpen(m)}
          >
            <span className="pmail-row__top">
              <span className="pmail-row__from">{m.from.replace(/\s*<[^>]*>/, '')}</span>
              <span className="pmail-row__date">{m.date}</span>
            </span>
            <span className="pmail-row__subject">
              {m.unread && <span className="pmail-dot" aria-hidden />}
              {m.subject}
              {m.attachments && m.attachments.length > 0 && <span aria-hidden> 📎</span>}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
