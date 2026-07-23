import { useEffect, useRef, useState } from 'react'
import { sfx } from '../lib/sfx'
import { assetUrl } from '../lib/assets'
import AppWindow from './AppWindow'

// Bare for gøy (en intern spøk). Ingen data forlater enheten — «opplasting» viser
// bare et meme, og kort-skjemaet valideres kun for å se plausibelt ut lokalt.
type Method = 'bank' | 'passport' | 'selfie'

const METHODS: { id: Method; zh: string; sub: string; glyph: string }[] = [
  { id: 'bank', zh: '银行账户信息', sub: 'Bankkontodetaljer', glyph: '🏦' },
  { id: 'passport', zh: '护照', sub: 'Pass', glyph: '🛂' },
  { id: 'selfie', zh: '自拍验证', sub: 'Selfie', glyph: '🤳' },
]

// --- Meme (bilde/gif ELLER video) med fallback hvis fila ikke finnes ennå ---
const isVideo = (src: string) => /\.(mp4|webm|mov)$/i.test(src)

function MemeMedia({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <div className="wechat__missing">(Legg fila på {src})</div>
  if (isVideo(src)) {
    return (
      <video
        className="wechat__video"
        src={assetUrl(src)}
        autoPlay
        playsInline
        loop
        controls
        onError={() => setFailed(true)}
      />
    )
  }
  return (
    <img className="wechat__meme" src={assetUrl(src)} alt={alt} onError={() => setFailed(true)} />
  )
}

// --- Kamera-flyt (pass + selfie): live → tatt bilde → «lastet opp» = meme -----
function CameraFlow({
  facingMode,
  meme,
  doneCaption,
  onBack,
}: {
  facingMode: 'user' | 'environment'
  meme: string
  doneCaption: string
  onBack: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [phase, setPhase] = useState<'live' | 'captured' | 'done'>('live')
  const [snapshot, setSnapshot] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  // Start kamera når vi er i live-fasen; stopp alltid ved unmount.
  useEffect(() => {
    if (phase !== 'live') return
    let cancelled = false
    const md = navigator.mediaDevices
    if (!md?.getUserMedia) {
      setError('Kamera støttes ikke i denne nettleseren.')
      return
    }
    md.getUserMedia({ video: { facingMode }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        const v = videoRef.current
        if (v) {
          v.srcObject = stream
          // iOS Safari krever ekte `muted` + inline for å spille av live-strøm.
          // React sin `muted`-prop settes ikke pålitelig som DOM-property, så vi
          // setter den imperativt her — ellers blir forhåndsvisningen svart.
          v.muted = true
          v.playsInline = true
          void v.play().catch(() => {})
        }
      })
      .catch(() => !cancelled && setError('Fikk ikke tilgang til kameraet.'))
    return () => {
      cancelled = true
    }
  }, [phase, facingMode])

  useEffect(() => stopStream, [])

  function capture() {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
    setSnapshot(canvas.toDataURL('image/png'))
    stopStream()
    sfx.click()
    setPhase('captured')
  }

  if (error) {
    return (
      <div className="wechat__flow">
        <p className="notice notice--error">{error}</p>
        <button className="btn" onClick={onBack}>
          ‹ 返回 / Tilbake
        </button>
      </div>
    )
  }

  return (
    <div className="wechat__flow">
      {phase === 'live' && (
        <>
          <div className="wechat__camera">
            <video
              ref={videoRef}
              className={`wechat__video-live ${facingMode === 'user' ? 'wechat__video-live--mirror' : ''}`}
              autoPlay
              playsInline
              muted
            />
          </div>
          <button className="btn btn--primary" onClick={capture}>
            📸 Ta bilde
          </button>
        </>
      )}

      {phase === 'captured' && snapshot && (
        <>
          <div className="wechat__camera">
            <img className="wechat__shot" src={snapshot} alt="Ditt bilde" />
          </div>
          <div className="wechat__flow-actions">
            <button
              className="btn btn--primary"
              onClick={() => {
                sfx.success()
                setPhase('done')
              }}
            >
              ⬆ Last opp
            </button>
            <button className="btn" onClick={() => setPhase('live')}>
              Ta på nytt
            </button>
          </div>
        </>
      )}

      {phase === 'done' && (
        <>
          <p className="wechat__done-note">{doneCaption}</p>
          <MemeMedia src={meme} alt="verifisering" />
        </>
      )}

      <button className="wechat__back" onClick={onBack}>
        ‹ 返回 / Tilbake
      </button>
    </div>
  )
}

// --- Bankdetaljer: plausibelt kortskjema → «ferdig» = alarm.mp4 -------------
function BankFlow({ onBack }: { onBack: () => void }) {
  const [card, setCard] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [done, setDone] = useState(false)

  const digits = card.replace(/\D/g, '')
  const cardOk = digits.length === 16

  // Utløp «MM/ÅÅ» — måned 1–12, år i framtida men innen 2030.
  const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(expiry.trim())
  const now = new Date()
  const curYear = now.getFullYear() % 100
  const curMonth = now.getMonth() + 1
  let expiryOk = false
  if (m) {
    const mm = Number(m[1])
    const yy = Number(m[2])
    expiryOk =
      mm >= 1 && mm <= 12 && yy >= curYear && yy <= 30 && (yy > curYear || mm >= curMonth)
  }

  const cvvOk = /^\d{3}$/.test(cvv)
  const canSubmit = cardOk && expiryOk && cvvOk

  function formatCard(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 16)
    return d.replace(/(.{4})/g, '$1 ').trim()
  }

  if (done) {
    return (
      <div className="wechat__flow">
        <p className="wechat__done-note">⚠️ 验证失败 · Verifisering mislyktes</p>
        <MemeMedia src="case/memes/alarm.mp4" alt="alarm" />
        <button className="wechat__back" onClick={onBack}>
          ‹ 返回 / Tilbake
        </button>
      </div>
    )
  }

  return (
    <form
      className="wechat__flow wechat__bank"
      onSubmit={(e) => {
        e.preventDefault()
        if (!canSubmit) return
        sfx.click()
        setDone(true)
      }}
    >
      <label className="wechat__label">
        银行卡号 · Kortnummer
        <input
          className="field wechat__field"
          inputMode="numeric"
          autoComplete="off"
          placeholder="1234 5678 9012 3456"
          value={card}
          onChange={(e) => setCard(formatCard(e.target.value))}
        />
      </label>

      <div className="wechat__bank-row">
        <label className="wechat__label">
          有效期 · Utløp
          <input
            className="field wechat__field"
            inputMode="numeric"
            autoComplete="off"
            placeholder="MM/ÅÅ"
            maxLength={5}
            value={expiry}
            onChange={(e) => {
              const d = e.target.value.replace(/\D/g, '').slice(0, 4)
              setExpiry(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d)
            }}
          />
        </label>
        <label className="wechat__label">
          CVV
          <input
            className="field wechat__field"
            inputMode="numeric"
            autoComplete="off"
            placeholder="123"
            maxLength={3}
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
          />
        </label>
      </div>

      <button className="btn btn--primary" type="submit" disabled={!canSubmit}>
        确认 · Bekreft
      </button>
      <button className="wechat__back" type="button" onClick={onBack}>
        ‹ 返回 / Tilbake
      </button>
    </form>
  )
}

export default function WeChatApp() {
  const [chosen, setChosen] = useState<Method | null>(null)

  return (
    <AppWindow title="WeChat" icon="💬" variant="wechat">
      <div className="wechat">
        <div className="wechat__brand">
          WeChat <span className="wechat__brand-zh">微信</span>
        </div>

        <div className="wechat__verify">
          {chosen === null ? (
            <>
              <div className="wechat__lock" aria-hidden>
                🔒
              </div>
              <h2 className="wechat__title">需要身份验证</h2>
              <p className="wechat__subtitle">
                请完成实名认证以继续
                <br />
                <span className="wechat__subtitle-no">
                  Du må verifisere identiteten din for å fortsette
                </span>
              </p>
              <p className="wechat__prompt">选择验证方式 · Velg metode</p>
              <div className="wechat__methods">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    className="wechat__method"
                    onClick={() => {
                      sfx.click()
                      setChosen(m.id)
                    }}
                  >
                    <span className="wechat__method-glyph" aria-hidden>
                      {m.glyph}
                    </span>
                    <span className="wechat__method-text">
                      <span className="wechat__method-zh">{m.zh}</span>
                      <span className="wechat__method-sub">{m.sub}</span>
                    </span>
                    <span className="wechat__method-arrow" aria-hidden>
                      ›
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : chosen === 'passport' ? (
            <CameraFlow
              facingMode="environment"
              meme="case/memes/idiot.gif"
              doneCaption="护照已上传 · Dokument lastet opp ✓"
              onBack={() => setChosen(null)}
            />
          ) : chosen === 'selfie' ? (
            <CameraFlow
              facingMode="user"
              meme="case/memes/klovn.mp4"
              doneCaption="自拍已上传 · Selfie lastet opp ✓"
              onBack={() => setChosen(null)}
            />
          ) : (
            <BankFlow onBack={() => setChosen(null)} />
          )}
        </div>
      </div>
    </AppWindow>
  )
}
