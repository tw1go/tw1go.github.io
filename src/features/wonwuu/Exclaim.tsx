import './exclaim.css'

/* Each mark, one character per art pixel. Built into an SVG of unit
   squares, the same way as the hearts, so it scales up without a
   smoothed edge. */
const MARKS = {
  /* The "!": o outline, y fill, w shine. */
  alert: {
    rows: [
      '.ooo.',
      'owyyo',
      'oyyyo',
      'oyyyo',
      'oyyyo',
      '.oyo.',
      '.oyo.',
      '..o..',
      '.ooo.',
      '.oyo.',
      '.ooo.',
    ],
    ink: { o: '#111827', y: '#fde047', w: '#fefce8' },
  },
  /* The cartoon anger vein: four bent corners round an empty middle. */
  anger: {
    rows: [
      '.rr.rr.',
      'rdr.rdr',
      'rr...rr',
      '.......',
      'rr...rr',
      'rdr.rdr',
      '.rr.rr.',
    ],
    ink: { r: '#ef4444', d: '#7f1d1d' },
  },
} as const

export type MarkKind = keyof typeof MARKS

const SRC = Object.fromEntries(
  Object.entries(MARKS).map(([kind, { rows, ink }]) => {
    const cells = rows
      .flatMap((row, y) =>
        [...row].flatMap((c, x) => {
          const fill = (ink as Record<string, string>)[c]
          return fill ? [`<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`] : []
        }),
      )
      .join('')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${rows[0].length} ${rows.length}" shape-rendering="crispEdges">${cells}</svg>`
    return [kind, `url("data:image/svg+xml,${encodeURIComponent(svg)}")`]
  }),
) as Record<MarkKind, string>

/**
 * A mark that pops over an animal's head: the "!" when it spots — or is
 * spotted by — another, or the anger vein when two of them are glaring
 * at each other. Positioned by the parent, which knows where its head is.
 */
export function Exclaim({ className, kind = 'alert' }: { className?: string; kind?: MarkKind }) {
  return (
    <span
      className={`exclaim exclaim--${kind}${className ? ` ${className}` : ''}`}
      style={{ backgroundImage: SRC[kind] }}
      aria-hidden="true"
    />
  )
}
