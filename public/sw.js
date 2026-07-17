// Service worker: cacher statiske mediefiler (bilder/gif/svg/pdf) slik at de
// ikke lastes ned på nytt hver gang. Cache-first = først-hit fra cachen, ellers
// hent fra nett og legg i cache.
//
// Bevisst UTELATT:
//  - Video (mp4/webm): nettleseren sender Range-forespørsler for spoling, og en
//    cachet 200-respons bryter det. Lar dem gå rett til nett (nettleser-cache).
//  - JS/CSS/HTML: Vite gir dem innholds-hash i filnavnet (auto cache-busting),
//    så vi lar app-skallet oppdatere seg normalt ved nye deploy.
//
// MERK: cache-first betyr at en fil som byttes ut PÅ SAMME sti kan vises fra
// cache til denne SW-en oppdateres. Bytt filnavn (eller bump CACHE under) når du
// erstatter et bilde in-place.
const CACHE = 'gfmordet-media-v1'
const MEDIA_RE = /\.(png|jpe?g|gif|webp|avif|svg|pdf)$/i

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  if (req.headers.has('range')) return // ikke rør delvis-innhold (media-spoling)

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (!MEDIA_RE.test(url.pathname)) return

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      const hit = await cache.match(req)
      if (hit) return hit
      try {
        const res = await fetch(req)
        // Bare cache hele, gyldige svar (ikke opaque/feil).
        if (res && res.status === 200 && res.type === 'basic') {
          cache.put(req, res.clone())
        }
        return res
      } catch (err) {
        // Offline og ikke i cache — la det feile som vanlig.
        throw err
      }
    })(),
  )
})
