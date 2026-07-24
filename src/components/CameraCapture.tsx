import { useEffect, useRef, useState } from 'react'
import { sfx } from '../lib/sfx'

// Gjenbrukbart kamera i nettleseren (getUserMedia) — så Android IKKE åpner den
// native kamera-appen. Live-forhåndsvisning + lukker, med «velg fra galleri» som
// reserve. Tatt bilde vises til bekreftelse; ved «bruk» kalles onConfirm(blob).
// onConfirm gjør det den vil (laste opp / lagre lokalt) og kan kaste ved feil.
type Phase = 'camera' | 'preview'

export default function CameraCapture({
  defaultFacing = 'environment',
  confirmLabel = 'Bruk bildet',
  onConfirm,
  onClose,
}: {
  defaultFacing?: 'environment' | 'user'
  confirmLabel?: string
  onConfirm: (blob: Blob) => Promise<void> | void
  onClose: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [phase, setPhase] = useState<Phase>('camera')
  const [facing, setFacing] = useState<'environment' | 'user'>(defaultFacing)
  const [shot, setShot] = useState<{ blob: Blob; url: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  // Start (og bytt) kamera mens vi er i «camera»-fasen.
  useEffect(() => {
    if (phase !== 'camera') return
    let cancelled = false
    const md = navigator.mediaDevices
    if (!md?.getUserMedia) {
      setError('Kamera støttes ikke her — velg et bilde fra galleriet i stedet.')
      return
    }
    md.getUserMedia({ video: { facingMode: facing }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        const v = videoRef.current
        if (v) {
          v.srcObject = stream
          v.muted = true
          v.playsInline = true
          void v.play().catch(() => {})
        }
      })
      .catch(() => !cancelled && setError('Fikk ikke tilgang til kameraet. Sjekk tillatelser, eller velg fra galleriet.'))
    return () => {
      cancelled = true
      stopStream()
    }
  }, [phase, facing])

  // Rydd opp forhåndsvisnings-URL.
  useEffect(() => {
    return () => {
      if (shot) URL.revokeObjectURL(shot.url)
    }
  }, [shot])

  function capture() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        sfx.click()
        stopStream()
        setShot({ blob, url: URL.createObjectURL(blob) })
        setPhase('preview')
      },
      'image/jpeg',
      0.92, // høy her; compressImage skalerer/komprimerer ved opplasting
    )
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    sfx.click()
    stopStream()
    setShot({ blob: file, url: URL.createObjectURL(file) })
    setPhase('preview')
  }

  function retake() {
    if (shot) URL.revokeObjectURL(shot.url)
    setShot(null)
    setError(null)
    setPhase('camera')
  }

  async function confirm() {
    if (!shot || busy) return
    setBusy(true)
    setError(null)
    try {
      await onConfirm(shot.blob)
      sfx.success()
      onClose()
    } catch (err) {
      sfx.error()
      setBusy(false)
      setError(err instanceof Error ? err.message : 'Kunne ikke lagre bildet.')
    }
  }

  return (
    <div className="composer" role="dialog" aria-label="Ta bilde">
      <div className="composer__top">
        <button className="composer__close" aria-label="Lukk" onClick={onClose}>
          ✕
        </button>
        {phase === 'camera' && !error && (
          <button
            className="composer__flip"
            aria-label="Bytt kamera"
            onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
          >
            🔄
          </button>
        )}
      </div>

      {phase === 'camera' ? (
        error ? (
          <div className="composer__error">
            <p className="notice notice--error">{error}</p>
            <button className="btn btn--primary" onClick={() => fileRef.current?.click()}>
              🖼 Velg fra galleri
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className={`composer__video ${facing === 'user' ? 'composer__video--mirror' : ''}`}
              autoPlay
              playsInline
              muted
            />
            <div className="composer__controls">
              <button className="composer__gallery" aria-label="Velg fra galleri" onClick={() => fileRef.current?.click()}>
                🖼
              </button>
              <button className="composer__shutter" aria-label="Ta bilde" onClick={capture} />
              <span className="composer__spacer" aria-hidden />
            </div>
          </>
        )
      ) : (
        shot && (
          <>
            <img className={`composer__preview ${facing === 'user' ? 'composer__video--mirror' : ''}`} src={shot.url} alt="Ditt bilde" />
            {error && <p className="notice notice--error composer__error-line">{error}</p>}
            <div className="composer__controls composer__controls--preview">
              <button className="btn" onClick={retake} disabled={busy}>
                Ta på nytt
              </button>
              <button className="btn btn--primary" onClick={confirm} disabled={busy}>
                {busy ? 'Jobber …' : confirmLabel}
              </button>
            </div>
          </>
        )
      )}

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickFile} />
    </div>
  )
}
