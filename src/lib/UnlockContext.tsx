import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getUnlockedDays, hasSupabase } from './supabase'

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
