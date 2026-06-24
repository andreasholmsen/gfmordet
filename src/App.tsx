import { useCallback, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { UnlockProvider } from './lib/UnlockContext'
import BootScreen from './components/BootScreen'
import Desktop from './components/Desktop'
import DayFolder from './components/DayFolder'
import InstagramApp from './components/InstagramApp'
import PoliceApp from './components/PoliceApp'

export default function App() {
  // Boot-animasjonen vises kun ved full sidelasting/refresh (App monteres da på
  // nytt). Intern navigasjon (mapper, tilbake) trigger den ikke.
  const [booting, setBooting] = useState(true)
  const finishBoot = useCallback(() => setBooting(false), [])

  return (
    <UnlockProvider>
      {booting && <BootScreen onDone={finishBoot} />}
      <Routes>
        <Route path="/" element={<Desktop />} />
        <Route path="/dag/:day" element={<DayFolder />} />
        <Route path="/instagram" element={<InstagramApp />} />
        <Route path="/politi" element={<PoliceApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </UnlockProvider>
  )
}
