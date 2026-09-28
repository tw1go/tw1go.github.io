import type { CSSProperties } from 'react'
import { CIRCLE_H, CIRCLE_PARTS, CIRCLE_W } from './circle'

/* Lighting order, as step numbers: the outer ring first, then the runes
   one by one round the circle, then the inner ring and the star at the
   centre — the ritual closing in on the point the fork comes out of.
   Going out, the order is reversed. */
const RUNES = CIRCLE_PARTS.filter((p) => p.kind === 'rune').length
const LIGHT_ORDER: Record<string, number> = { outer: 0 }
let rune = 0
for (const part of CIRCLE_PARTS) {
  if (part.kind === 'rune') LIGHT_ORDER[part.key] = 1 + rune++
}
LIGHT_ORDER.inner = RUNES + 1
LIGHT_ORDER.star = RUNES + 2

/** How many lighting steps the circle takes, first part to last. */
export const CIRCLE_STEPS = RUNES + 3

/**
 * The summoning circle as inline SVG, one path per part, each carrying
 * its place in the lighting order for the stylesheet to stagger by.
 * Sized and animated entirely by whoever styles `className`.
 */
export function RitualCircle({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${CIRCLE_W} ${CIRCLE_H}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {CIRCLE_PARTS.map((part) => (
        <path
          key={part.key}
          className={`ritual-part ritual-part--${part.kind}`}
          d={part.d}
          style={
            {
              '--order': LIGHT_ORDER[part.key],
              '--reverse': CIRCLE_STEPS - 1 - LIGHT_ORDER[part.key],
            } as CSSProperties
          }
        />
      ))}
    </svg>
  )
}
