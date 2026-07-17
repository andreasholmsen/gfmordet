import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getUnlockedDays, hasSupabase } from './supabase'
import { CASE } from '../case/manifest'

// I dev (`npm run dev`) låses ALLE dager opp, så det er lett å redigere innhold
// og se hvordan alt ser ut. Produksjonsbygget beholder ekte tidslås fra serveren.
const DEV_UNLOCK_ALL = import.meta.env.DEV
const ALL_DAYS = CASE.days.map((d) => d.day)

interface UnlockState {
  unlockedDays: number[]
  loading: boolean
  demo: boolean
  isUnlocked: (day: number) => boolean
  refresh: () => void
}

const Ctx = createContext<UnlockState | null>(null)

export function UnlockProvider({ children }: { children: ReactNode }) {
  const [unlockedDays, setUnlockedDays] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  function refresh() {
    if (DEV_UNLOCK_ALL) {
      setUnlockedDays(ALL_DAYS)
      setLoading(false)
      return
    }
    setLoading(true)
    getUnlockedDays()
      .then(setUnlockedDays)
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [])

  const value: UnlockState = {
    unlockedDays,
    loading,
    demo: !hasSupabase,
    isUnlocked: (day) => unlockedDays.includes(day),
    refresh,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useUnlock(): UnlockState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useUnlock must be used inside UnlockProvider')
  return v
}
