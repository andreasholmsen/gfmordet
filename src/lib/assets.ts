// Bygger en URL til en statisk fil i /public, med riktig base-prefiks
// (f.eks. '/gfmordet/') både i dev og i produksjon på GitHub Pages.
export function assetUrl(src: string): string {
  const base = import.meta.env.BASE_URL // '/gfmordet/' i prod, '/' i dev
  const clean = src.replace(/^\/+/, '')
  return `${base}${clean}`
}
