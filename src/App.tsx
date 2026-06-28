import { useCallback, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { UnlockProvider } from './lib/UnlockContext'
import { SettingsProvider } from './lib/SettingsContext'
import BootScreen from './components/BootScreen'
import StartHere from './components/StartHere'
import Desktop from './components/Desktop'
import DayFolder from './components/DayFolder'
import InstagramApp from './components/InstagramApp'
import PoliceApp from './components/PoliceApp'
import SuspectBoard from './components/SuspectBoard'
import Minesveiper from './components/Minesveiper'
import Taskbar from './components/Taskbar'

export default function App() {
  // Boot-animasjonen vises kun ved full sidelasting/refresh (App monteres da på
  // nytt). Intern navigasjon (mapper, tilbake) trigger den ikke. Åsted-introen
  // er nå frivillig — den startes fra «START HER»-ikonet (ruten /start).
  const [booting, setBooting] = useState(true)
  const finishBoot = useCallback(() => setBooting(false), [])

  return (
    <SettingsProvider>
      <UnlockProvider>
        {booting && <BootScreen onDone={finishBoot} />}
        <div className="app-shell">
          <Routes>
            <Route path="/" element={<Desktop />} />
            <Route path="/start" element={<StartHere />} />
            <Route path="/dag/:day" element={<DayFolder />} />
            <Route path="/instagram" element={<InstagramApp />} />
            <Route path="/politi" element={<PoliceApp />} />
            <Route path="/mistenkte" element={<SuspectBoard />} />
            <Route path="/spill/minesveiper" element={<Minesveiper />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        {!booting && <Taskbar />}
      </UnlockProvider>
    </SettingsProvider>
  )
}
