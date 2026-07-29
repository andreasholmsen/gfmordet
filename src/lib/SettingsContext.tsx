import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { setMuted as setSfxMuted } from './sfx'
import type { Lang } from './i18n'

// Klient-innstillinger lagret i nettleseren (localStorage): lyd-demping og
// menyspråk (bokmål/nynorsk).
const KEY = 'gf-mordet.settings.v1'

interface Settings {
  muted: boolean
  lang: Lang
}

interface SettingsState extends Settings {
  toggleMuted: () => void
  setMuted: (muted: boolean) => void
  setLang: (lang: Lang) => void
}

const DEFAULTS: Settings = { muted: true, lang: 'nb' }

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULTS
    const s = JSON.parse(raw) as Partial<Settings>
    return { muted: Boolean(s.muted), lang: s.lang === 'nn' ? 'nn' : 'nb' }
  } catch {
    return DEFAULTS
  }
}

const Ctx = createContext<SettingsState | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load)

  useEffect(() => {
    setSfxMuted(settings.muted)
    try {
      localStorage.setItem(KEY, JSON.stringify(settings))
    } catch {
      /* ignorer (privat modus e.l.) */
    }
  }, [settings])

  const value: SettingsState = {
    ...settings,
    toggleMuted: () => setSettings((s) => ({ ...s, muted: !s.muted })),
    setMuted: (muted) => setSettings((s) => ({ ...s, muted })),
    setLang: (lang) => setSettings((s) => ({ ...s, lang })),
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSettings(): SettingsState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useSettings must be used inside SettingsProvider')
  return v
}
