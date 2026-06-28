// Retro-lydeffekter syntetisert med WebAudio — ingen lydfiler i repoet.
// AudioContext opprettes først ved første brukerinteraksjon (mobil blokkerer
// lyd før det uansett). Demping styres av SettingsContext via setMuted().

let muted = false
let ctx: AudioContext | null = null

export function setMuted(value: boolean): void {
  muted = value
}

function audio(): AudioContext | null {
  if (muted) return null
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctx = new Ctor()
    }
    // Safari/Chrome kan starte i 'suspended' før en gest — prøv å vekke den.
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

interface ToneOpts {
  freq: number
  /** sekunder */
  dur: number
  type?: OscillatorType
  /** topp-volum 0..1 */
  gain?: number
  /** forsinkelse i sekunder før tonen starter */
  delay?: number
}

function tone({ freq, dur, type = 'square', gain = 0.05, delay = 0 }: ToneOpts): void {
  const ac = audio()
  if (!ac) return
  const start = ac.currentTime + delay
  const osc = ac.createOscillator()
  const env = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  // Liten attack + exponential decay for et knapp/blip-preg.
  env.gain.setValueAtTime(0.0001, start)
  env.gain.exponentialRampToValueAtTime(gain, start + 0.005)
  env.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(env).connect(ac.destination)
  osc.start(start)
  osc.stop(start + dur + 0.02)
}

export const sfx = {
  /** kort terminal-blip (boot-linjer) */
  beep() {
    tone({ freq: 660, dur: 0.05, gain: 0.035 })
  },
  /** vindu åpnes: rask oppadgående sveip */
  openWindow() {
    tone({ freq: 380, dur: 0.06, gain: 0.04 })
    tone({ freq: 620, dur: 0.07, gain: 0.04, delay: 0.05 })
  },
  /** vindu lukkes: nedadgående */
  closeWindow() {
    tone({ freq: 520, dur: 0.06, gain: 0.04 })
    tone({ freq: 300, dur: 0.07, gain: 0.04, delay: 0.05 })
  },
  /** generelt klikk */
  click() {
    tone({ freq: 440, dur: 0.03, gain: 0.03 })
  },
  /** stemme registrert: liten oppløftende akkord */
  success() {
    tone({ freq: 523, dur: 0.1, gain: 0.045 })
    tone({ freq: 659, dur: 0.1, gain: 0.045, delay: 0.09 })
    tone({ freq: 784, dur: 0.16, gain: 0.045, delay: 0.18 })
  },
  /** feil: lav dobbel-tone */
  error() {
    tone({ freq: 200, dur: 0.12, type: 'sawtooth', gain: 0.04 })
    tone({ freq: 160, dur: 0.16, type: 'sawtooth', gain: 0.04, delay: 0.12 })
  },
  /** «tilgang innvilget»-fanfare på slutten av booten */
  granted() {
    tone({ freq: 440, dur: 0.09, gain: 0.05 })
    tone({ freq: 587, dur: 0.09, gain: 0.05, delay: 0.1 })
    tone({ freq: 880, dur: 0.22, gain: 0.05, delay: 0.2 })
  },
}
