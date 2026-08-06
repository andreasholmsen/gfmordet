import { useCallback, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { UnlockProvider } from './lib/UnlockContext'
import { SettingsProvider } from './lib/SettingsContext'
import BootScreen from './components/BootScreen'
import Countdown2027 from './components/Countdown2027'
import LoginGate from './components/LoginGate'
import { getPlayer } from './lib/player'
import LanguagePrompt, { needsLangPrompt } from './components/LanguagePrompt'
import SoundPrompt, { needsSoundPrompt } from './components/SoundPrompt'
import StartHere from './components/StartHere'
import Desktop from './components/Desktop'
import DayFolder from './components/DayFolder'
import InstagramApp from './components/InstagramApp'
import LinkedinApp from './components/LinkedinApp'
import WeChatApp from './components/WeChatApp'
import SpotifyApp from './components/SpotifyApp'
import PoliceApp from './components/PoliceApp'
import SuspectBoard from './components/SuspectBoard'
import AngelaFiles from './components/AngelaFiles'
import ResultsApp from './components/ResultsApp'
import Minesveiper from './components/Minesveiper'
import Bragevalgomat from './components/Bragevalgomat'
import LarryPage from './components/LarryPage'
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

  // Forsiden er nå nedtellingen til GF-mordet 2027 (sort skjerm, hvit timer).
  // 2026-utgaven (dette spillet) nås via den lille knappen nederst — valget
  // huskes bevisst IKKE, alle skal møtes av nedtellingen ved neste besøk.
  const [enter2026, setEnter2026] = useState(false)

  // Gardin foran 2026-utgaven: bare de som spilte slipper inn (navn mot en
  // hashet deltakerliste, ingen passord — se src/lib/player.ts). Huskes per
  // enhet, i motsetning til 2026-valget over.
  const [player, setPlayer] = useState(getPlayer)

  return (
    <SettingsProvider>
      <UnlockProvider>
        {!enter2026 ? (
          <Countdown2027 onEnter2026={() => setEnter2026(true)} />
        ) : !player ? (
          <LoginGate onDone={setPlayer} />
        ) : askLang ? (
          <LanguagePrompt onDone={() => setAskLang(false)} />
        ) : askSound ? (
          <SoundPrompt onDone={() => setAskSound(false)} />
        ) : booting ? (
          <BootScreen onDone={finishBoot} />
        ) : (
          <Shell />
        )}
      </UnlockProvider>
    </SettingsProvider>
  )
}

// Ingen innlogging lenger — spillet er over og alt kjører lokalt på enheten
// (svar/fremdrift i localStorage). Rett inn på skrivebordet etter boot.
function Shell() {
  return (
    <>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Desktop />} />
          <Route path="/start" element={<StartHere />} />
          <Route path="/dag/:day" element={<DayFolder />} />
          <Route path="/instagram" element={<InstagramApp />} />
          <Route path="/linkedin" element={<LinkedinApp />} />
          <Route path="/wechat" element={<WeChatApp />} />
          <Route path="/spotify" element={<SpotifyApp />} />
          <Route path="/politi" element={<PoliceApp />} />
          <Route path="/mistenkte" element={<SuspectBoard />} />
          <Route path="/angela" element={<AngelaFiles />} />
          <Route path="/resultater" element={<ResultsApp />} />
          <Route path="/spill/minesveiper" element={<Minesveiper />} />
          <Route path="/bragevalgomat" element={<Bragevalgomat />} />
          <Route path="/larry" element={<LarryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Taskbar />
      <LarryEasterEgg />
    </>
  )
}
