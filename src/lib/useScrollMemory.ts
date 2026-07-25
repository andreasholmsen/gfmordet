import { useEffect, useLayoutEffect, useRef } from 'react'

/**
 * Husk scrolleposisjonen per «visning» i et vindu (liste ↔ åpnet element).
 *
 * Bruk: `const anchor = useScrollMemory(key)` og fest `ref={anchor}` på en div
 * som alltid er montert i komponenten. `key` identifiserer visningen (f.eks.
 * 'list' eller `chat:${id}`). Posisjonen lagres løpende for gjeldende nøkkel,
 * og gjenopprettes (før paint) når nøkkelen endres — så «← Tilbake» lander der
 * man var, og aldri-besøkte visninger starter på toppen.
 *
 * Scrolleren er visningens `[data-scroll]`-element (indre rullefelt, f.eks.
 * meldingslisten i telefonen) hvis det finnes — ellers nærmeste
 * `.window__body` (vinduets rullefelt). Minnet lever så lenge komponenten er
 * montert (ikke på tvers av vinduer — bevisst).
 */
export function useScrollMemory(key: string, enabled = true) {
  const anchor = useRef<HTMLDivElement | null>(null)
  const positions = useRef(new Map<string, number>())

  const findScroller = () =>
    anchor.current?.querySelector('[data-scroll]') ?? anchor.current?.closest('.window__body')

  // Lagre løpende mens man scroller (posisjonen finnes da alltid ved bytte).
  useEffect(() => {
    if (!enabled) return
    const scroller = findScroller()
    if (!scroller) return
    const onScroll = () => positions.current.set(key, scroller.scrollTop)
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => scroller.removeEventListener('scroll', onScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled])

  // Ved visningsbytte: gjenopprett lagret posisjon før paint (0 hvis ny).
  useLayoutEffect(() => {
    if (!enabled) return
    const scroller = findScroller()
    if (scroller) scroller.scrollTop = positions.current.get(key) ?? 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled])

  return anchor
}
