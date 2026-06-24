import { Routes, Route, Navigate } from 'react-router-dom'
import { UnlockProvider } from './lib/UnlockContext'
import Desktop from './components/Desktop'
import DayFolder from './components/DayFolder'
import InstagramApp from './components/InstagramApp'
import PoliceApp from './components/PoliceApp'

export default function App() {
  return (
    <UnlockProvider>
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
