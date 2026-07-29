import { useCallback, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { UnlockProvider } from './lib/UnlockContext'
import { SettingsProvider } from './lib/SettingsContext'
import { AuthProvider, useAuth } from './lib/AuthContext'
import BootScreen from './components/BootScreen'
import LanguagePrompt, { needsLangPrompt } from './components/LanguagePrompt'
import SoundPrompt, { needsSoundPrompt } from './components/SoundPrompt'
import AuthScreen from './components/AuthScreen'
import StartHere from './components/StartHere'
import Desktop from './components/Desktop'
import DayFolder from './components/DayFolder'
import InstagramApp from './components/InstagramApp'
import StoryAlbum from './components/StoryAlbum'
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

  // Førstegangsbesøk: velg menyspråk først, anbefal så lyd — begge FØR
  // boot-animasjonen (svarene huskes per enhet).
  const [askLang, setAskLang] = useState(needsLangPrompt)
  const [askSound, setAskSound] = useState(needsSoundPrompt)

  return (
    <SettingsProvider>
      <AuthProvider>
        <UnlockProvider>
          {askLang ? (
            <LanguagePrompt onDone={() => setAskLang(false)} />
          ) : askSound ? (
            <SoundPrompt onDone={() => setAskSound(false)} />
          ) : booting ? (
            <BootScreen onDone={finishBoot} />
          ) : (
            <Gate />
          )}
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

function GatedShell() {
  return (
    <>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Desktop />} />
          <Route path="/start" element={<StartHere />} />
          <Route path="/dag/:day" element={<DayFolder />} />
          <Route path="/instagram" element={<InstagramApp />} />
          <Route path="/album" element={<StoryAlbum />} />
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
