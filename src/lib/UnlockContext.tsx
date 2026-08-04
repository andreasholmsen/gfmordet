import { createContext, useContext, useState, type ReactNode } from 'react'
import { CASE } from '../case/manifest'
import { getMyVote } from './votes'

// Lokal progresjon (spillet er over — ingen server-tidslås lenger):
// dag 1 er alltid åpen, og dag N+1 låses opp når man har svart på dag N sitt
// spørsmål (lagret i localStorage via lib/votes). Dager uten spørsmål sperrer
// ikke videre progresjon. Spillere som var med live har svarene liggende
// lokalt fra før og får dermed alt åpent automatisk.

interface UnlockState {
  unlockedDays: number[]
  isUnlocked: (day: number) => boolean
  /** Regn ut progresjonen på nytt (kalles etter innsendt svar). */
  refresh: () => void
}

function computeUnlocked(): number[] {
  const days = [...CASE.days].sort((a, b) => a.day - b.day)
  const open: number[] = []
  for (const d of days) {
    open.push(d.day)
    const answered = !d.question || getMyVote(d.day) !== null
    if (!answered) break
  }
  return open
}

const Ctx = createContext<UnlockState | null>(null)

export function UnlockProvider({ children }: { children: ReactNode }) {
  const [unlockedDays, setUnlockedDays] = useState<number[]>(computeUnlocked)

  const value: UnlockState = {
    unlockedDays,
    isUnlocked: (day) => unlockedDays.includes(day),
    refresh: () => setUnlockedDays(computeUnlocked()),
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useUnlock(): UnlockState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useUnlock must be used inside UnlockProvider')
  return v
}
