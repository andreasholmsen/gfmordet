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
 * Selve scrolleren er nærmeste `.window__body` (vinduets rullefelt). Minnet
 * lever så lenge komponenten er montert (ikke på tvers av vinduer — bevisst).
 */
export function useScrollMemory(key: string, enabled = true) {
  const anchor = useRef<HTMLDivElement | null>(null)
  const positions = useRef(new Map<string, number>())

  // Lagre løpende mens man scroller (posisjonen finnes da alltid ved bytte).
  useEffect(() => {
    if (!enabled) return
    const scroller = anchor.current?.closest('.window__body')
    if (!scroller) return
    const onScroll = () => positions.current.set(key, scroller.scrollTop)
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => scroller.removeEventListener('scroll', onScroll)
  }, [key, enabled])

  // Ved visningsbytte: gjenopprett lagret posisjon før paint (0 hvis ny).
  useLayoutEffect(() => {
    if (!enabled) return
    const scroller = anchor.current?.closest('.window__body')
    if (scroller) scroller.scrollTop = positions.current.get(key) ?? 0
  }, [key, enabled])

  return anchor
}
