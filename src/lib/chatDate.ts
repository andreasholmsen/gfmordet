// Dato-delen av en fritekst-tid: '15.4.2026 12:36' → '15.4.2026',
// '13. juni 2026 00:37' → '13. juni 2026', 'lør 20:12' → 'lør'.
// Brukes til å legge inn dato-skiller (piller) i meldingstråder når to
// meldinger er fra ulike dager. Kun klokkeslett ('21:47') gir tom streng.
export function dayPart(time?: string): string {
  if (!time) return ''
  return time.replace(/\s*\d{1,2}[:.]\d{2}$/, '').trim()
}
