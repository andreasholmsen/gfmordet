import { useEffect, useRef, useState } from 'react'
import { sfx } from '../lib/sfx'

// 8-bit POV-cinematic som spilles etter boot-skjermen: du går nedover en mørk
// gang, døra knirker opp, og rommet avslører offeret på gulvet. Alt tegnes på en
// lav-oppløst canvas (160×120) som skaleres opp med nearest-neighbor for ekte
// pikselpreg. Hoppes over ved trykk. Respekterer prefers-reduced-motion (ingen
// blinking/rød-flash da — bare et stille, statisk åsted).

const VW = 160 // intern bredde (piksler)
const VH = 120 // intern høyde

// Tidslinje i millisekunder
const T = {
  approach: 2600, // gå mot døra
  open: 3500, // døra knirker opp
  flash: 4100, // steg inn i lyset (overeksponert blink)
  reveal: 4900, // rommet toner inn
  push: 7000, // sakte zoom inn mot offeret
  sting: 7250, // sjokk-sting + tittel
  fade: 600, // utfading ved klikk
}
// Når scenen er ferdig fryser vi her og viser tittelen — introen venter på et
// klikk før den går videre, så folk rekker å lese tittelen.
const END = T.sting

// Lyder fyres når elapsed passerer disse tidspunktene (én gang hver).
const CUES: Array<{ at: number; fn: () => void }> = [
  { at: 300, fn: () => sfx.footstep() },
  { at: 850, fn: () => sfx.footstep() },
  { at: 1400, fn: () => sfx.footstep() },
  { at: 1950, fn: () => sfx.footstep() },
  { at: 2500, fn: () => sfx.footstep() },
  { at: 2620, fn: () => sfx.doorCreak() },
  { at: 3550, fn: () => sfx.footstep() },
  { at: 5000, fn: () => sfx.heartbeat() },
  { at: 5900, fn: () => sfx.heartbeat() },
  { at: 6800, fn: () => sfx.heartbeat() },
  { at: 7000, fn: () => sfx.sting() },
]

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
// myk inn/ut
const ease = (t: number) => {
  const x = clamp01(t)
  return x * x * (3 - 2 * x)
}

