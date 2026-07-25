import type { PixelPortraitData } from '../case/manifest'

// 8-bit-portrett i samme stil som intro-cinematicen: en liten piksel-grid
// definert i manifestet (palett + tegn-rader) tegnes som skarpe SVG-rekter
// (nearest-neighbor-preg). Ingen bildefiler — skalerer skarpt overalt.

export default function PixelPortrait({
  data,
  className,
}: {
  data: PixelPortraitData
  className?: string
}) {
  const w = data.rows[0]?.length ?? 0
  const h = data.rows.length
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} shapeRendering="crispEdges" aria-hidden>
      {data.rows.flatMap((row, y) => {
        // slå sammen horisontale runs av samme tegn → langt færre rekter
        const rects = []
        let x = 0
        while (x < row.length) {
          const ch = row[x]
          let end = x + 1
          while (end < row.length && row[end] === ch) end++
          const fill = data.palette[ch]
          if (fill) rects.push(<rect key={`${y}-${x}`} x={x} y={y} width={end - x} height={1} fill={fill} />)
          x = end
        }
        return rects
      })}
    </svg>
  )
}
