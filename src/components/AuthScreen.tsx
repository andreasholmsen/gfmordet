import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { CASE } from '../case/manifest'
import { sfx } from '../lib/sfx'

type Mode = 'login' | 'signup'

export default function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSignup = mode === 'signup'

  const canSubmit =
    !busy &&
    username.trim().length >= 2 &&
    password.length >= 6 &&
    (!isSignup || (password === confirm && fullName.trim().length >= 2))

  function switchMode(next: Mode) {
    sfx.click()
    setMode(next)
    setError(null)
    setConfirm('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setBusy(true)
    try {
      if (isSignup) {
        await signUp(username, password, fullName)
        // Etter registrering: logg rett inn (samme credentials).
        await signIn(username, password)
      } else {
        await signIn(username, password)
      }
      sfx.success()
      // AuthContext bytter til skrivebordet når sesjonen er satt.
    } catch (err) {
      sfx.error()
      setBusy(false)
      setError(err instanceof Error ? err.message : 'Noe gikk galt. Prøv igjen.')
    }
  }

  return (
    <div className="auth">
      <div className="auth__card panel">
        <h1 className="auth__title">🔒 {CASE.title}</h1>
        <p className="auth__lead">
          {isSignup
            ? 'Opprett en etterforsker-konto for å delta. Fremgangen din lagres og følger deg på tvers av enheter.'
            : 'Logg inn for å fortsette etterforskningen.'}
        </p>

        <div className="auth__tabs" role="tablist">
          <button
            className={`tab ${!isSignup ? 'tab--active' : ''}`}
            onClick={() => switchMode('login')}
            type="button"
          >
            Logg inn
          </button>
          <button
            className={`tab ${isSignup ? 'tab--active' : ''}`}
            onClick={() => switchMode('signup')}
            type="button"
          >
            Ny bruker
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <label className="auth__label">
              Fullt navn
              <input
                className="field"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                maxLength={80}
                autoFocus
              />
            </label>
          )}

          <label className="auth__label">
            Brukernavn
            <input
              className="field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              maxLength={40}
              autoFocus={!isSignup}
            />
          </label>

          <label className="auth__label">
            Passord
            <input
              className="field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              maxLength={100}
            />
          </label>

          {isSignup && (
            <label className="auth__label">
              Gjenta passord
              <input
                className="field"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                maxLength={100}
              />
            </label>
          )}

          {isSignup && password.length > 0 && password.length < 6 && (
            <p className="notice">Passordet må ha minst 6 tegn.</p>
          )}
          {isSignup && confirm.length > 0 && password !== confirm && (
            <p className="notice notice--error">Passordene er ikke like.</p>
          )}
          {error && <p className="notice notice--error">{error}</p>}

          <div style={{ marginTop: 14 }}>
            <button className="btn btn--primary" type="submit" disabled={!canSubmit}>
              {busy ? 'Kobler til …' : isSignup ? 'Opprett konto' : 'Logg inn'}
            </button>
          </div>
        </form>

        <p className="auth__hint">
          Ingen e-post nødvendig — kun brukernavn og passord. Glemt passord? Ta kontakt med
          spillmesteren.
        </p>
      </div>
    </div>
  )
}
