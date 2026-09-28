/**
 * The summoning circle, drawn as pixel art on a grid laid flat on the
 * floor.
 *
 * It is rasterised here rather than squashed with a CSS transform: a
 * `scaleY` on a round circle would make its pixels three times wider
 * than they are tall, off the room's square grid. Plotting an ellipse
 * directly keeps every pixel square and still reads as a ring seen from
 * above at an angle.
 *
 * Built as separate parts — rings, star, each rune — so they can be lit
 * one after another rather than all at once.
 */

/** Grid size, in art pixels. Wide and shallow: a circle on the floor. */
export const CIRCLE_W = 61
export const CIRCLE_H = 19

const CX = (CIRCLE_W - 1) / 2
const CY = (CIRCLE_H - 1) / 2

type Pixel = [number, number]

function ellipse(rx: number, ry: number): Pixel[] {
  const seen = new Set<string>()
  const out: Pixel[] = []
  // Enough steps that neighbouring samples never skip a pixel.
  const steps = Math.ceil(2 * Math.PI * Math.max(rx, ry) * 2)
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2
    const x = Math.round(CX + rx * Math.cos(a))
    const y = Math.round(CY + ry * Math.sin(a))
    const key = `${x},${y}`
    if (!seen.has(key)) {
      seen.add(key)
      out.push([x, y])
    }
  }
  return out
}

/** Bresenham, so the star's lines are one clean pixel wide. */
function line([x0, y0]: Pixel, [x1, y1]: Pixel): Pixel[] {
  const out: Pixel[] = []
  const dx = Math.abs(x1 - x0)
  const dy = -Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx + dy
  let x = x0
  let y = y0
  for (;;) {
    out.push([x, y])
    if (x === x1 && y === y1) break
    const e2 = 2 * err
    if (e2 >= dy) {
      err += dy
      x += sx
    }
    if (e2 <= dx) {
      err += dx
      y += sy
    }
  }
  return out
}

/* Eight made-up glyphs, 3x3 each. Cryptic on purpose: none of them is a
   real letter, so nothing reads as a word. */
const GLYPHS = [
  ['x.x', '.x.', 'x.x'],
  ['xxx', '.x.', '.x.'],
  ['x..', 'xxx', '..x'],
  ['.x.', 'xxx', '.x.'],
  ['xx.', '.x.', '.xx'],
  ['x.x', 'xxx', 'x.x'],
  ['.xx', 'x..', '.xx'],
  ['xxx', 'x.x', 'x..'],
]

/** Pixels to one SVG path of unit squares, which is far lighter than a
    rect per pixel and still renders with hard edges. */
function toPath(pixels: Pixel[]): string {
  return pixels.map(([x, y]) => `M${x} ${y}h1v1h-1z`).join('')
}

export interface CirclePart {
  key: string
  kind: 'ring' | 'star' | 'rune'
  d: string
}

function build(): CirclePart[] {
  const parts: CirclePart[] = []
  parts.push({ key: 'outer', kind: 'ring', d: toPath(ellipse(29.5, 8.5)) })
  parts.push({ key: 'inner', kind: 'ring', d: toPath(ellipse(20.5, 4.8)) })

  // A pentagram inside the inner ring, pointing away from the viewer.
  const points: Pixel[] = Array.from({ length: 5 }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5
    return [Math.round(CX + 18.5 * Math.cos(a)), Math.round(CY + 4 * Math.sin(a))]
  })
  const star: Pixel[] = []
  for (let i = 0; i < 5; i++) star.push(...line(points[i], points[(i + 2) % 5]))
  parts.push({ key: 'star', kind: 'star', d: toPath(star) })

  // Runes in the band between the rings, clockwise from the front.
  GLYPHS.forEach((glyph, i) => {
    const a = Math.PI / 2 + (i * 2 * Math.PI) / GLYPHS.length
    const gx = Math.round(CX + 25 * Math.cos(a)) - 1
    const gy = Math.round(CY + 6.7 * Math.sin(a)) - 1
    const pixels: Pixel[] = []
    glyph.forEach((row, y) =>
      [...row].forEach((c, x) => {
        if (c === 'x') pixels.push([gx + x, gy + y])
      }),
    )
    parts.push({ key: `rune-${i}`, kind: 'rune', d: toPath(pixels) })
  })

  return parts
}

export const CIRCLE_PARTS = build()
