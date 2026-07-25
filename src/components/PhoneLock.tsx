import { useEffect, useState } from 'react'
import { CASE } from '../case/manifest'
import { sfx } from '../lib/sfx'
import AppWindow from './AppWindow'
import FingerprintHack from './FingerprintHack'

// Låseskjerm for Angelas mobil («Offerets filer»). To veier inn:
//  1) riktig 4-sifret kode (CASE.phonePin — plantes som spor i dokumentene)
//  2) «POLITI-HACK» — fingeravtrykk-minigame (FingerprintHack)

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

export default function PhoneLock({ onUnlock }: { onUnlock: () => void }) {
  const pin = CASE.phonePin ?? ''
  const [entered, setEntered] = useState('')
  const [shake, setShake] = useState(false)
  const [checking, setChecking] = useState(false)
  const [hacking, setHacking] = useState(false)

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000)
    return () => window.clearInterval(id)
  }, [])

  function press(key: string) {
    if (checking || hacking) return
    if (key === '⌫') {
      sfx.click()
      setEntered((e) => e.slice(0, -1))
      return
    }
    if (!/^\d$/.test(key) || entered.length >= 4) return
    sfx.click()
    const next = entered + key
    setEntered(next)
    if (next.length === 4) {
      // Liten pause så den fjerde prikken rekker å vises før dommen faller.
      setChecking(true)
      window.setTimeout(() => {
        if (next === pin) {
          sfx.granted()
          onUnlock()
        } else {
          sfx.error()
          setShake(true)
          window.setTimeout(() => {
            setShake(false)
            setEntered('')
            setChecking(false)
          }, 500)
        }
      }, 250)
    }
  }

  // Fysisk tastatur på PC.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (/^\d$/.test(e.key)) press(e.key)
      if (e.key === 'Backspace') press('⌫')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const clock = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  return (
    <AppWindow title="Offerets filer" icon="📱" variant="angela">
      <div className="phone-lock">
        <div className="phone-lock__screen">
          <div className="phone-lock__clock">{clock}</div>
          <div className="phone-lock__hint">Skriv inn kode</div>

          <div className={`phone-lock__dots ${shake ? 'phone-lock__dots--shake' : ''}`} aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`phone-lock__dot ${i < entered.length ? 'phone-lock__dot--filled' : ''}`}
              />
            ))}
          </div>

          <div className="phone-lock__pad">
            {KEYS.map((key, i) =>
              key === '' ? (
                <span key={i} />
              ) : (
                <button key={i} className="phone-lock__key" onClick={() => press(key)}>
                  {key}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="phone-lock__police">
          <button className="phone-lock__hackbtn" onClick={() => setHacking(true)}>
            🚓 POLITI-HACK
          </button>
          <p className="phone-lock__policenote">
            Autorisert verktøy: dekrypter telefonen uten kode via fingeravtrykk-kloning.
          </p>
        </div>
      </div>

      {hacking && <FingerprintHack onSuccess={onUnlock} onClose={() => setHacking(false)} />}
    </AppWindow>
  )
}
