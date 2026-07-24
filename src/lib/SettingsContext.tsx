import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { setMuted as setSfxMuted } from './sfx'

// Klient-innstillinger lagret i nettleseren (localStorage). Foreløpig kun
// lyd-demping, men strukturert slik at flere valg kan legges til senere.
const KEY = 'gf-mordet.settings.v1'

interface Settings {
  muted: boolean
}

interface SettingsState extends Settings {
  toggleMuted: () => void
}

const DEFAULTS: Settings = { muted: true }

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULTS
    const s = JSON.parse(raw) as Partial<Settings>
    return { muted: Boolean(s.muted) }
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
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSettings(): SettingsState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useSettings must be used inside SettingsProvider')
  return v
}
