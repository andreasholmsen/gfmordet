// Har spilleren sett konklusjonen (KillerReveal) i POLITI-appen? Huskes per
// enhet, samme mønster som briefing-låsen. Brukes til å holde dag 4-dokumenter
// med `afterReveal` skjult til avsløringen faktisk er sett — sluttrapporten
// skal ikke kunne leses i dag-mappen før man har åpnet saken i POLITI.
const KEY = 'gfm:fasit-sett'

export function hasSeenFasit(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function markFasitSeen(): void {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    /* privat modus e.l. — da forblir dokumentet skjult, aldri krasj */
  }
}