export default function CrimeSceneIntro({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fading, setFading] = useState(false)
  const [showTitle, setShowTitle] = useState(false)
  const done = useRef(false)
  const raf = useRef(0)

  function finish() {
    if (done.current) return
    done.current = true
    cancelAnimationFrame(raf.current)
    setFading(true) // myk utfading, så kall onDone
    window.setTimeout(onDone, T.fade)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      finish()
      return
    }
    const g: CanvasRenderingContext2D = ctx
    g.imageSmoothingEnabled = false

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // ---- tegnehjelpere ------------------------------------------------------
    const r = (x: number, y: number, w: number, h: number, color: string) => {
      g.fillStyle = color
      g.fillRect(x, y, w, h)
    }
    const poly = (pts: Array<[number, number]>, color: string) => {
      g.fillStyle = color
      g.beginPath()
      g.moveTo(pts[0][0], pts[0][1])
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1])
      g.closePath()
      g.fill()
    }
    const el = (cx: number, cy: number, rx: number, ry: number, color: string) => {
      g.fillStyle = color
      g.beginPath()
      g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      g.fill()
    }

    // Gang i falsk perspektiv: vegger/tak/gulv som trapeser inn mot døra.
    function corridor(approach: number, bobX: number, bobY: number) {
      const cx = VW / 2 + bobX
      const cy = 54 + bobY
      const dw = lerp(22, 150, approach)
      const dh = lerp(38, 128, approach)
      const dl = cx - dw / 2
      const dt = cy - dh / 2
      const dr = cx + dw / 2
      const db = cy + dh / 2
      r(0, 0, VW, VH, '#05060a')
      poly([[0, 0], [VW, 0], [dr, dt], [dl, dt]], '#16161f') // tak
      poly([[0, VH], [VW, VH], [dr, db], [dl, db]], '#241c14') // gulv
      poly([[0, 0], [dl, dt], [dl, db], [0, VH]], '#1b1b26') // venstre vegg
      poly([[VW, 0], [dr, dt], [dr, db], [VW, VH]], '#23232f') // høyre vegg
      // gulvbord-skjøter for følelse av bevegelse
      g.strokeStyle = 'rgba(0,0,0,0.35)'
      g.lineWidth = 1
      for (let i = 1; i <= 3; i++) {
        const t = i / 4
        const y = lerp(db, VH, t)
        g.beginPath()
        g.moveTo(lerp(dl, 0, t), y)
        g.lineTo(lerp(dr, VW, t), y)
        g.stroke()
      }
      return { dl, dt, dr, db, dw, dh, cx, cy }
    }

    function closedDoor(d: ReturnType<typeof corridor>) {
      r(d.dl, d.dt, d.dw, d.dh, '#5a3a22') // dørblad
      r(d.dl, d.dt, d.dw, 2, '#7a5230') // ramme topp
      r(d.dl, d.dt, 2, d.dh, '#7a5230')
      r(d.dr - 2, d.dt, 2, d.dh, '#3c2715')
      // paneler
      const pw = d.dw * 0.34
      const ph = d.dh * 0.36
      r(d.dl + d.dw * 0.12, d.dt + d.dh * 0.1, pw, ph, '#46301d')
      r(d.dl + d.dw * 0.54, d.dt + d.dh * 0.1, pw, ph, '#46301d')
      r(d.dl + d.dw * 0.12, d.dt + d.dh * 0.54, pw, ph, '#46301d')
      r(d.dl + d.dw * 0.54, d.dt + d.dh * 0.54, pw, ph, '#46301d')
      // håndtak
      r(d.dl + d.dw * 0.86, d.cy, Math.max(2, d.dw * 0.05), 3, '#d8c34a')
    }

    function openingDoor(d: ReturnType<typeof corridor>, open: number) {
      const e = ease(open)
      // mørkt rom bak døra (svart → mørk grå)
      const grad = g.createLinearGradient(d.dl, 0, d.dr, 0)
      grad.addColorStop(0, '#060608')
      grad.addColorStop(0.5, '#15151b')
      grad.addColorStop(1, '#0c0c10')
      g.fillStyle = grad
      g.fillRect(d.dl, d.dt, d.dw, d.dh)

      // Døra svinger opp, hengslet på VENSTRE side. Den projiserte bredden
      // krymper mot hengselet, og den frie kanten trekker seg «innover» (topp/
      // bunn skrår inn) → trapes som leser som ett dørblad som åpnes fra siden.
      const hingeX = d.dl
      const leafW = d.dw * (1 - e)
      const farX = hingeX + leafW
      const inset = d.dh * 0.16 * e
      poly(
        [
          [hingeX, d.dt],
          [farX, d.dt + inset],
          [farX, d.db - inset],
          [hingeX, d.db],
        ],
        '#5a3a22',
      )
      // skyggekant på den frie (fjerne) kanten
      poly(
        [
          [farX - 2, d.dt + inset],
          [farX, d.dt + inset],
          [farX, d.db - inset],
          [farX - 2, d.db - inset],
        ],
        '#3c2715',
      )
      // høylys + hengsel på venstre kant
      r(hingeX, d.dt, 2, d.dh, '#7a5230')
      // dørhåndtak nær den frie kanten
      if (leafW > 6) r(farX - 4, d.cy - 1, 2, 3, '#d8c34a')
    }

    // Liket: stilisert, ikke grafisk, INGEN blod. Asiatisk utseende, langt svart
    // hår som vifter naturlig ut rundt hodet. Liggende på ryggen, hodet til
    // venstre, føttene mot høyre. (verdens-koordinater, fokuspunkt ~84,92)
    function victim() {
      const hair = '#0a0a0f'
      const skin = '#d8a87e'
      const skinSh = '#c4946a'
      const dress = '#9c2f63' // festkjole (skinnende magenta)
      const dressHi = '#cf6499'

      // langt svart hår – vifter ut rundt og bak hodet, flyter mot venstre
      el(70, 92, 12, 11, hair) // hårmasse rundt hodet
      el(60, 88, 8, 6, hair) // strå som flyter oppover/utover
      el(61, 98, 7, 5, hair) // strå nedover
      el(52, 92, 6, 4, hair) // ytterste tupp mot venstre
      // ansikt (vendt opp mot taket)
      el(72, 92, 5.5, 6, skin)
      el(74, 94, 3.5, 3, skinSh) // svak kinnskygge
      // lukkede mørke øyne + antydet munn
      r(70, 90, 2, 1, '#15101a')
      r(74, 90, 2, 1, '#15101a')
      r(71, 94, 3, 1, 'rgba(150,90,90,0.45)')
      // hals
      r(76, 90, 4, 4, skin)

      // venstre arm strukket ut over hodet (oppover på bildet) – slank
      r(82, 86, 3, 5, dress) // erme
      el(81, 81, 2, 4, skin) // underarm
      el(80, 78, 2.5, 2.5, skin) // hånd

      // slank overkropp → smal midje (festkjole)
      el(87, 92, 8, 5, dress)
      el(98, 92, 7, 4, dress) // markert smalere midje
      // paljett-glimt
      r(85, 90, 1, 1, dressHi)
      r(90, 93, 1, 1, dressHi)
      r(95, 91, 1, 1, dressHi)
      r(99, 92, 1, 1, dressHi)

      // smalt skjørt + slanke ben mot høyre
      el(105, 92, 7, 4, dress)
      r(112, 91, 11, 2, skin) // ben (tett sammen)
      r(112, 93, 11, 2, skin)
      el(123, 91, 2.5, 1.5, '#2a2230') // sko
      el(123, 93, 2.5, 1.5, '#2a2230')

      // veltet drink ved hånden (festdetalj – ikke blod)
      el(80, 73, 2, 2, 'rgba(190,220,235,0.7)') // glass
      r(79, 74, 5, 1, 'rgba(150,190,215,0.35)') // sølt drikke
    }

    function room(push: number) {
      r(0, 0, VW, VH, '#0c0d12')
      g.save()
      // zoom mot offeret: punkt P havner i skjermpunkt S, skalert
      const s = lerp(1, 1.42, ease(push))
      const Px = 84
      const Py = 92
      const Sx = VW / 2
      const Sy = 66
      g.translate(Sx, Sy)
      g.scale(s, s)
      g.translate(-Px, -Py)

      // festlokale: mørk lilla vegg + parkettgulv
      r(-40, -20, VW + 80, 92, '#211a2e')
      r(-40, 14, VW + 80, 4, '#2c2340') // listverk
      r(-40, 70, VW + 80, VH, '#3a2a1c') // parkett
      for (let i = 0; i < 8; i++) r(-40 + i * 30, 70, 1, VH, 'rgba(0,0,0,0.28)') // gulvbord

      // fargede diskolys-pøler på gulvet
      el(84, 96, 40, 16, 'rgba(120,40,150,0.13)')
      el(58, 104, 26, 10, 'rgba(40,150,170,0.12)')
      el(112, 100, 24, 9, 'rgba(200,60,120,0.11)')

      // vimpel-girlander (bunting) langs taket
      const flags = ['#e34b4b', '#e3c14b', '#4bd0e3', '#7be34b', '#e34bb0']
      r(-40, 2, VW + 80, 1, '#000') // snor
      for (let i = 0; i < 10; i++) {
        const x = -30 + i * 22
        poly([[x, 2], [x + 16, 2], [x + 8, 14]], flags[i % flags.length])
      }

      // lyslenke langs veggen
      const dots = ['#ffd34b', '#ff7bd0', '#7bffea', '#b07bff']
      for (let i = 0; i < 12; i++) r(-30 + i * 16, 24 + (i % 2) * 4, 2, 2, dots[i % dots.length])

      // diskokule i taket med svake lysstråler
      r(80, 2, 1, 12, '#555') // snor
      poly([[80, 18], [62, 44], [70, 44]], 'rgba(190,205,255,0.07)')
      poly([[80, 18], [98, 44], [90, 44]], 'rgba(190,205,255,0.07)')
      el(80, 18, 7, 7, '#9aa6c8')
      el(78, 16, 2, 2, '#eef2ff')
      el(82, 20, 1, 1, '#eef2ff')

      // ballonger i hjørnene (med snor)
      const balloon = (x: number, y: number, c: string) => {
        el(x, y, 5, 6, c)
        r(x, y + 6, 1, 8, 'rgba(0,0,0,0.4)')
      }
      balloon(16, 26, '#e34b4b')
      balloon(26, 32, '#4bd0e3')
      balloon(140, 24, '#e3c14b')
      balloon(131, 31, '#7be34b')

      // festbord til høyre med flasker/kopper (noen veltet)
      r(118, 58, 30, 4, '#5a4632') // bordplate
      r(120, 62, 2, 12, '#46351f')
      r(144, 62, 2, 12, '#46351f')
      r(122, 50, 3, 8, '#3aa05a') // flaske
      r(128, 52, 3, 6, '#a03a4a') // flaske
      r(134, 54, 4, 4, '#cfd6e0') // kopp
      r(139, 57, 6, 2, '#a03a4a') // veltet flaske

      // konfetti strødd på gulvet (under offeret)
      const conf = ['#e34b4b', '#e3c14b', '#4bd0e3', '#7be34b', '#e34bb0', '#ffffff']
      const cf: Array<[number, number]> = [
        [40, 84], [54, 92], [66, 102], [78, 86], [92, 106], [104, 86],
        [118, 98], [58, 110], [96, 88], [72, 110], [128, 92], [46, 100],
        [110, 108], [88, 98], [34, 92], [124, 104],
      ]
      cf.forEach((p, i) => r(p[0], p[1], 2, 2, conf[i % conf.length]))

      victim()

      g.restore()

      // vignett
      const vg = g.createRadialGradient(VW / 2, 60, 30, VW / 2, 64, 110)
      vg.addColorStop(0, 'rgba(0,0,0,0)')
      vg.addColorStop(1, 'rgba(0,0,0,0.68)')
      g.fillStyle = vg
      g.fillRect(0, 0, VW, VH)
    }

    // ---- én ramme -----------------------------------------------------------
    function frame(elapsed: number) {
      const walking = elapsed < T.flash
      const bobY = walking ? Math.sin(elapsed / 150) * 1.6 : 0
      const bobX = walking ? Math.sin(elapsed / 300) * 1.1 : 0

      if (elapsed <= T.approach) {
        const a = ease(elapsed / T.approach)
        const d = corridor(a, bobX, bobY)
        closedDoor(d)
      } else if (elapsed <= T.open) {
        const d = corridor(1, bobX, bobY)
        openingDoor(d, (elapsed - T.approach) / (T.open - T.approach))
      } else if (elapsed <= T.flash) {
        const d = corridor(1, bobX, bobY)
        openingDoor(d, 1)
        // overeksponert blink ved dørterskelen. Ved redusert bevegelse dempes
        // det til en mild dis (ingen blendende blink) — men scenen spilles.
        const a = ease((elapsed - T.open) / (T.flash - T.open))
        g.fillStyle = `rgba(255,236,200,${reduce ? a * 0.25 : a})`
        g.fillRect(0, 0, VW, VH)
      } else {
        const push = (elapsed - T.reveal) / (T.push - T.reveal)
        room(push)
        // ton inn fra det varme blinket (dempet ved redusert bevegelse)
        if (elapsed < T.reveal) {
          const a = 1 - ease((elapsed - T.flash) / (T.reveal - T.flash))
          g.fillStyle = `rgba(255,236,200,${reduce ? a * 0.25 : a})`
          g.fillRect(0, 0, VW, VH)
        }
        // rød sjokk-puls ved stingen — hoppes helt over ved redusert bevegelse
        if (!reduce && elapsed >= T.push) {
          const p = (elapsed - T.push) / (T.sting - T.push)
          const a = Math.max(0, 0.5 * (1 - p))
          g.fillStyle = `rgba(150,10,16,${a})`
          g.fillRect(0, 0, VW, VH)
        }
      }

      // CRT-scanlinjer over hele
      g.fillStyle = 'rgba(0,0,0,0.16)'
      for (let y = 0; y < VH; y += 2) g.fillRect(0, y, VW, 1)
    }

    // Merk: tidligere hoppet vi rett til et statisk slutt-bilde ved redusert
    // bevegelse. Men mobiler i strømsparingsmodus (iOS Low Power Mode) tvinger
    // på prefers-reduced-motion, så cinematicen ble aldri vist. Nå spilles
    // animasjonen for alle — de harde blinkene dempes/utelates over (se `frame`).

    // ---- animasjonsløkke ----------------------------------------------------
    const start = performance.now()
    let firedTitle = false
    const fired = new Array(CUES.length).fill(false)

    const loop = (now: number) => {
      const elapsed = now - start
      frame(Math.min(elapsed, END))

      for (let i = 0; i < CUES.length; i++) {
        if (!fired[i] && elapsed >= CUES[i].at) {
          fired[i] = true
          CUES[i].fn()
        }
      }
      if (!firedTitle && elapsed >= T.sting) {
        firedTitle = true
        setShowTitle(true)
      }
      // Fryser på slutt-bildet og venter på klikk — ingen auto-avslutning.
      if (elapsed < END) raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)

    return () => cancelAnimationFrame(raf.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className={`intro ${fading ? 'intro--out' : ''}`}
      onClick={finish}
      role="img"
      aria-label="Animasjon: du går inn på åstedet og finner offeret"
    >
      <canvas ref={canvasRef} className="intro__canvas" width={VW} height={VH} />
      {showTitle && (
        <div className="intro__title" aria-hidden>
          <div className="intro__title-main">GF-MORDET</div>
          <div className="intro__title-sub">Drapet på Angela Liu</div>
        </div>
      )}
      <div className={`intro__hint ${showTitle ? 'intro__hint--pulse' : ''}`} aria-hidden>
        {showTitle ? 'trykk for å fortsette' : 'trykk for å hoppe over'}
      </div>
    </div>
  )
}
