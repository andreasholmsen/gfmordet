// Husker om spilleren har trykket på «START HER» minst én gang. Brukes kun til
// å la ikonet blinke til det er åpnet første gang — selve introen kan alltid
// spilles av på nytt. Tøm nøkkelen i nettleseren for å få blinkingen tilbake.
const KEY = 'gf-mordet.start.seen.v1'

export function startSeen(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function markStartSeen(): void {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    /* ignorer (privat modus e.l.) */
  }
}
