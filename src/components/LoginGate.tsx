import { useState } from 'react'
import { CASE } from '../case/manifest'
import { sfx } from '../lib/sfx'
import { useT } from '../lib/i18n'
import { isPlayer, setPlayer } from '../lib/player'

// Gardinen foran 2026-utgaven: skriv navnet du spilte under. Ingen passord og
// ingen registrering — se src/lib/player.ts for hvorfor.
export default function LoginGate({ onDone }: { onDone: (name: string) => void }) {
  const t = useT()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const clean = name.trim()
    if (busy || !clean) return
    setBusy(true)
    setFailed(false)
    // isPlayer bruker crypto.subtle, som ikke finnes utenfor en «secure context»
    // (f.eks. siden åpnet over ren http på en LAN-IP). Uten catch ville skjemaet
    // blitt hengende på busy for alltid.
    if (await isPlayer(clean).catch(() => false)) {
      sfx.success()
      setPlayer(clean)
      onDone(clean)
      return
    }
    sfx.error()
    setFailed(true)
    setBusy(false)
  }

  return (
    <div className="auth">
      <form className="auth__card panel" onSubmit={submit}>
        <h1 className="auth__title">🔒 {CASE.title}</h1>
        <p className="auth__lead">{t('loginLead')}</p>

        <label className="auth__label">
          {t('loginName')}
          <input
            className="field"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setFailed(false)
            }}
            autoFocus
            autoCapitalize="words"
            autoComplete="name"
            spellCheck={false}
          />
        </label>

        {failed && (
          <p className="auth__error" role="alert">
            {t('loginFailed')}
          </p>
        )}

        <button className="btn btn--primary" type="submit" disabled={busy || !name.trim()}>
          {t('loginSubmit')}
        </button>

        <p className="auth__hint">{t('loginHint')}</p>
      </form>
    </div>
  )
}
