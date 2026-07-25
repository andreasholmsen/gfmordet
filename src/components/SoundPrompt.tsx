import { useSettings } from '../lib/SettingsContext'
import Dialog from './Dialog'

// Førstegangsvalg: anbefal lyd før boot-animasjonen starter. Vises kun én gang
// per enhet (localStorage). Klikket her er også brukergesten nettlesere krever
// før WebAudio får spille — så velger man lyd, virker boot-blippene med en gang.
const PROMPT_KEY = 'gfm:sound-prompted'

export function needsSoundPrompt(): boolean {
  try {
    return localStorage.getItem(PROMPT_KEY) !== '1'
  } catch {
    return false // får vi ikke lagret svaret, ikke mas ved hver lasting
  }
}

export default function SoundPrompt({ onDone }: { onDone: () => void }) {
  const { setMuted } = useSettings()

  function choose(muted: boolean) {
    setMuted(muted)
    try {
      localStorage.setItem(PROMPT_KEY, '1')
    } catch {
      /* privat modus e.l. */
    }
    onDone()
  }

  return (
    <div className="sound-prompt">
      <Dialog
        title="Lyd"
        icon="🔊"
        onClose={() => choose(true)} // lukker man dialogen ⇒ behold lydløs
        actions={
          <>
            <button className="btn" onClick={() => choose(true)}>
              🔇 Uten lyd
            </button>
            <button className="btn btn--primary" onClick={() => choose(false)}>
              🔊 Ja takk (anbefalt)
            </button>
          </>
        }
      >
        <p style={{ marginTop: 0 }}>
          Spillet er best <strong>med lyd</strong> — vil du skru den på?
        </p>
        <p style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: 0 }}>
          Du kan når som helst endre dette med 🔊-knappen på oppgavelinjen.
        </p>
      </Dialog>
    </div>
  )
}
