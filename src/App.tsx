import { useCallback, useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { CASE } from './case/manifest'
import { UnlockProvider, useUnlock } from './lib/UnlockContext'
import { SettingsProvider } from './lib/SettingsContext'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { hasSupabase, getRomanceAssigned } from './lib/supabase'
import BootScreen from './components/BootScreen'
import AuthScreen from './components/AuthScreen'
import StartHere from './components/StartHere'
import Desktop from './components/Desktop'
import DayFolder from './components/DayFolder'
import InstagramApp from './components/InstagramApp'
import StoryAlbum from './components/StoryAlbum'
import RomansaiansaApp from './components/RomansaiansaApp'
import LinkedinApp from './components/LinkedinApp'
import WeChatApp from './components/WeChatApp'
import SpotifyApp from './components/SpotifyApp'
import PoliceApp from './components/PoliceApp'
import SuspectBoard from './components/SuspectBoard'
import AngelaFiles from './components/AngelaFiles'
import ResultsApp from './components/ResultsApp'
import Minesveiper from './components/Minesveiper'
import Taskbar from './components/Taskbar'
import LarryEasterEgg from './components/LarryEasterEgg'

export default function App() {
  // Boot-animasjonen vises kun ved full sidelasting/refresh (App monteres da på
  // nytt). Intern navigasjon (mapper, tilbake) trigger den ikke. Åsted-introen
  // er nå frivillig — den startes fra «START HER»-ikonet (ruten /start).
  const [booting, setBooting] = useState(true)
  const finishBoot = useCallback(() => setBooting(false), [])

  return (
    <SettingsProvider>
      <AuthProvider>
        <UnlockProvider>
          {booting && <BootScreen onDone={finishBoot} />}
          {!booting && <Gate />}
        </UnlockProvider>
      </AuthProvider>
    </SettingsProvider>
  )
}

// Innloggingsvegg: etter boot vises skrivebordet kun for innloggede spillere.
// Ikke innlogget → logg inn/registrer-skjerm (ingen taskbar/ruter).
function Gate() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="app-shell">
        <p className="notice" style={{ margin: 24 }}>
          Kobler til …
        </p>
      </div>
    )
  }

  if (!user) return <AuthScreen />

  return <GatedShell />
}

// Når dag 3 har åpnet, men admin ennå IKKE har kjørt assign_matches(), blokkeres
// HELE appen med en fullskjerm «laster»-skjerm. Ellers ville uparede spillere
// sett begge halvdeler av dag 3-beviset. Poller så skjermen låses opp automatisk
// idet matchingen kjøres. Uten romanse-config / i demo skjer ingen blokkering.
function useMatchmakingGate(): boolean {
  const { isUnlocked, loading } = useUnlock()
  const [assigned, setAssigned] = useState<boolean | null>(null)
  // I dev er alle dager kunstig åpne (DEV_UNLOCK_ALL), så gaten deaktiveres der —
  // den er en produksjons-mekanisme (som selve tidslåsen).
  const active =
    !import.meta.env.DEV && Boolean(CASE.romance) && hasSupabase && !loading && isUnlocked(3)

  useEffect(() => {
    if (!active) return
    let alive = true
    const check = () => getRomanceAssigned().then((a) => alive && setAssigned(a))
    check()
    const id = window.setInterval(check, 15000)
    return () => {
      alive = false
      window.clearInterval(id)
    }
  }, [active])

  if (!active) return false
  return assigned !== true // blokker mens vi sjekker OG når matchingen ikke er kjørt
}

function GatedShell() {
  if (useMatchmakingGate()) return <MatchmakingLoading />

  return (
    <>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Desktop />} />
          <Route path="/start" element={<StartHere />} />
          <Route path="/dag/:day" element={<DayFolder />} />
          <Route path="/instagram" element={<InstagramApp />} />
          <Route path="/album" element={<StoryAlbum />} />
          <Route path="/romansaiansa" element={<RomansaiansaApp />} />
          <Route path="/linkedin" element={<LinkedinApp />} />
          <Route path="/wechat" element={<WeChatApp />} />
          <Route path="/spotify" element={<SpotifyApp />} />
          <Route path="/politi" element={<PoliceApp />} />
          <Route path="/mistenkte" element={<SuspectBoard />} />
          <Route path="/angela" element={<AngelaFiles />} />
          <Route path="/resultater" element={<ResultsApp />} />
          <Route path="/spill/minesveiper" element={<Minesveiper />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Taskbar />
      <LarryEasterEgg />
    </>
  )
}

// Fullskjerm blokkerings-skjerm mens matchingen ikke er kjørt (dag 3).
function MatchmakingLoading() {
  return (
    <div className="matchmaking" role="alertdialog" aria-label="Romansaiansa laster">
      <div className="matchmaking__brand">
        Romansai<span className="matchmaking__ansa">ANSA</span> 🔥
      </div>
      <div className="matchmaking__spinner" aria-hidden />
      <p className="matchmaking__text">
        Matcher etterforskere<span className="matchmaking__dots" aria-hidden />
      </p>
      <p className="matchmaking__sub">
        Vent litt — dagens bevis deles ut så snart parene er satt. 💘
      </p>
    </div>
  )
}
