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

  /** dempet fottrinn (intro-cinematic): lavt dunk + liten hæl-klikk */
  footstep() {
    tone({ freq: 96, dur: 0.1, type: 'square', gain: 0.05 })
    tone({ freq: 150, dur: 0.04, type: 'triangle', gain: 0.025, delay: 0.02 })
  },

  /** dør som knirker opp: langsom nedadgående sag i trinn */
  doorCreak() {
    for (let i = 0; i < 6; i++) {
      tone({ freq: 280 - i * 28, dur: 0.12, type: 'sawtooth', gain: 0.03, delay: i * 0.08 })
    }
  },

  /** hjerteslag: to lave dunk («du-dunk») */
  heartbeat() {
    tone({ freq: 64, dur: 0.13, type: 'sine', gain: 0.07 })
    tone({ freq: 56, dur: 0.16, type: 'sine', gain: 0.06, delay: 0.18 })
  },

  /** sjokk-sting når liket avsløres: dissonant cluster + lav buldring */
  sting() {
    tone({ freq: 110, dur: 0.6, type: 'sawtooth', gain: 0.05 })
    tone({ freq: 932, dur: 0.5, type: 'sawtooth', gain: 0.03 })
    tone({ freq: 988, dur: 0.5, type: 'sawtooth', gain: 0.03, delay: 0.02 })
  },

  /** «hacket»-glitch: rask rekke dissonante digitale toner */
  glitch() {
    const freqs = [880, 120, 1500, 300, 2000, 90, 1200, 240]
    freqs.forEach((f, i) =>
      tone({ freq: f, dur: 0.05, type: 'sawtooth', gain: 0.045, delay: i * 0.045 }),
    )
  },
}
