import { useSettings } from '../lib/SettingsContext'

// Førstegangsvalg (vises FØR lyd-prompten og boot): hvilket språk menyene skal
// ha. Spørsmålet vises på begge målformer — ingen av dem er «default» visuelt.
// Valget huskes per enhet og kan endres i ⚙️ Innstillinger på Angelas mobil.
const PROMPT_KEY = 'gfm:lang-prompted'

export function needsLangPrompt(): boolean {
  try {
    return localStorage.getItem(PROMPT_KEY) !== '1'
  } catch {
    return false // får vi ikke lagret svaret, ikke mas ved hver lasting
  }
}

export default function LanguagePrompt({ onDone }: { onDone: () => void }) {
  const { setLang } = useSettings()

  function choose(lang: 'nb' | 'nn') {
    setLang(lang)
    try {
      localStorage.setItem(PROMPT_KEY, '1')
    } catch {
      /* privat modus e.l. */
    }
    onDone()
  }

  return (
    <div className="lang-prompt">
      <div className="lang-prompt__box">
        <p className="lang-prompt__q">Hvilket språk vil du ha i menyene?</p>
        <p className="lang-prompt__q lang-prompt__q--nn">Kva språk vil du ha i menyane?</p>
        <div className="lang-prompt__buttons">
          <button className="lang-prompt__btn" onClick={() => choose('nb')}>
            Bokmål
          </button>
          <button className="lang-prompt__btn" onClick={() => choose('nn')}>
            Nynorsk
          </button>
        </div>
        <p className="lang-prompt__note">
          Gjelder bare menyene — kan endres senere. · Gjeld berre menyane — kan endrast seinare.
        </p>
      </div>
    </div>
  )
}
