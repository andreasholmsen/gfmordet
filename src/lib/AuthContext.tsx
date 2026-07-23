import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  supabase,
  hasSupabase,
  signInWithUsername,
  signUpWithUsername,
  signOut as sbSignOut,
} from './supabase'
import { hydrateMyVotes, clearMyVotes } from './votes'

// Den innloggede spilleren, forenklet til det appen faktisk trenger.
export interface AuthUser {
  userId: string
  username: string
  displayName: string
  fullName: string
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  demo: boolean
  signIn: (username: string, password: string) => Promise<void>
  signUp: (username: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthState | null>(null)

// Demo-modus (ingen Supabase-env, f.eks. bygg uten secrets): vi later som en
// fast bruker er innlogget, slik at hele UI-flyten kan utforskes uten backend.
const DEMO_USER: AuthUser = {
  userId: 'demo',
  username: 'demo',
  displayName: 'Demo-etterforsker',
  fullName: 'Demo-etterforsker',
}

function userFromSession(session: Session | null): AuthUser | null {
  if (!session?.user) return null
  const meta = session.user.user_metadata ?? {}
  const fullName = (meta.full_name as string) || ''
  return {
    userId: session.user.id,
    username: (meta.username as string) ?? '',
    displayName:
      (meta.display_name as string) || fullName || (meta.username as string) || 'Etterforsker',
    fullName,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(hasSupabase ? null : DEMO_USER)
  const [loading, setLoading] = useState(hasSupabase)

  useEffect(() => {
    if (!supabase) {
      // Demo: hydrer (no-op mot backend) så cachen er i kjent tilstand.
      hydrateMyVotes()
      return
    }

    // Første lasting: gjenopprett en eventuell lagret sesjon.
    supabase.auth.getSession().then(({ data }) => {
      const u = userFromSession(data.session)
      setUser(u)
      setLoading(false)
      if (u) hydrateMyVotes()
    })

    // Reager på inn-/utlogging (også fra andre faner).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = userFromSession(session)
      setUser(u)
      setLoading(false)
      if (u) hydrateMyVotes()
      else clearMyVotes()
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const value: AuthState = {
    user,
    loading,
    demo: !hasSupabase,
    signIn: async (username, password) => {
      if (!supabase) {
        // Demo: ingen backend/listener — sett brukeren direkte.
        const name = username.trim()
        setUser({ userId: 'demo', username: name, displayName: name, fullName: name })
        return
      }
      await signInWithUsername(username, password)
      // onAuthStateChange oppdaterer `user` + hydrerer stemmer.
    },
    signUp: async (username, password, fullName) => {
      await signUpWithUsername(username, password, fullName)
    },
    signOut: async () => {
      await sbSignOut()
      clearMyVotes()
      setUser(null)
    },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used inside AuthProvider')
  return v
}
