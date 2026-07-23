// Komprimerer bilder PÅ ENHETEN før opplasting, så vi ikke sender 3–8 MB
// telefonbilder til Supabase Storage. Skalerer ned til maks `maxDim` px på
// lengste side og lagrer som JPEG. Håndterer EXIF-rotasjon der nettleseren
// støtter det (createImageBitmap { imageOrientation }).

export interface CompressOptions {
  maxDim?: number
  quality?: number
}

async function loadBitmap(file: Blob): Promise<{ width: number; height: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; close: () => void }> {
  // Foretrukket vei: createImageBitmap med EXIF-orientering.
  if ('createImageBitmap' in window) {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return {
        width: bmp.width,
        height: bmp.height,
        draw: (ctx, w, h) => ctx.drawImage(bmp, 0, 0, w, h),
        close: () => bmp.close(),
      }
    } catch {
      /* fall through til <img> */
    }
  }
  // Fallback: last via <img> (ingen EXIF-korreksjon, men fungerer overalt).
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Kunne ikke lese bildet'))
      el.src = url
    })
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
      close: () => URL.revokeObjectURL(url),
    }
  } catch (e) {
    URL.revokeObjectURL(url)
    throw e
  }
}

/** Komprimer + skaler ned et bilde (File fra galleri ELLER Blob fra kamera-canvas).
 *  Returnerer en JPEG-Blob. */
export async function compressImage(
  file: Blob,
  { maxDim = 1080, quality = 0.8 }: CompressOptions = {},
): Promise<Blob> {
  const src = await loadBitmap(file)
  try {
    const scale = Math.min(1, maxDim / Math.max(src.width, src.height))
    const w = Math.max(1, Math.round(src.width * scale))
    const h = Math.max(1, Math.round(src.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas støttes ikke')
    src.draw(ctx, w, h)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    )
    if (!blob) throw new Error('Kunne ikke komprimere bildet')
    return blob
  } finally {
    src.close()
  }
}
